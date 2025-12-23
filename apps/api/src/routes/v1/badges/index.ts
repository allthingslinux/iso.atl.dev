import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { BadgeService } from "../../../services/badge.service";
import type { AppEnv } from "../../../types";

const badgesRouter = new OpenAPIHono<AppEnv>();

// Get user's badges
const getUserBadgesRoute = createRoute({
  method: "get",
  path: "/users/:userId",
  request: {
    params: z.object({ userId: z.string() }),
  },
  responses: {
    200: {
      description: "User badges",
      content: {
        "application/json": {
          schema: z.array(z.object({
            badgeId: z.string(),
            tier: z.number().nullable(),
            earnedAt: z.string().nullable(),
            badge: z.object({
              id: z.string(),
              name: z.string(),
              description: z.string().nullable(),
              icon: z.string().nullable(),
              type: z.string(),
              points: z.number().nullable(),
            }),
          })),
        },
      },
    },
  },
  tags: ["Badges"],
});

badgesRouter.openapi(getUserBadgesRoute, async (c) => {
  const { userId } = c.req.valid("param");
  const svc = new BadgeService(c.get("db"));
  const badges = await svc.getUserBadges(userId);
  return c.json(badges);
});

// Seed badge definitions (admin)
const seedBadgesRoute = createRoute({
  method: "post",
  path: "/seed",
  request: {
    query: z.object({ userId: z.string().optional() }),
  },
  responses: {
    200: {
      description: "Badges seeded",
      content: {
        "application/json": {
          schema: z.object({ success: z.boolean(), awarded: z.number().optional() }),
        },
      },
    },
  },
  tags: ["Badges"],
});

badgesRouter.openapi(seedBadgesRoute, async (c) => {
  const { userId } = c.req.valid("query");
  const svc = new BadgeService(c.get("db"));
  await svc.seedBadges();
  
  // If userId provided, award sample badges for testing
  if (userId) {
    const awarded = await svc.seedUserBadges(userId);
    return c.json({ success: true, awarded });
  }
  return c.json({ success: true });
});

// List all badges (for badge gallery)
const listBadgesRoute = createRoute({
  method: "get",
  path: "/",
  responses: {
    200: {
      description: "All badges",
      content: {
        "application/json": {
          schema: z.array(z.any()),
        },
      },
    },
  },
  tags: ["Badges"],
});

badgesRouter.openapi(listBadgesRoute, async (c) => {
  const { badges } = await import("@iso/db");
  const db = c.get("db");
  const allBadges = await db.select().from(badges);
  return c.json(allBadges);
});

export { badgesRouter };
