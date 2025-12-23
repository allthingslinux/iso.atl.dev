import { type DbClient, isos, distros } from "@iso/db";
import { eq, sql } from "drizzle-orm";

// Field weights based on COMPLETENESS.md Option B
const FIELD_WEIGHTS = {
  // Identity (5 each)
  version: 5,
  arch: 5,
  // Classification (3 each)
  edition: 3,
  spin: 3,
  isoType: 3,
  releaseStage: 3,
  // Technical (2 each)
  libc: 2,
  initSystem: 2,
  hardwareTarget: 2,
  kernelVersion: 2,
  releaseDate: 2,
  language: 2,
  // File info
  size: 3,
  // Verification
  checksumSha256: 8,
  checksumSha1: 2,
  checksumMd5: 2,
} as const;

// Bonus for verified status
const VERIFIED_BONUS = 10;

// Max possible score
const MAX_SCORE = Object.values(FIELD_WEIGHTS).reduce((a, b) => a + b, 0) + VERIFIED_BONUS; // 59

// Fields that don't apply to certain OS types
const NA_FIELDS: Record<string, string[]> = {
  bsd: ["libc", "initSystem", "kernelVersion"],
  unix: ["libc", "initSystem", "kernelVersion"],
  windows: ["libc", "initSystem", "kernelVersion", "spin"],
  vintage: ["libc", "initSystem", "kernelVersion", "spin", "releaseStage"],
  mobile: ["libc", "initSystem"],
};

type IsoRecord = typeof isos.$inferSelect;

export class CompletenessService {
  constructor(private readonly db: DbClient) {}

  // Calculate completeness score for a single ISO
  calculateScore(iso: IsoRecord, osType: string): number {
    const naFields = NA_FIELDS[osType] || [];
    let earned = 0;
    let maxPossible = 0;

    for (const [field, weight] of Object.entries(FIELD_WEIGHTS)) {
      // Skip N/A fields for this OS type
      if (naFields.includes(field)) continue;

      maxPossible += weight;

      const value = iso[field as keyof IsoRecord];
      // Field is filled if not null/undefined and not empty string
      if (value !== null && value !== undefined && value !== "") {
        earned += weight;
      }
    }

    // Add verified bonus
    if (iso.status === "verified") {
      earned += VERIFIED_BONUS;
      maxPossible += VERIFIED_BONUS;
    } else {
      maxPossible += VERIFIED_BONUS; // Still counts toward max
    }

    // Flagged penalty: zero out verification bonus
    if (iso.status === "flagged") {
      earned = Math.max(0, earned - VERIFIED_BONUS);
    }

    return maxPossible > 0 ? Math.round((earned / maxPossible) * 100) : 0;
  }

  // Update completeness score for a single ISO
  async updateIsoScore(isoId: number): Promise<number> {
    const [iso] = await this.db
      .select()
      .from(isos)
      .where(eq(isos.id, isoId))
      .limit(1);

    if (!iso) return 0;

    // Get OS type from distro
    const [distro] = await this.db
      .select({ osType: distros.osType })
      .from(distros)
      .where(eq(distros.id, iso.distroId))
      .limit(1);

    const osType = distro?.osType || "linux";
    const score = this.calculateScore(iso, osType);

    await this.db
      .update(isos)
      .set({ completenessScore: score })
      .where(eq(isos.id, isoId));

    return score;
  }

  // Update all ISO scores (batch operation)
  async updateAllScores(): Promise<{ updated: number; avgScore: number }> {
    // Get all ISOs with their distro's OS type
    const allIsos = await this.db
      .select({
        iso: isos,
        osType: distros.osType,
      })
      .from(isos)
      .leftJoin(distros, eq(isos.distroId, distros.id));

    let totalScore = 0;
    for (const { iso, osType } of allIsos) {
      const score = this.calculateScore(iso, osType || "linux");
      await this.db
        .update(isos)
        .set({ completenessScore: score })
        .where(eq(isos.id, iso.id));
      totalScore += score;
    }

    const avgScore = allIsos.length > 0 ? Math.round(totalScore / allIsos.length) : 0;
    return { updated: allIsos.length, avgScore };
  }

  // Get archive-wide stats
  async getArchiveStats() {
    const result = await this.db
      .select({
        total: sql<number>`count(*)`,
        avgScore: sql<number>`round(avg(${isos.completenessScore}))`,
        complete: sql<number>`count(*) filter (where ${isos.completenessScore} = 100)`,
        incomplete: sql<number>`count(*) filter (where ${isos.completenessScore} < 50)`,
      })
      .from(isos);

    return result[0];
  }

  // Get stats by OS type
  async getStatsByOsType() {
    const result = await this.db
      .select({
        osType: distros.osType,
        count: sql<number>`count(*)`,
        avgScore: sql<number>`round(avg(${isos.completenessScore}))`,
      })
      .from(isos)
      .leftJoin(distros, eq(isos.distroId, distros.id))
      .groupBy(distros.osType);

    return result;
  }

  // Get incomplete ISOs for "Better" page
  async getIncompleteIsos(limit = 50, maxScore = 99) {
    return this.db
      .select({
        id: isos.id,
        filename: isos.filename,
        completenessScore: isos.completenessScore,
        version: isos.version,
        arch: isos.arch,
      })
      .from(isos)
      .where(sql`${isos.completenessScore} < ${maxScore}`)
      .orderBy(isos.completenessScore)
      .limit(limit);
  }

  // Get ISOs missing specific field
  async getIsosMissingField(field: keyof typeof FIELD_WEIGHTS, limit = 50) {
    const column = isos[field as keyof typeof isos];
    if (!column) return [];

    return this.db
      .select({
        id: isos.id,
        filename: isos.filename,
        completenessScore: isos.completenessScore,
      })
      .from(isos)
      .where(sql`${column} IS NULL`)
      .orderBy(isos.completenessScore)
      .limit(limit);
  }
}
