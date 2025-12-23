import {
  type DbClient,
  editComments,
  edits,
  editVotes,
  isos,
  type NewEdit,
  profiles,
} from "@iso/db";
import { and, count, eq, sql } from "drizzle-orm";

const VOTE_THRESHOLD_APPROVE = 3;
const _VOTE_THRESHOLD_DESTRUCTIVE = 5; // For destructive edits (future)
const CURATOR_THRESHOLD = 10;
const TRUSTED_THRESHOLD = 50;

export class CurationService {
  private readonly db: DbClient;

  constructor(db: DbClient) {
    this.db = db;
  }

  async submitEdit(data: NewEdit) {
    const [edit] = await this.db.insert(edits).values(data).returning();
    return edit;
  }

  async getEdit(id: string) {
    const [edit] = await this.db
      .select()
      .from(edits)
      .where(eq(edits.id, id))
      .limit(1);
    return edit ?? null;
  }

  async listEdits(status?: string, page = 1, limit = 20) {
    const where = status
      ? eq(
          edits.status,
          status as "pending" | "approved" | "rejected" | "applied"
        )
      : undefined;

    const [items, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(edits)
        .where(where)
        .limit(limit)
        .offset((page - 1) * limit)
        .orderBy(edits.createdAt),
      this.db.select({ total: count() }).from(edits).where(where),
    ]);

    return { items, total, page, limit };
  }

  async vote(editId: string, userId: string, vote: "yes" | "no" | "abstain") {
    // Record vote
    await this.db
      .insert(editVotes)
      .values({ editId, userId, vote })
      .onConflictDoUpdate({
        target: [editVotes.editId, editVotes.userId],
        set: { vote, createdAt: new Date() },
      });

    // Update vote counts
    const [{ yes }] = await this.db
      .select({ yes: count() })
      .from(editVotes)
      .where(and(eq(editVotes.editId, editId), eq(editVotes.vote, "yes")));

    const [{ no }] = await this.db
      .select({ no: count() })
      .from(editVotes)
      .where(and(eq(editVotes.editId, editId), eq(editVotes.vote, "no")));

    await this.db
      .update(edits)
      .set({ votesYes: yes, votesNo: no })
      .where(eq(edits.id, editId));

    // Check auto-approval
    if (yes >= VOTE_THRESHOLD_APPROVE && no === 0) {
      await this.approveEdit(editId);
    }

    return { yes, no };
  }

  async approveEdit(editId: string) {
    const [edit] = await this.db
      .update(edits)
      .set({ status: "approved", closedAt: new Date() })
      .where(eq(edits.id, editId))
      .returning();

    if (edit) {
      await this.awardReputation(edit.userId, 5);
    }

    return edit;
  }

  async getReputation(userId: string) {
    let [profile] = await this.db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    if (!profile) {
      [profile] = await this.db
        .insert(profiles)
        .values({ userId, reputation: 10 })
        .returning();
    }

    const rank = this.calculateRank(profile.editsApproved);

    return {
      reputation: profile.reputation,
      rank,
      editsSubmitted: profile.editsSubmitted,
      editsApproved: profile.editsApproved,
    };
  }

  private async awardReputation(userId: string, amount: number) {
    await this.db
      .update(profiles)
      .set({
        reputation: sql`${profiles.reputation} + ${amount}`,
        editsApproved: sql`${profiles.editsApproved} + 1`,
      })
      .where(eq(profiles.userId, userId));
  }

  private calculateRank(editsApproved: number): string {
    if (editsApproved >= TRUSTED_THRESHOLD) {
      return "trusted";
    }
    if (editsApproved >= CURATOR_THRESHOLD) {
      return "curator";
    }
    return "contributor";
  }

  async addComment(editId: string, userId: string, text: string) {
    const [comment] = await this.db
      .insert(editComments)
      .values({ editId, userId, text })
      .returning();
    return comment;
  }

  getComments(editId: string) {
    return this.db
      .select()
      .from(editComments)
      .where(eq(editComments.editId, editId))
      .orderBy(editComments.createdAt);
  }

  async applyEdit(editId: string) {
    const edit = await this.getEdit(editId);
    if (!edit || edit.status !== "approved") {
      return null;
    }

    // Apply based on target type
    if (edit.targetType === "iso" && edit.targetId) {
      const data = edit.data as Record<string, unknown>;
      await this.db
        .update(isos)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(isos.id, Number(edit.targetId)));
    }

    // Mark as applied
    const [applied] = await this.db
      .update(edits)
      .set({ status: "applied" })
      .where(eq(edits.id, editId))
      .returning();

    return applied;
  }
}
