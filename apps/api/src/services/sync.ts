import { type createDbClient, distros, isos, activityLog } from "@iso/db";
import { eq } from "drizzle-orm";
import { parseFilename } from "./parser";

type DriveFile = { id: string; name: string };
type MockDrive = { listFiles: (folderId: string) => Promise<DriveFile[]> };

const mockDrive: MockDrive = {
  listFiles: async () => [],
};

export class SyncService {
  private readonly drive: MockDrive;
  private readonly db: ReturnType<typeof createDbClient>;

  constructor(db: ReturnType<typeof createDbClient>) {
    this.drive = mockDrive;
    this.db = db;
  }

  async runSync(folderId: string) {
    console.log(`[Sync] Starting sync for folder: ${folderId}`);
    const files = await this.drive.listFiles(folderId);

    const stats = { new: 0, skipped: 0, errors: 0 };

    for (const file of files) {
      try {
        const existing = await this.db
          .select()
          .from(isos)
          .where(eq(isos.driveId, file.id));
        if (existing.length > 0) {
          stats.skipped += 1;
          continue;
        }

        const metadata = parseFilename(file.name);

        const distroList = await this.db.select().from(distros).limit(1);
        let distroId = distroList[0]?.id;

        if (!distroId) {
          const newDistro = await this.db
            .insert(distros)
            .values({
              slug: metadata.distro,
              name: metadata.distro,
              osType: "linux",
            })
            .returning();
          distroId = newDistro[0].id;
        }

        const [newIso] = await this.db.insert(isos).values({
          distroId,
          filename: file.name,
          driveId: file.id,
          version: metadata.version,
          arch: metadata.arch,
          edition: metadata.edition,
          spin: metadata.spin,
          isoType: metadata.isoType as "live" | undefined,
          libc: metadata.libc,
          initSystem: metadata.initSystem,
          hardwareTarget: metadata.hardwareTarget,
          language: metadata.language,
          releaseDate: metadata.releaseDate,
          confidenceScore: metadata.confidence,
          status: "staging",
          metadata: { original_metadata: metadata },
        }).returning({ id: isos.id });

        // Log activity
        await this.db.insert(activityLog).values({
          action: "created",
          entityType: "iso",
          entityId: String(newIso.id),
          data: { filename: file.name, source: "sync" },
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
