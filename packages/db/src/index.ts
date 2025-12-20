import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
// biome-ignore lint/performance/noNamespaceImport: Schema requires namespace import
import * as schema from "./schema";

// Minimal client for now
// In production, we'd pass the connection string
export const createDbClient = (connectionString: string) => {
  // Disable prefetch for Cloudflare/Serverless compatibility typically,
  // but here we use postgres.js which is fine.
  const queryClient = postgres(connectionString);
  return drizzle(queryClient, { schema });
};

// biome-ignore lint/performance/noBarrelFile: Index file used for explicit exports
export * from "./schema";
