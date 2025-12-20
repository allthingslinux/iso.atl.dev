import { type createDbClient, distros, isos, profiles } from "@iso/db";
import { eq, sql } from "drizzle-orm";

export class CurationService {
  private readonly db: ReturnType<typeof createDbClient>;
  constructor(db: ReturnType<typeof createDbClient>) {
    this.db = db;
  }

  async getPendingIsos() {
    return await this.db
      .select({
        id: isos.id,
        filename: isos.filename,
        version: isos.version,
        arch: isos.arch,
        distroName: distros.name,
        confidence: isos.confidenceScore, // Aliased to confidence for frontend compatibility
        status: isos.status,
      })
      .from(isos)
      .leftJoin(distros, eq(isos.distroId, distros.id))
      .where(eq(isos.status, "STAGING"))
      .orderBy(isos.id);
  }

  async getReputation(userId: string) {
    const result = await this.db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    if (result.length === 0) {
      // Initialize profile if it doesn't exist
      const newProfile = await this.db
        .insert(profiles)
        .values({ userId, reputation: 10 })
        .returning();
      return newProfile[0].reputation;
    }

    return result[0].reputation;
  }

  async approveIso(id: number, userId: string) {
    // Update status
    const updatedIso = await this.db
      .update(isos)
      .set({ status: "LIVE" })
      .where(eq(isos.id, id))
      .returning();

    // Award reputation
    await this.db
      .insert(profiles)
      .values({ userId, reputation: 11 })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: { reputation: sql`${profiles.reputation} + 1` },
      });

    return updatedIso;
  }

  async rejectIso(id: number, userId: string) {
    const updatedIso = await this.db
      .update(isos)
      .set({ status: "REJECTED" })
      .where(eq(isos.id, id))
      .returning();

    // Ensure profile exists
    await this.getReputation(userId);

    return updatedIso;
  }
}
