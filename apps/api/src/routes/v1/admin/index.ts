import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { distros, downloads, edits, isos } from "@iso/db";
import { count, eq } from "drizzle-orm";
import { EditExpirationService } from "../../../services/edit-expiration.service";
import type { AppEnv } from "../../../types";

const admin = new OpenAPIHono<AppEnv>();

// Trigger sync (placeholder - would queue job)
const syncRoute = createRoute({
  method: "post",
  path: "/sync",
  responses: {
    200: {
      description: "Sync started",
      content: {
        "application/json": {
          schema: z.object({ jobId: z.string(), status: z.string() }),
        },
      },
    },
  },
  tags: ["Admin"],
});

admin.openapi(syncRoute, (c) =>
  c.json({ jobId: crypto.randomUUID(), status: "queued" })
);

// Close expired edits
const closeExpiredRoute = createRoute({
  method: "post",
  path: "/edits/close-expired",
  responses: {
    200: {
      description: "Expired edits closed",
      content: {
        "application/json": {
          schema: z.object({ accepted: z.number(), rejected: z.number() }),
        },
      },
    },
  },
  tags: ["Admin"],
});

admin.openapi(closeExpiredRoute, async (c) => {
  const svc = new EditExpirationService(c.get("db"));
  return c.json(await svc.closeExpiredEdits());
});

// Analytics overview
const analyticsRoute = createRoute({
  method: "get",
  path: "/analytics/overview",
  responses: {
    200: {
      description: "Platform analytics",
      content: {
        "application/json": {
          schema: z.object({
            totalIsos: z.number(),
            totalDistros: z.number(),
            totalDownloads: z.number(),
            pendingEdits: z.number(),
          }),
        },
      },
    },
  },
  tags: ["Admin"],
});

admin.openapi(analyticsRoute, async (c) => {
  const db = c.get("db");

  const [
    [{ totalIsos }],
    [{ totalDistros }],
    [{ totalDownloads }],
    [{ pendingEdits }],
  ] = await Promise.all([
    db.select({ totalIsos: count() }).from(isos),
    db.select({ totalDistros: count() }).from(distros),
    db.select({ totalDownloads: count() }).from(downloads),
    db
      .select({ pendingEdits: count() })
      .from(edits)
      .where(eq(edits.status, "pending")),
  ]);

  return c.json({ totalIsos, totalDistros, totalDownloads, pendingEdits });
});

export { admin };
