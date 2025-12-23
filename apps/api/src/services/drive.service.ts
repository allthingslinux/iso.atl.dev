import { type DbClient, uploadSessions } from "@iso/db";
import { and, eq, gte, sum } from "drizzle-orm";

type ServiceAccountCredentials = {
  client_email: string;
  private_key: string;
};

type UploadInitParams = {
  userId: string;
  filename: string;
  size: number;
  mimeType?: string;
};

const DAILY_QUOTA_BYTES = 750 * 1024 * 1024 * 1024; // 750GB
const SESSION_EXPIRY_HOURS = 24;
const PEM_HEADER = /-----BEGIN PRIVATE KEY-----/;
const PEM_FOOTER = /-----END PRIVATE KEY-----/;
const NEWLINE_REGEX = /\n/g;

export class DriveService {
  private readonly db: DbClient;
  private readonly credentials: ServiceAccountCredentials;
  private readonly folderId: string;
  private accessToken: string | null = null;
  private tokenExpiry = 0;

  constructor(
    db: DbClient,
    credentials: ServiceAccountCredentials,
    folderId: string
  ) {
    this.db = db;
    this.credentials = credentials;
    this.folderId = folderId;
  }

  async initiateUpload(params: UploadInitParams) {
    const {
      userId,
      filename,
      size,
      mimeType = "application/octet-stream",
    } = params;

    // Check daily quota
    const usedToday = await this.getDailyUsage(userId);
    if (usedToday + size > DAILY_QUOTA_BYTES) {
      throw new Error(
        `Daily quota exceeded. Used: ${usedToday}, Requested: ${size}`
      );
    }

    // Get access token
    const token = await this.getAccessToken();

    // Create resumable upload session
    const response = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Upload-Content-Type": mimeType,
          "X-Upload-Content-Length": size.toString(),
        },
        body: JSON.stringify({
          name: filename,
          parents: [this.folderId],
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create upload session: ${error}`);
    }

    const uploadUri = response.headers.get("Location");
    if (!uploadUri) {
      throw new Error("No upload URI returned");
    }

    // Store session
    const expiresAt = new Date(
      Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000
    );
    const [session] = await this.db
      .insert(uploadSessions)
      .values({
        userId,
        filename,
        size,
        uploadUri,
        status: "initiated",
        expiresAt,
      })
      .returning();

    return {
      sessionId: session.id,
      uploadUri,
      expiresAt: expiresAt.toISOString(),
    };
  }

  async getSessionStatus(sessionId: string) {
    const [session] = await this.db
      .select()
      .from(uploadSessions)
      .where(eq(uploadSessions.id, sessionId))
      .limit(1);

    return session ?? null;
  }

  async completeSession(sessionId: string, driveFileId: string) {
    const [session] = await this.db
      .update(uploadSessions)
      .set({
        status: "completed",
        driveFileId,
        completedAt: new Date(),
      })
      .where(eq(uploadSessions.id, sessionId))
      .returning();

    return session;
  }

  async getDailyUsage(userId: string): Promise<number> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [result] = await this.db
      .select({ total: sum(uploadSessions.size) })
      .from(uploadSessions)
      .where(
        and(
          eq(uploadSessions.userId, userId),
          eq(uploadSessions.status, "completed"),
          gte(uploadSessions.completedAt, oneDayAgo)
        )
      );

    return Number(result?.total ?? 0);
  }

  async getFileMetadata(fileId: string) {
    const token = await this.getAccessToken();

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,size,md5Checksum,sha1Checksum,sha256Checksum&supportsAllDrives=true`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      return null;
    }

    return response.json();
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const jwt = await this.createJWT();
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to get access token");
    }

    const data = (await response.json()) as {
      access_token: string;
      expires_in: number;
    };
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;

    return this.accessToken;
  }

  private async createJWT(): Promise<string> {
    const header = { alg: "RS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: this.credentials.client_email,
      scope: "https://www.googleapis.com/auth/drive.file",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    };

    const encoder = new TextEncoder();
    const headerB64 = btoa(JSON.stringify(header));
    const payloadB64 = btoa(JSON.stringify(payload));
    const signInput = `${headerB64}.${payloadB64}`;

    // Import private key and sign
    const key = await crypto.subtle.importKey(
      "pkcs8",
      this.pemToArrayBuffer(this.credentials.private_key),
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      key,
      encoder.encode(signInput)
    );
    const signatureB64 = btoa(
      String.fromCharCode(...new Uint8Array(signature))
    );

    return `${signInput}.${signatureB64}`;
  }

  private pemToArrayBuffer(pem: string): ArrayBuffer {
    const b64 = pem
      .replace(PEM_HEADER, "")
      .replace(PEM_FOOTER, "")
      .replace(NEWLINE_REGEX, "");
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
