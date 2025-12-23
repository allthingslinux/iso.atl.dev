import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { CompletenessService } from "../../../services/completeness.service";
import type { AppEnv } from "../../../types";

const completeness = new OpenAPIHono<AppEnv>();

// Get archive-wide stats
const statsRoute = createRoute({
  method: "get",
  path: "/stats",
  responses: {
    200: {
      description: "Archive completeness stats",
      content: {
        "application/json": {
          schema: z.object({
            total: z.number(),
            avgScore: z.number(),
            complete: z.number(),
            incomplete: z.number(),
          }),
        },
      },
    },
  },
  tags: ["Completeness"],
});

completeness.openapi(statsRoute, async (c) => {
  const svc = new CompletenessService(c.get("db"));
  const stats = await svc.getArchiveStats();
  return c.json(stats);
});

// Get stats by OS type
const byOsTypeRoute = createRoute({
  method: "get",
  path: "/by-os-type",
  responses: {
    200: {
      description: "Completeness by OS type",
      content: {
        "application/json": {
          schema: z.array(
            z.object({
              osType: z.string().nullable(),
              count: z.number(),
              avgScore: z.number(),
            })
          ),
        },
      },
    },
  },
  tags: ["Completeness"],
});

completeness.openapi(byOsTypeRoute, async (c) => {
  const svc = new CompletenessService(c.get("db"));
  return c.json(await svc.getStatsByOsType());
});

// Get incomplete ISOs
const incompleteRoute = createRoute({
  method: "get",
  path: "/incomplete",
  request: {
    query: z.object({
      limit: z.coerce.number().default(50),
      maxScore: z.coerce.number().default(99),
    }),
  },
  responses: {
    200: {
      description: "Incomplete ISOs",
      content: {
        "application/json": {
          schema: z.array(
            z.object({
              id: z.number(),
              filename: z.string(),
              completenessScore: z.number().nullable(),
              version: z.string().nullable(),
              arch: z.string().nullable(),
            })
          ),
        },
      },
    },
  },
  tags: ["Completeness"],
});

completeness.openapi(incompleteRoute, async (c) => {
  const { limit, maxScore } = c.req.valid("query");
  const svc = new CompletenessService(c.get("db"));
  return c.json(await svc.getIncompleteIsos(limit, maxScore));
});

// Recalculate all scores (admin)
const recalculateRoute = createRoute({
  method: "post",
  path: "/recalculate",
  responses: {
    200: {
      description: "Recalculation result",
      content: {
        "application/json": {
          schema: z.object({
            updated: z.number(),
            avgScore: z.number(),
          }),
        },
      },
    },
  },
  tags: ["Completeness"],
});

completeness.openapi(recalculateRoute, async (c) => {
  const svc = new CompletenessService(c.get("db"));
  return c.json(await svc.updateAllScores());
});

export { completeness };
