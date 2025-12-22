# Google Drive Direct Upload Architecture

## Overview

This document describes how users can upload ISOs directly to the Team Drive without proxying through our servers, using Google's resumable upload API with service account authentication.

## API Capabilities (from Google Drive API v3 spec)

| Capability | Value |
|------------|-------|
| **Max file size** | 5,120 GB (5TB per file) |
| **Resumable upload path** | `/resumable/upload/drive/v3/files` |
| **Simple upload path** | `/upload/drive/v3/files` |
| **Accepted MIME types** | `*/*` (any) |
| **Available checksums** | `md5Checksum`, `sha1Checksum`, `sha256Checksum` |
| **Minimal scope** | `https://www.googleapis.com/auth/drive.file` |

## Shared Drive Limits

> Source: [Google Workspace Learning Center](https://support.google.com/a/users/answer/7338880)

### Storage & Items

| Limit | Value | Notes |
|-------|-------|-------|
| **Items per shared drive** | 500,000 | Files + folders + shortcuts + trash |
| **Max file size** | 5 TB | Single file upload limit |
| **Upload quota per user** | 750 GB / 24 hours | Refreshes daily |
| **Folder nesting** | 100 levels | Recommend fewer for usability |
| **Storage limit** | Admin-configurable | Check Drive Details tab |

### Membership

| Limit | Value |
|-------|-------|
| **Total members** | 600 (groups + individuals) |
| **Groups per drive** | 100 max |
| **Total individuals** | 50,000 (including group members) |
| **Drives per group** | 30,000 |

### Important Notes

- **750 GB daily limit**: Each user can upload max 750 GB per 24 hours. Files >750 GB can't be copied (must download/re-upload).
- **Item count warning**: Banner appears when <20% of 500K limit remains.
- **Large groups auto-hidden**: Drives shared with groups >1000 members are hidden by default for overflow members.

### Key File Properties Available

```
id, name, mimeType, size, md5Checksum, sha1Checksum, sha256Checksum,
createdTime, modifiedTime, parents, driveId, originalFilename,
quotaBytesUsed, headRevisionId, webContentLink, webViewLink
```

## Architecture

```
┌─────────────┐     1. Request upload     ┌─────────────┐
│             │ ────────────────────────> │             │
│   Browser   │                           │   Our API   │
│             │ <──────────────────────── │             │
└─────────────┘     4. Return upload URI  └─────────────┘
       │                                         │
       │                                         │ 2. Service account
       │                                         │    creates session
       │                                         ▼
       │                                  ┌─────────────┐
       │   5. Direct upload (GB of data)  │   Google    │
       └─────────────────────────────────>│   Drive     │
                                          │  Team Drive │
                                          └─────────────┘
```

**Key benefit**: Server handles ~1KB (auth + URI). User uploads GBs directly to Google.

## Setup

### 1. Google Cloud Project

```bash
# Create project and enable Drive API
gcloud projects create iso-archive-prod
gcloud services enable drive.googleapis.com
```

### 2. Service Account

```bash
# Create service account
gcloud iam service-accounts create iso-uploader \
  --display-name="ISO Archive Uploader"

# Download key
gcloud iam service-accounts keys create service-account.json \
  --iam-account=iso-uploader@iso-archive-prod.iam.gserviceaccount.com
```

### 3. Team Drive Access

1. Go to Google Admin Console → Apps → Google Workspace → Drive
2. Open Team Drive settings
3. Add service account email as **Content Manager**:
   ```
   iso-uploader@iso-archive-prod.iam.gserviceaccount.com
   ```

### 4. Environment Variables

```bash
# .env
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'  # Full JSON
TEAM_DRIVE_ID=0ABc123...
STAGING_FOLDER_ID=1XYz789...
```

## API Implementation

### Initiate Upload Endpoint

```typescript
// apps/api/src/routes/uploads.ts
import { google } from "googleapis";
import { Hono } from "hono";

const uploads = new Hono();

uploads.post("/initiate", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { filename, size } = await c.req.json();

  // Validation
  if (!filename.endsWith(".iso")) {
    return c.json({ error: "Only .iso files allowed" }, 400);
  }
  if (size > 50 * 1024 * 1024 * 1024) {
    return c.json({ error: "Max 50GB" }, 400);
  }

  // Auth with service account
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(c.env.GOOGLE_SERVICE_ACCOUNT_KEY),
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });

  const drive = google.drive({ version: "v3", auth });

  // Create resumable upload session
  const response = await drive.files.create(
    {
      requestBody: {
        name: `${user.id}_${Date.now()}_${filename}`,
        parents: [c.env.STAGING_FOLDER_ID],
      },
      supportsAllDrives: true,
    },
    {
      params: { uploadType: "resumable" },
      headers: {
        "X-Upload-Content-Type": "application/octet-stream",
        "X-Upload-Content-Length": size.toString(),
      },
    }
  );

  const uploadUri = response.headers.location;

  // Track in database
  const db = c.get("db");
  await db.insert(uploadSessions).values({
    userId: user.id,
    filename,
    size,
    uploadUri,
    status: "initiated",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return c.json({
    uploadUri,
    expiresIn: 604800,
  });
});

export { uploads };
```

### Database Schema

```sql
-- Add to packages/db/src/schema.ts
CREATE TABLE upload_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(256) REFERENCES profiles(user_id),
  filename VARCHAR(512) NOT NULL,
  size BIGINT NOT NULL,
  upload_uri TEXT NOT NULL,
  drive_file_id VARCHAR(256),
  status VARCHAR(50) DEFAULT 'initiated',
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_upload_sessions_user ON upload_sessions(user_id);
CREATE INDEX idx_upload_sessions_status ON upload_sessions(status);
```

## Client Implementation

### Upload Component

```typescript
// apps/web/src/lib/upload.ts
export async function uploadISO(
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ fileId: string }> {
  // 1. Get upload URI from our API
  const initResponse = await fetch("/api/v1/uploads/initiate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      size: file.size,
    }),
  });

  if (!initResponse.ok) {
    throw new Error(await initResponse.text());
  }

  const { uploadUri } = await initResponse.json();

  // 2. Upload directly to Google Drive
  const xhr = new XMLHttpRequest();

  return new Promise((resolve, reject) => {
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress((e.loaded / e.total) * 100);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("Upload failed"));

    xhr.open("PUT", uploadUri);
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    xhr.send(file);
  });
}
```

### Resumable Upload (for large files)

```typescript
// apps/web/src/lib/resumable-upload.ts
export async function resumableUpload(
  file: File,
  uploadUri: string,
  onProgress?: (percent: number) => void
): Promise<void> {
  const CHUNK_SIZE = 256 * 1024 * 1024; // 256MB chunks
  let offset = 0;

  while (offset < file.size) {
    const chunk = file.slice(offset, offset + CHUNK_SIZE);
    const end = Math.min(offset + CHUNK_SIZE, file.size);

    const response = await fetch(uploadUri, {
      method: "PUT",
      headers: {
        "Content-Range": `bytes ${offset}-${end - 1}/${file.size}`,
        "Content-Type": "application/octet-stream",
      },
      body: chunk,
    });

    if (response.status === 308) {
      // Incomplete, continue
      const range = response.headers.get("Range");
      offset = parseInt(range?.split("-")[1] || "0") + 1;
    } else if (response.status === 200) {
      // Complete
      break;
    } else {
      throw new Error(`Upload failed: ${response.status}`);
    }

    onProgress?.((offset / file.size) * 100);
  }
}

// Resume interrupted upload
export async function getUploadProgress(uploadUri: string): Promise<number> {
  const response = await fetch(uploadUri, {
    method: "PUT",
    headers: {
      "Content-Range": "bytes */*",
    },
  });

  if (response.status === 308) {
    const range = response.headers.get("Range");
    return parseInt(range?.split("-")[1] || "0") + 1;
  }

  return 0;
}
```

## Security

### Validation Rules

```typescript
const UPLOAD_RULES = {
  allowedExtensions: [".iso"],
  maxFileSize: 5 * 1024 * 1024 * 1024 * 1024, // 5TB (API limit)
  maxDailyUploadPerUser: 750 * 1024 * 1024 * 1024, // 750GB (quota limit)
  minReputation: 10,
  rateLimit: {
    maxUploads: 5,
    window: "1 hour",
  },
};

async function validateUpload(user: User, req: UploadRequest, db: DbClient) {
  // Extension check
  if (!UPLOAD_RULES.allowedExtensions.some((ext) => req.filename.endsWith(ext))) {
    throw new Error("Invalid file type");
  }

  // Size check (5TB max per file)
  if (req.size > UPLOAD_RULES.maxFileSize) {
    throw new Error("File exceeds 5TB limit");
  }

  // Daily quota check (750GB per user per 24h)
  const last24h = await db
    .select({ total: sql`SUM(size)` })
    .from(uploadSessions)
    .where(
      and(
        eq(uploadSessions.userId, user.id),
        gt(uploadSessions.createdAt, sql`NOW() - INTERVAL '24 hours'`),
        eq(uploadSessions.status, "completed")
      )
    );
  
  if ((last24h[0]?.total || 0) + req.size > UPLOAD_RULES.maxDailyUploadPerUser) {
    throw new Error("Daily upload quota exceeded (750GB/24h)");
  }

  // Reputation check
  if (user.reputation < UPLOAD_RULES.minReputation) {
    throw new Error("Insufficient reputation to upload");
  }

  // Rate limit check
  const recentUploads = await db
    .select()
    .from(uploadSessions)
    .where(
      and(
        eq(uploadSessions.userId, user.id),
        gt(uploadSessions.createdAt, sql`NOW() - INTERVAL '1 hour'`)
      )
    );

  if (recentUploads.length >= UPLOAD_RULES.rateLimit.maxUploads) {
    throw new Error("Upload rate limit exceeded");
  }
}
```

### Credential Security

| Item | Location | Exposure |
|------|----------|----------|
| Service Account Key | Server env only | Never sent to client |
| Upload URI | Returned to client | Temporary, single-use |
| Team Drive ID | Server env only | Never exposed |
| User Auth | Session/API key | Standard auth flow |

## Folder Structure

```
Team Drive (100TB)/
├── staging/
│   ├── pending/          ← Uploads land here
│   ├── processing/       ← Being validated
│   └── quarantine/       ← Failed validation
│
├── archive/              ← Approved ISOs
│   ├── linux/
│   │   ├── ubuntu/
│   │   ├── fedora/
│   │   └── ...
│   ├── bsd/
│   └── windows/
│
└── metadata/             ← Checksums, metadata files
```

## Post-Upload Processing

```typescript
// Triggered after upload completes
async function processUpload(fileId: string, db: DbClient) {
  const drive = getDriveClient();

  // 1. Get file metadata with checksums
  const file = await drive.files.get({
    fileId,
    fields: "id,name,size,md5Checksum,sha1Checksum,sha256Checksum,createdTime,mimeType",
    supportsAllDrives: true,
  });

  // 2. Move to processing folder
  await drive.files.update({
    fileId,
    addParents: PROCESSING_FOLDER_ID,
    removeParents: PENDING_FOLDER_ID,
    supportsAllDrives: true,
  });

  // 3. Create ISO record in database with all checksums
  const iso = await db.insert(isos).values({
    filename: file.data.name,
    driveId: fileId,
    checksum: file.data.sha256Checksum, // Primary
    checksumMd5: file.data.md5Checksum,
    checksumSha1: file.data.sha1Checksum,
    size: parseInt(file.data.size),
    status: "STAGING",
  }).returning();

  // 4. Queue for metadata extraction
  await queue.add("extract-metadata", { isoId: iso.id, fileId });

  // 5. Queue for virus scan
  await queue.add("virus-scan", { isoId: iso.id, fileId });
}
```

## Monitoring

### Upload Metrics

```typescript
// Track upload success/failure rates
const uploadMetrics = {
  initiated: new Counter("uploads_initiated_total"),
  completed: new Counter("uploads_completed_total"),
  failed: new Counter("uploads_failed_total"),
  bytesUploaded: new Counter("uploads_bytes_total"),
};
```

### Cleanup Job

```typescript
// Cron: Clean up expired/abandoned uploads
async function cleanupExpiredUploads() {
  const expired = await db
    .select()
    .from(uploadSessions)
    .where(
      and(
        eq(uploadSessions.status, "initiated"),
        lt(uploadSessions.expiresAt, new Date())
      )
    );

  for (const session of expired) {
    await db
      .update(uploadSessions)
      .set({ status: "expired" })
      .where(eq(uploadSessions.id, session.id));
  }
}
```

## Cost Analysis

| Component | Cost | Notes |
|-----------|------|-------|
| Google Workspace | ~$12/user/mo | Includes pooled storage |
| Server bandwidth | $0 | Direct upload bypasses server |
| API calls | Minimal | Only initiate endpoint |
| Storage | Included | Part of Workspace quota |

## Capacity Planning

With 100TB shared drive and Google's limits:

| Metric | Calculation | Result |
|--------|-------------|--------|
| **Max ISOs (avg 4GB)** | 100TB / 4GB | ~25,000 ISOs |
| **Item limit headroom** | 500K items | Plenty for files + folders |
| **Daily ingest capacity** | 750GB × active uploaders | Scales with users |
| **Concurrent uploaders** | No hard limit | Resumable handles contention |

## References

- [Google Drive API v3 Spec](./google-drive-api-v3.json) - Local copy of API discovery document
- [Google Drive Resumable Upload](https://developers.google.com/drive/api/guides/manage-uploads#resumable)
- [Service Account Auth](https://cloud.google.com/iam/docs/service-accounts)
- [Shared Drives API](https://developers.google.com/drive/api/guides/about-shareddrives)

### API Endpoints Used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/upload/drive/v3/files?uploadType=resumable` | Initiate resumable upload |
| `PUT` | `{resumable_uri}` | Upload file chunks |
| `GET` | `/drive/v3/files/{fileId}` | Get file metadata |
| `PATCH` | `/drive/v3/files/{fileId}` | Update file (move folders) |
| `GET` | `/drive/v3/files` | List files in folder |

### Required Scopes

| Scope | Access Level |
|-------|--------------|
| `drive.file` | Files created by app only (recommended) |
| `drive` | Full Drive access |
| `drive.readonly` | Read-only access |

### files.create Parameters

```json
{
  "supportsAllDrives": true,      // Required for Team/Shared Drives
  "uploadType": "resumable",       // For large files
  "ignoreDefaultVisibility": false,
  "keepRevisionForever": false
}
```
