import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { Errors } from "../../../lib/errors";
import { DriveService } from "../../../services/drive.service";
import type { AppEnv } from "../../../types";

const uploads = new OpenAPIHono<AppEnv>();

// Initiate upload
const initiateRoute = createRoute({
  method: "post",
  path: "/initiate",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            filename: z.string().regex(/\.iso$/i, "Must be an ISO file"),
            size: z
              .number()
              .positive()
              .max(5 * 1024 * 1024 * 1024 * 1024), // 5TB max
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Upload session created",
      content: {
        "application/json": {
          schema: z.object({
            sessionId: z.string(),
            uploadUri: z.string(),
            expiresAt: z.string(),
          }),
        },
      },
    },
    400: { description: "Invalid request" },
    429: { description: "Quota exceeded" },
  },
  tags: ["Uploads"],
});

uploads.openapi(initiateRoute, async (c) => {
  const { filename, size } = c.req.valid("json");
  const userId = c.get("userId") ?? "anonymous";

  const credentials = {
    client_email: c.env.GOOGLE_CLIENT_EMAIL ?? "",
    private_key: c.env.GOOGLE_PRIVATE_KEY ?? "",
  };
  const folderId = c.env.GOOGLE_DRIVE_FOLDER_ID ?? "";

  if (!(credentials.client_email && credentials.private_key && folderId)) {
    throw Errors.BAD_REQUEST("Google Drive not configured");
  }

  const drive = new DriveService(c.get("db"), credentials, folderId);

  try {
    const result = await drive.initiateUpload({ userId, filename, size });
    return c.json(result);
  } catch (err) {
    if (err instanceof Error && err.message.includes("quota")) {
      throw Errors.RATE_LIMITED();
    }
    throw err;
  }
});

// Get upload status
const statusRoute = createRoute({
  method: "get",
  path: "/:sessionId",
  request: {
    params: z.object({ sessionId: z.string().uuid() }),
  },
  responses: {
    200: {
      description: "Upload session status",
      content: {
        "application/json": {
          schema: z.object({
            id: z.string(),
            status: z.string(),
            filename: z.string(),
            size: z.number(),
            driveFileId: z.string().nullable(),
            completedAt: z.string().nullable(),
          }),
        },
      },
    },
    404: { description: "Session not found" },
  },
  tags: ["Uploads"],
});

uploads.openapi(statusRoute, async (c) => {
  const { sessionId } = c.req.valid("param");

  const credentials = {
    client_email: c.env.GOOGLE_CLIENT_EMAIL ?? "",
    private_key: c.env.GOOGLE_PRIVATE_KEY ?? "",
  };
  const folderId = c.env.GOOGLE_DRIVE_FOLDER_ID ?? "";

  const drive = new DriveService(c.get("db"), credentials, folderId);
  const session = await drive.getSessionStatus(sessionId);

  if (!session) {
    throw Errors.NOT_FOUND("Upload session");
  }

  return c.json({
    id: session.id,
    status: session.status ?? "unknown",
    filename: session.filename,
    size: Number(session.size),
    driveFileId: session.driveFileId,
    completedAt: session.completedAt?.toISOString() ?? null,
  });
});

// Complete upload (called after client finishes uploading)
const completeRoute = createRoute({
  method: "post",
  path: "/:sessionId/complete",
  request: {
    params: z.object({ sessionId: z.string().uuid() }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            driveFileId: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Upload completed",
      content: {
        "application/json": {
          schema: z.object({ success: z.boolean() }),
        },
      },
    },
  },
  tags: ["Uploads"],
});

uploads.openapi(completeRoute, async (c) => {
  const { sessionId } = c.req.valid("param");
  const { driveFileId } = c.req.valid("json");

  const credentials = {
    client_email: c.env.GOOGLE_CLIENT_EMAIL ?? "",
    private_key: c.env.GOOGLE_PRIVATE_KEY ?? "",
  };
  const folderId = c.env.GOOGLE_DRIVE_FOLDER_ID ?? "";

  const drive = new DriveService(c.get("db"), credentials, folderId);
  await drive.completeSession(sessionId, driveFileId);

  return c.json({ success: true });
});

// Get user's daily quota usage
const quotaRoute = createRoute({
  method: "get",
  path: "/quota",
  responses: {
    200: {
      description: "User quota info",
      content: {
        "application/json": {
          schema: z.object({
            usedBytes: z.number(),
            limitBytes: z.number(),
            remainingBytes: z.number(),
          }),
        },
      },
    },
  },
  tags: ["Uploads"],
});

uploads.openapi(quotaRoute, async (c) => {
  const userId = c.get("userId") ?? "anonymous";

  const credentials = {
    client_email: c.env.GOOGLE_CLIENT_EMAIL ?? "",
    private_key: c.env.GOOGLE_PRIVATE_KEY ?? "",
  };
  const folderId = c.env.GOOGLE_DRIVE_FOLDER_ID ?? "";

  const drive = new DriveService(c.get("db"), credentials, folderId);
  const usedBytes = await drive.getDailyUsage(userId);
  const limitBytes = 750 * 1024 * 1024 * 1024;

  return c.json({
    usedBytes,
    limitBytes,
    remainingBytes: Math.max(0, limitBytes - usedBytes),
  });
});

export { uploads };
