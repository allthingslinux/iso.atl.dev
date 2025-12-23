import { OpenAPIHono } from "@hono/zod-openapi";
import { createDbClient } from "@iso/db";
import { Scalar } from "@scalar/hono-api-reference";
import { cors } from "hono/cors";
import { createApiEnv } from "./env";
import { errorHandler } from "./lib/errors";
import { v1 } from "./routes/v1";
import type { AppEnv } from "./types";

const app = new OpenAPIHono<AppEnv>();

// Error handler
app.onError(errorHandler);

// CORS
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// DB middleware
app.use("*", async (c, next) => {
  const env = createApiEnv(c.env);
  c.set("db", createDbClient(env.DATABASE_URL));
  await next();
});

// Health check
app.get("/", (c) => c.text("ISO Archive API v1"));

// Mount v1 API
app.route("/api/v1", v1);

// OpenAPI spec
app.doc("/openapi.json", {
  openapi: "3.1.0",
  info: {
    title: "ISO Archive API",
    version: "1.0.0",
    description: "Community-maintained archive of operating system ISOs",
  },
  tags: [
    { name: "Catalog", description: "Search and browse ISOs" },
    { name: "Library", description: "ISO metadata and fingerprints" },
    { name: "Curation", description: "Edit workflow and voting" },
    { name: "Downloads", description: "Download links and torrents" },
    { name: "Admin", description: "Sync and analytics" },
  ],
});

// API docs UI
app.get(
  "/docs",
  Scalar({
    url: "/openapi.json",
    theme: "purple",
    pageTitle: "ISO Archive API",
  })
);

export default app;
