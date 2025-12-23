import { type DbClient, edits } from "@iso/db";
import { and, eq, lt, sql } from "drizzle-orm";

export class EditExpirationService {
  constructor(private readonly db: DbClient) {}

  // Close expired pending edits
  async closeExpiredEdits(): Promise<{ accepted: number; rejected: number }> {
    const now = new Date();
    
    // Find expired pending edits
    const expiredEdits = await this.db
      .select()
      .from(edits)
      .where(
        and(
          eq(edits.status, "pending"),
          lt(edits.expiresAt, now)
        )
      );

    let accepted = 0;
    let rejected = 0;

    for (const edit of expiredEdits) {
      if (edit.voteCount >= 1) {
        // Positive votes - accept
        await this.db
          .update(edits)
          .set({ status: "accepted", closedAt: now })
          .where(eq(edits.id, edit.id));
        accepted++;
        
        // TODO: Apply the edit (would need CurationService)
      } else {
        // Zero or negative votes - reject
        await this.db
          .update(edits)
          .set({ status: "rejected", closedAt: now })
          .where(eq(edits.id, edit.id));
        rejected++;
      }
    }

    return { accepted, rejected };
  }

  // Get count of edits expiring soon (within 24 hours)
  async getExpiringSoon(): Promise<number> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(edits)
      .where(
        and(
          eq(edits.status, "pending"),
          lt(edits.expiresAt, tomorrow)
        )
      );

    return Number(count);
  }
}
