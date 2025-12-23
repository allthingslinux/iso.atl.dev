import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
// biome-ignore lint/performance/noNamespaceImport: Schema requires namespace import
import * as schema from "./schema";

export type DbClient = ReturnType<typeof createDbClient>;

/**
 * Creates a Drizzle database client.
 * For Cloudflare Workers, each request needs its own connection.
 */
export const createDbClient = (connectionString: string) => {
  const client = postgres(connectionString, { max: 1 });
  return drizzle(client, { schema });
};

// biome-ignore lint/performance/noBarrelFile: Index file used for explicit exports
export * from "./schema";
export * from "./seed";
