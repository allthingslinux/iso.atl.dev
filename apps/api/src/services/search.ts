import { createDbClient, distros, isos } from "@iso/db";
import { and, eq, ilike, or, type SQL } from "drizzle-orm";

export class SearchService {
  private readonly db: ReturnType<typeof createDbClient>;

  constructor() {
    this.db = createDbClient(
      process.env.DATABASE_URL ||
        "postgres://admin:password@localhost:5432/iso_archive"
    );
  }

  async search(query: string, filters?: { distro?: string; arch?: string }) {
    // Basic MVP Search Logic using Postgres ILIKE
    // In production this is replaced by Algolia

    const searchTerm = `%${query}%`;

    const conditions: SQL[] = [];

    if (query) {
      const orCond = or(
        ilike(isos.filename, searchTerm),
        ilike(isos.version, searchTerm)
      );
      if (orCond) {
        conditions.push(orCond);
      }
    }

    if (filters?.arch) {
      conditions.push(eq(isos.arch, filters.arch));
    }

    // Join with Distros to filter by distro name if needed
    // For simple MVP, let's just query flat Isos + Distro join

    const results = await this.db
      .select({
        id: isos.id,
        filename: isos.filename,
        version: isos.version,
        arch: isos.arch,
        distroName: distros.name,
        distroSlug: distros.slug,
      })
      .from(isos)
      .leftJoin(distros, eq(isos.distroId, distros.id))
      .where(and(...conditions))
      .limit(50);

    return results;
  }
}
