import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { CatalogService } from "../../../services/catalog";
import type { AppEnv } from "../../../types";

const catalog = new OpenAPIHono<AppEnv>();

// Search ISOs
const searchRoute = createRoute({
  method: "get",
  path: "/search",
  request: {
    query: z.object({
      q: z.string().optional(),
      distro: z.string().optional(),
      family: z.string().optional(),
      osType: z.string().optional(),
      arch: z.string().optional(),
      edition: z.string().optional(),
      spin: z.string().optional(),
      isoType: z.string().optional(),
      releaseStage: z.string().optional(),
      hardwareTarget: z.string().optional(),
      status: z.string().optional(),
      page: z.coerce.number().default(1),
      limit: z.coerce.number().default(50),
    }),
  },
  responses: {
    200: {
      description: "Search results",
      content: {
        "application/json": {
          schema: z.object({
            results: z.array(z.any()),
            total: z.number(),
            page: z.number(),
            limit: z.number(),
          }),
        },
      },
    },
  },
  tags: ["Catalog"],
});

catalog.openapi(searchRoute, async (c) => {
  const params = c.req.valid("query");
  const svc = new CatalogService(c.get("db"));
  return c.json(await svc.search(params));
});

// List distributions
const distrosRoute = createRoute({
  method: "get",
  path: "/distributions",
  responses: {
    200: {
      description: "All distributions with family and parent info",
      content: { "application/json": { schema: z.array(z.any()) } },
    },
  },
  tags: ["Catalog"],
});

catalog.openapi(distrosRoute, async (c) => {
  const svc = new CatalogService(c.get("db"));
  return c.json(await svc.getDistributions());
});

// List families
const familiesRoute = createRoute({
  method: "get",
  path: "/families",
  responses: {
    200: {
      description: "All distribution families",
      content: { "application/json": { schema: z.array(z.any()) } },
    },
  },
  tags: ["Catalog"],
});

catalog.openapi(familiesRoute, async (c) => {
  const svc = new CatalogService(c.get("db"));
  return c.json(await svc.getFamilies());
});

export { catalog };
