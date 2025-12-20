import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
// biome-ignore lint/performance/noNamespaceImport: Schema requires namespace import
import * as schema from "./schema";

export type DbClient = ReturnType<typeof createDbClient>;

let globalClient: postgres.Sql | undefined;

/**
 * Creates or retrieves a Drizzle database client.
 * In development, we use a global singleton to prevent exhausting connection limits during HMR.
 */
export const createDbClient = (connectionString: string) => {
  if (!globalClient) {
    globalClient = postgres(connectionString, {
      // postgres.js will use multiple connections as needed.
      // For serverless, you might want to limit this or use a connection pooling solution.
      max: 10,
    });
  }

  return drizzle(globalClient, { schema });
};

// biome-ignore lint/performance/noBarrelFile: Index file used for explicit exports
export * from "./schema";
