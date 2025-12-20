import { createDbClient, distros, isos } from "@iso/db";
import { eq } from "drizzle-orm";
import { type DriveService, MockDriveService } from "./drive";
import { parseFilename } from "./parser";

export class SyncService {
  private readonly drive: DriveService;
  private readonly db: ReturnType<typeof createDbClient>;

  constructor() {
    this.drive = new MockDriveService(); // Dependency Injection later
    this.db = createDbClient(
      process.env.DATABASE_URL ||
        "postgres://admin:password@localhost:5432/iso_archive"
    );
  }

  async runSync(folderId: string) {
    console.log(`[Sync] Starting sync for folder: ${folderId}`);
    const files = await this.drive.listFiles(folderId);

    const stats = { new: 0, skipped: 0, errors: 0 };

    for (const file of files) {
      try {
        // 1. Check if exists
        const existing = await this.db
          .select()
          .from(isos)
          .where(eq(isos.driveId, file.id));
        if (existing.length > 0) {
          stats.skipped += 1;
          continue;
        }

        // 2. Parse Filename
        const metadata = parseFilename(file.name);

        // 3. Find/Create Distro (Simplified for MVP)
        // In reality we'd look up the Distro ID from 'metadata.distro' slug
        // For now, assume a Default Distro or create on fly?
        // Let's hardcode ID 1 for MVP or fetch first.
        const distroList = await this.db.select().from(distros).limit(1);
        let distroId = distroList[0]?.id;

        if (!distroId) {
          const newDistro = await this.db
            .insert(distros)
            .values({
              slug: metadata.distro,
              name: metadata.distro,
              family: "Linux",
            })
            .returning();
          distroId = newDistro[0].id;
        }

        // 4. Insert ISO
        await this.db.insert(isos).values({
          distroId,
          filename: file.name,
          driveId: file.id,
          version: metadata.version,
          arch: metadata.arch,
          confidenceScore: metadata.confidence,
          status: "STAGING",
          metadata: {
            original_metadata: metadata,
          },
        });

        stats.new += 1;
        console.log(`[Sync] Imported: ${file.name}`);
      } catch (e) {
        console.error(`[Sync] Error processing ${file.name}:`, e);
        stats.errors += 1;
      }
    }

    return stats;
  }
}
