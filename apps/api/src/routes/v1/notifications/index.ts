import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { NotificationService } from "../../../services/notification";
import type { AppEnv } from "../../../types";

const notificationsRouter = new OpenAPIHono<AppEnv>();

// List notifications
const listRoute = createRoute({
  method: "get",
  path: "/",
  responses: {
    200: {
      description: "User notifications",
      content: { "application/json": { schema: z.array(z.any()) } },
    },
  },
  tags: ["Notifications"],
});

notificationsRouter.openapi(listRoute, async (c) => {
  const userId = c.req.header("X-User-Id") || "anonymous";
  const svc = new NotificationService(c.get("db"));
  return c.json(await svc.list(userId));
});

// Mark single as read
const markReadRoute = createRoute({
  method: "post",
  path: "/:id/read",
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: { description: "Marked as read" },
    404: { description: "Not found" },
  },
  tags: ["Notifications"],
});

notificationsRouter.openapi(markReadRoute, async (c) => {
  const { id } = c.req.valid("param");
  const userId = c.req.header("X-User-Id") || "anonymous";
  const svc = new NotificationService(c.get("db"));
  const result = await svc.markRead(id, userId);
  if (!result) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.json({ success: true });
});

// Mark all as read
const markAllReadRoute = createRoute({
  method: "post",
  path: "/read-all",
  responses: {
    200: {
      description: "All marked as read",
      content: {
        "application/json": { schema: z.object({ count: z.number() }) },
      },
    },
  },
  tags: ["Notifications"],
});

notificationsRouter.openapi(markAllReadRoute, async (c) => {
  const userId = c.req.header("X-User-Id") || "anonymous";
  const svc = new NotificationService(c.get("db"));
  const count = await svc.markAllRead(userId);
  return c.json({ count });
});

export { notificationsRouter as notifications };
