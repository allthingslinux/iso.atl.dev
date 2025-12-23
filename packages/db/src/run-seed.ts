/// <reference types="node" />
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
// biome-ignore lint/performance/noNamespaceImport: Schema requires namespace import
import * as schema from "./schema";
import { seedDemo } from "./seed";

const DATABASE_URL = process.env.DATABASE_URL || "postgres://tuxuser:ChangeThisToAStrongPassword123!@localhost:5432/iso_archive";

async function main() {
  const client = postgres(DATABASE_URL);
  const db = drizzle(client, { schema });

  console.log("Seeding demo data...");
  const result = await seedDemo(db);
  console.log(`Seeded: ${result.families} families, ${result.distros} distros, ${result.isos} ISOs`);

  await client.end();
}

main().catch(console.error);
