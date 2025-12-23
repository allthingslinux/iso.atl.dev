import {
  type DbClient,
  distros,
  families,
  isoStatusEnum,
  isos,
  isoTypeEnum,
  osTypeEnum,
  releaseStageEnum,
} from "@iso/db";
import { and, count, eq, ilike, or, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

type SearchParams = {
  q?: string;
  distro?: string;
  family?: string;
  osType?: string;
  arch?: string;
  edition?: string;
  spin?: string;
  isoType?: string;
  releaseStage?: string;
  libc?: string;
  initSystem?: string;
  hardwareTarget?: string;
  status?: string;
  page?: number;
  limit?: number;
};

export class CatalogService {
  private readonly db: DbClient;

  constructor(db: DbClient) {
    this.db = db;
  }

  async search(params: SearchParams) {
    const { q, page = 1, limit = 50 } = params;
    const conditions: SQL[] = [];
    const parentDistro = alias(distros, "parent_distro");

    if (q) {
      const term = `%${q}%`;
      const match = or(ilike(isos.filename, term), ilike(distros.name, term));
      if (match) {
        conditions.push(match);
      }
    }

    this.addFilterConditions(params, conditions);

    const where = conditions.length ? and(...conditions) : undefined;

    const [results, [{ total }]] = await Promise.all([
      this.db
        .select({
          id: isos.id,
          filename: isos.filename,
          version: isos.version,
          arch: isos.arch,
          edition: isos.edition,
          spin: isos.spin,
          isoType: isos.isoType,
          releaseStage: isos.releaseStage,
          libc: isos.libc,
          initSystem: isos.initSystem,
          hardwareTarget: isos.hardwareTarget,
          language: isos.language,
          size: isos.size,
          status: isos.status,
          distroSlug: distros.slug,
          distroName: distros.name,
          distroOsType: distros.osType,
          familySlug: families.slug,
          familyName: families.name,
          parentSlug: parentDistro.slug,
          parentName: parentDistro.name,
        })
        .from(isos)
        .innerJoin(distros, eq(isos.distroId, distros.id))
        .leftJoin(families, eq(distros.familyId, families.id))
        .leftJoin(parentDistro, eq(distros.parentId, parentDistro.id))
        .where(where)
        .limit(limit)
        .offset((page - 1) * limit),
      this.db
        .select({ total: count() })
        .from(isos)
        .innerJoin(distros, eq(isos.distroId, distros.id))
        .leftJoin(families, eq(distros.familyId, families.id))
        .where(where),
    ]);

    return { results, total, page, limit };
  }

  private addFilterConditions(params: SearchParams, conditions: SQL[]) {
    const {
      distro,
      family,
      osType,
      arch,
      edition,
      spin,
      isoType,
      releaseStage,
      libc,
      initSystem,
      hardwareTarget,
      status,
    } = params;

    if (distro) {
      conditions.push(eq(distros.slug, distro));
    }
    if (family) {
      conditions.push(eq(families.slug, family));
    }
    if (osType && osTypeEnum.enumValues.includes(osType as "linux")) {
      conditions.push(eq(distros.osType, osType as "linux"));
    }
    if (arch) {
      conditions.push(eq(isos.arch, arch));
    }
    if (edition) {
      conditions.push(eq(isos.edition, edition));
    }
    if (spin) {
      conditions.push(eq(isos.spin, spin));
    }
    if (isoType && isoTypeEnum.enumValues.includes(isoType as "live")) {
      conditions.push(eq(isos.isoType, isoType as "live"));
    }
    if (
      releaseStage &&
      releaseStageEnum.enumValues.includes(releaseStage as "stable")
    ) {
      conditions.push(eq(isos.releaseStage, releaseStage as "stable"));
    }
    if (libc) {
      conditions.push(eq(isos.libc, libc));
    }
    if (initSystem) {
      conditions.push(eq(isos.initSystem, initSystem));
    }
    if (hardwareTarget) {
      conditions.push(eq(isos.hardwareTarget, hardwareTarget));
    }
    if (status && isoStatusEnum.enumValues.includes(status as "pending")) {
      conditions.push(eq(isos.status, status as "pending"));
    }
  }

  getDistributions() {
    return this.db
      .select({
        id: distros.id,
        slug: distros.slug,
        name: distros.name,
        osType: distros.osType,
        familySlug: families.slug,
        familyName: families.name,
        parentId: distros.parentId,
        isoCount: count(isos.id),
      })
      .from(distros)
      .leftJoin(families, eq(distros.familyId, families.id))
      .leftJoin(isos, eq(isos.distroId, distros.id))
      .groupBy(distros.id, families.slug, families.name);
  }

  getFamilies() {
    return this.db
      .select({
        id: families.id,
        slug: families.slug,
        name: families.name,
        description: families.description,
        distroCount: count(distros.id),
      })
      .from(families)
      .leftJoin(distros, eq(distros.familyId, families.id))
      .groupBy(families.id);
  }
}
