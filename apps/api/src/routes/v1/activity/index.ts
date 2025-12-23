import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { ActivityService } from "../../../services/activity";
import type { AppEnv } from "../../../types";

const activity = new OpenAPIHono<AppEnv>();

const listRoute = createRoute({
  method: "get",
  path: "/",
  request: {
    query: z.object({
      entityType: z.string().optional(),
      entityId: z.string().optional(),
      actorId: z.string().optional(),
      page: z.coerce.number().default(1),
      limit: z.coerce.number().default(50),
    }),
  },
  responses: {
    200: {
      description: "Activity log entries",
      content: {
        "application/json": {
          schema: z.object({
            items: z.array(z.any()),
            total: z.number(),
            page: z.number(),
            limit: z.number(),
          }),
        },
      },
    },
  },
  tags: ["Activity"],
});

activity.openapi(listRoute, async (c) => {
  const params = c.req.valid("query");
  const svc = new ActivityService(c.get("db"));
  return c.json(await svc.list(params));
});

export { activity };
