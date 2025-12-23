import { zValidator } from "@hono/zod-validator";
import type { DbClient } from "@iso/db";
import {
  CurationActionSchema,
  HelloSchema,
  ReputationSchema,
  SearchSchema,
} from "@iso/validators";
import { Hono } from "hono";

export type ApiContext = {
  db: DbClient;
};

export const createApiRouter = () => {
  const app = new Hono<{ Variables: ApiContext }>();

  // Hello endpoint
  app.get("/hello", zValidator("query", HelloSchema), (c) => {
    const { name } = c.req.valid("query");
    return c.json({
      message: `Hello ${name ?? "World"} from shared @iso/api!`,
    });
  });

  // Trigger sync endpoint
  app.post("/sync", async (c) => c.json({ status: "completed" }));

  // Search endpoint
  app.get("/search", zValidator("query", SearchSchema), (c) => {
    const _input = c.req.valid("query");
    // Implementation will be in apps/api
    return c.json([]);
  });

  // Curation endpoints
  const curation = new Hono<{ Variables: ApiContext }>();

  curation.get("/pending", (c) => c.json([]));

  curation.get("/reputation", zValidator("query", ReputationSchema), (c) => {
    const _input = c.req.valid("query");
    return c.json({ reputation: 0 });
  });

  curation.post("/approve", zValidator("json", CurationActionSchema), (c) => {
    const _input = c.req.valid("json");
    return c.json({ success: true });
  });

  curation.post("/reject", zValidator("json", CurationActionSchema), (c) => {
    const _input = c.req.valid("json");
    return c.json({ success: true });
  });

  app.route("/curation", curation);

  return app;
};
