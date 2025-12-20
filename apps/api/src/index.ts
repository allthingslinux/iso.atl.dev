import { trpcServer } from "@hono/trpc-server";
import { createTRPCContext } from "@iso/api";
import { createDbClient } from "@iso/db";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { appRouter } from "./router";

type Bindings = {
  DATABASE_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS for the web app
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "x-trpc-source"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  })
);

// Health check
app.get("/", (c) => c.text("ISO Archive API is running"));

// tRPC Adapter
import { createApiEnv } from "./env";

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: async (_opts, c) => {
      // Validate environment variables using the runtime env
      const env = createApiEnv(c.env);
      const db = createDbClient(env.DATABASE_URL);
      return await createTRPCContext({ db });
    },
  })
);

export default app;
