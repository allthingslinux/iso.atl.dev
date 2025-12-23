import { type DbClient, distros, families, type Iso, isos, activityLog } from "@iso/db";
import { count, eq } from "drizzle-orm";

type ParentInfo = { slug: string; name: string } | null;

export class LibraryService {
  private readonly db: DbClient;

  constructor(db: DbClient) {
    this.db = db;
  }

  async getIso(id: number) {
    const [iso] = await this.db
      .select({
        id: isos.id,
        filename: isos.filename,
        driveId: isos.driveId,
        version: isos.version,
        arch: isos.arch,
        edition: isos.edition,
        spin: isos.spin,
        isoType: isos.isoType,
        releaseStage: isos.releaseStage,
        releaseDate: isos.releaseDate,
        libc: isos.libc,
        initSystem: isos.initSystem,
        hardwareTarget: isos.hardwareTarget,
        kernelVersion: isos.kernelVersion,
        language: isos.language,
        size: isos.size,
        checksumMd5: isos.checksumMd5,
        checksumSha1: isos.checksumSha1,
        checksumSha256: isos.checksumSha256,
        status: isos.status,
        confidenceScore: isos.confidenceScore,
        createdAt: isos.createdAt,
        updatedAt: isos.updatedAt,
        distroId: distros.id,
        distroSlug: distros.slug,
        distroName: distros.name,
        distroOsType: distros.osType,
        distroWebsite: distros.website,
        familySlug: families.slug,
        familyName: families.name,
      })
      .from(isos)
      .innerJoin(distros, eq(isos.distroId, distros.id))
      .leftJoin(families, eq(distros.familyId, families.id))
      .where(eq(isos.id, id))
      .limit(1);

    return iso ?? null;
  }

  async getFingerprint(id: number) {
    const [iso] = await this.db
      .select({
        md5: isos.checksumMd5,
        sha1: isos.checksumSha1,
        sha256: isos.checksumSha256,
      })
      .from(isos)
      .where(eq(isos.id, id))
      .limit(1);

    return iso ?? null;
  }

  async getDistro(slug: string) {
    const [distro] = await this.db
      .select({
        id: distros.id,
        slug: distros.slug,
        name: distros.name,
        osType: distros.osType,
        description: distros.description,
        website: distros.website,
        logoUrl: distros.logoUrl,
        familyId: families.id,
        familySlug: families.slug,
        familyName: families.name,
        parentId: distros.parentId,
      })
      .from(distros)
      .leftJoin(families, eq(distros.familyId, families.id))
      .where(eq(distros.slug, slug))
      .limit(1);

    if (!distro) {
      return null;
    }

    let parent: ParentInfo = null;
    if (distro.parentId) {
      const [p] = await this.db
        .select({ slug: distros.slug, name: distros.name })
        .from(distros)
        .where(eq(distros.id, distro.parentId))
        .limit(1);
      parent = p ?? null;
    }

    const children = await this.db
      .select({ slug: distros.slug, name: distros.name })
      .from(distros)
      .where(eq(distros.parentId, distro.id));

    const [{ isoCount }] = await this.db
      .select({ isoCount: count() })
      .from(isos)
      .where(eq(isos.distroId, distro.id));

    return {
      id: distro.id,
      slug: distro.slug,
      name: distro.name,
      osType: distro.osType,
      family: distro.familyId
        ? {
            id: distro.familyId,
            slug: distro.familySlug,
            name: distro.familyName,
          }
        : null,
      parent,
      children,
      description: distro.description,
      website: distro.website,
      logoUrl: distro.logoUrl,
      isoCount,
    };
  }

  async updateIso(id: number, data: Partial<Iso>, actorId?: string) {
    const [updated] = await this.db
      .update(isos)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(isos.id, id))
      .returning();

    if (updated) {
      await this.db.insert(activityLog).values({
        actorId,
        action: "updated",
        entityType: "iso",
        entityId: String(id),
        data: data as Record<string, unknown>,
      });
    }

    return updated;
  }
}
