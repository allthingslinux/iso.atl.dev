import {
  type DbClient,
  editComments,
  edits,
  editVotes,
  isos,
  distros,
  families,
  profiles,
} from "@iso/db";
import { and, count, eq, sql } from "drizzle-orm";

// Voting thresholds from EDITS.md
const VOTE_THRESHOLD_NORMAL = 2;
const VOTE_THRESHOLD_DESTRUCTIVE = 3;
const EDIT_EXPIRATION_DAYS = 7;
const MAX_EDIT_UPDATES = 3;
const AUTO_PROMOTION_THRESHOLD = 5;

// Destructive fields by entity type
const DESTRUCTIVE_FIELDS: Record<string, string[]> = {
  iso: ["distroId", "driveId", "filename", "checksumMd5", "checksumSha1", "checksumSha256"],
  distro: ["slug", "name", "familyId", "parentId"],
  family: ["slug", "name"],
};

type OperationType = "create" | "modify" | "destroy";
type EditStatus = "pending" | "accepted" | "rejected" | "immediate_accepted" | "immediate_rejected" | "failed" | "canceled";
type VoteType = "accept" | "reject" | "abstain" | "immediate_accept" | "immediate_reject";

export class CurationService {
  constructor(private readonly db: DbClient) {}

  // Check if edit is destructive based on operation and fields
  private isDestructive(operation: OperationType, targetType: string, newData: Record<string, unknown>): boolean {
    if (operation === "destroy") return true;
    if (operation === "create") return false;
    
    const destructiveFields = DESTRUCTIVE_FIELDS[targetType] || [];
    return Object.keys(newData).some(key => destructiveFields.includes(key));
  }

  // Calculate expiration date
  private getExpiresAt(): Date {
    const expires = new Date();
    expires.setDate(expires.getDate() + EDIT_EXPIRATION_DAYS);
    return expires;
  }

  async submitEdit(data: {
    userId: string;
    targetType: string;
    targetId?: string;
    operation: OperationType;
    newData: Record<string, unknown>;
    comment?: string;
    automation?: boolean;
    automationSource?: string;
  }) {
    // Get old data for modify operations
    let oldData: Record<string, unknown> | null = null;
    if (data.operation === "modify" && data.targetId) {
      oldData = await this.getTargetData(data.targetType, data.targetId);
    }

    const destructive = this.isDestructive(data.operation, data.targetType, data.newData);

    const [edit] = await this.db.insert(edits).values({
      userId: data.userId,
      targetType: data.targetType,
      targetId: data.targetId,
      operation: data.operation,
      newData: data.newData,
      oldData,
      destructive,
      automation: data.automation ?? false,
      automationSource: data.automationSource,
      comment: data.comment,
      expiresAt: this.getExpiresAt(),
    }).returning();

    // Update user's edit count
    await this.db
      .update(profiles)
      .set({ editsSubmitted: sql`${profiles.editsSubmitted} + 1` })
      .where(eq(profiles.userId, data.userId));

    return edit;
  }

  private async getTargetData(targetType: string, targetId: string): Promise<Record<string, unknown> | null> {
    if (targetType === "iso") {
      const [iso] = await this.db.select().from(isos).where(eq(isos.id, Number(targetId))).limit(1);
      return iso ? (iso as unknown as Record<string, unknown>) : null;
    }
    if (targetType === "distro") {
      const [distro] = await this.db.select().from(distros).where(eq(distros.id, Number(targetId))).limit(1);
      return distro ? (distro as unknown as Record<string, unknown>) : null;
    }
    if (targetType === "family") {
      const [family] = await this.db.select().from(families).where(eq(families.id, Number(targetId))).limit(1);
      return family ? (family as unknown as Record<string, unknown>) : null;
    }
    return null;
  }

  async getEdit(id: string) {
    const [edit] = await this.db.select().from(edits).where(eq(edits.id, id)).limit(1);
    if (!edit) return null;

    const votes = await this.db.select().from(editVotes).where(eq(editVotes.editId, id));
    const comments = await this.db.select().from(editComments).where(eq(editComments.editId, id));

    return { ...edit, votes, comments };
  }

  async listEdits(status?: EditStatus, page = 1, limit = 20) {
    const where = status ? eq(edits.status, status) : undefined;

    const [items, [{ total }]] = await Promise.all([
      this.db.select().from(edits).where(where).limit(limit).offset((page - 1) * limit).orderBy(edits.createdAt),
      this.db.select({ total: count() }).from(edits).where(where),
    ]);

    return { items, total, page, limit };
  }

  async vote(editId: string, userId: string, vote: VoteType) {
    const edit = await this.getEdit(editId);
    if (!edit || edit.status !== "pending") {
      throw new Error("Can only vote on pending edits");
    }

    // Can't vote on own edit
    if (edit.userId === userId) {
      throw new Error("Cannot vote on your own edit");
    }

    // Handle immediate votes (moderator actions)
    if (vote === "immediate_accept") {
      return this.immediateAccept(editId, userId);
    }
    if (vote === "immediate_reject") {
      return this.immediateReject(editId, userId);
    }

    // Record vote
    await this.db
      .insert(editVotes)
      .values({ editId, userId, vote })
      .onConflictDoUpdate({
        target: [editVotes.editId, editVotes.userId],
        set: { vote, updatedAt: new Date() },
      });

    // Calculate vote count
    const voteCount = await this.calculateVoteCount(editId);
    await this.db.update(edits).set({ voteCount }).where(eq(edits.id, editId));

    // Update user's vote count
    await this.db
      .update(profiles)
      .set({ votesCast: sql`${profiles.votesCast} + 1` })
      .where(eq(profiles.userId, userId));

    // Check for vote badges
    await this.checkVoteBadges(userId);

    // Check thresholds
    await this.checkVotingThreshold(editId);

    return { voteCount };
  }

  private async calculateVoteCount(editId: string): Promise<number> {
    const [{ accepts }] = await this.db
      .select({ accepts: count() })
      .from(editVotes)
      .where(and(eq(editVotes.editId, editId), eq(editVotes.vote, "accept")));

    const [{ rejects }] = await this.db
      .select({ rejects: count() })
      .from(editVotes)
      .where(and(eq(editVotes.editId, editId), eq(editVotes.vote, "reject")));

    return accepts - rejects;
  }

  private async checkVotingThreshold(editId: string) {
    const edit = await this.getEdit(editId);
    if (!edit || edit.status !== "pending") return;

    const threshold = edit.destructive ? VOTE_THRESHOLD_DESTRUCTIVE : VOTE_THRESHOLD_NORMAL;

    const [{ accepts }] = await this.db
      .select({ accepts: count() })
      .from(editVotes)
      .where(and(eq(editVotes.editId, editId), eq(editVotes.vote, "accept")));

    const [{ rejects }] = await this.db
      .select({ rejects: count() })
      .from(editVotes)
      .where(and(eq(editVotes.editId, editId), eq(editVotes.vote, "reject")));

    // Unanimous accept
    if (accepts >= threshold && rejects === 0) {
      await this.acceptEdit(editId);
    }
    // Unanimous reject
    else if (rejects >= threshold && accepts === 0) {
      await this.rejectEdit(editId);
    }
  }

  private async acceptEdit(editId: string) {
    await this.db
      .update(edits)
      .set({ status: "accepted", closedAt: new Date() })
      .where(eq(edits.id, editId));

    // Apply the edit
    await this.applyEdit(editId);
  }

  private async rejectEdit(editId: string) {
    const [edit] = await this.db
      .update(edits)
      .set({ status: "rejected", closedAt: new Date() })
      .where(eq(edits.id, editId))
      .returning();

    if (edit) {
      await this.db
        .update(profiles)
        .set({ editsRejected: sql`${profiles.editsRejected} + 1` })
        .where(eq(profiles.userId, edit.userId));
    }
  }

  private async immediateAccept(editId: string, moderatorId: string) {
    // Record the immediate accept vote
    await this.db
      .insert(editVotes)
      .values({ editId, userId: moderatorId, vote: "immediate_accept" })
      .onConflictDoUpdate({
        target: [editVotes.editId, editVotes.userId],
        set: { vote: "immediate_accept", updatedAt: new Date() },
      });

    await this.db
      .update(edits)
      .set({ status: "immediate_accepted", closedAt: new Date() })
      .where(eq(edits.id, editId));

    await this.applyEdit(editId);

    return { status: "immediate_accepted" };
  }

  private async immediateReject(editId: string, moderatorId: string) {
    await this.db
      .insert(editVotes)
      .values({ editId, userId: moderatorId, vote: "immediate_reject" })
      .onConflictDoUpdate({
        target: [editVotes.editId, editVotes.userId],
        set: { vote: "immediate_reject", updatedAt: new Date() },
      });

    const [edit] = await this.db
      .update(edits)
      .set({ status: "immediate_rejected", closedAt: new Date() })
      .where(eq(edits.id, editId))
      .returning();

    if (edit) {
      await this.db
        .update(profiles)
        .set({ editsRejected: sql`${profiles.editsRejected} + 1` })
        .where(eq(profiles.userId, edit.userId));
    }

    return { status: "immediate_rejected" };
  }

  async cancelEdit(editId: string, userId: string) {
    const edit = await this.getEdit(editId);
    if (!edit) throw new Error("Edit not found");
    if (edit.userId !== userId) throw new Error("Can only cancel your own edits");
    if (edit.status !== "pending") throw new Error("Can only cancel pending edits");

    await this.db
      .update(edits)
      .set({ status: "canceled", closedAt: new Date() })
      .where(eq(edits.id, editId));

    return { status: "canceled" };
  }

  async updateEdit(editId: string, userId: string, newData: Record<string, unknown>, comment?: string) {
    const edit = await this.getEdit(editId);
    if (!edit) throw new Error("Edit not found");
    if (edit.userId !== userId) throw new Error("Can only update your own edits");
    if (edit.status !== "pending") throw new Error("Can only update pending edits");
    if (edit.updateCount >= MAX_EDIT_UPDATES) throw new Error("Maximum updates reached");

    // Clear existing votes
    await this.db.delete(editVotes).where(eq(editVotes.editId, editId));

    // Update the edit
    const [updated] = await this.db
      .update(edits)
      .set({
        newData,
        voteCount: 0,
        updateCount: edit.updateCount + 1,
        updatedAt: new Date(),
        expiresAt: this.getExpiresAt(),
        comment: comment ?? edit.comment,
      })
      .where(eq(edits.id, editId))
      .returning();

    return updated;
  }

  async applyEdit(editId: string) {
    const edit = await this.getEdit(editId);
    if (!edit) return null;

    const acceptedStatuses: EditStatus[] = ["accepted", "immediate_accepted"];
    if (!acceptedStatuses.includes(edit.status as EditStatus)) {
      return null;
    }

    try {
      const data = edit.newData as Record<string, unknown>;

      if (edit.operation === "create") {
        await this.createTarget(edit.targetType, data);
      } else if (edit.operation === "modify" && edit.targetId) {
        await this.modifyTarget(edit.targetType, edit.targetId, data);
      } else if (edit.operation === "destroy" && edit.targetId) {
        await this.destroyTarget(edit.targetType, edit.targetId);
      }

      // Award reputation
      await this.db
        .update(profiles)
        .set({
          reputation: sql`${profiles.reputation} + 5`,
          editsApproved: sql`${profiles.editsApproved} + 1`,
        })
        .where(eq(profiles.userId, edit.userId));

      // Check for edit badges
      await this.checkEditBadges(edit.userId, editId);

      // Check for auto-promotion
      await this.checkAutoPromotion(edit.userId);

      return edit;
    } catch (error) {
      // Mark as failed
      await this.db
        .update(edits)
        .set({ status: "failed", closedAt: new Date() })
        .where(eq(edits.id, editId));

      throw error;
    }
  }

  private async createTarget(targetType: string, data: Record<string, unknown>) {
    if (targetType === "iso") {
      await this.db.insert(isos).values(data as typeof isos.$inferInsert);
    } else if (targetType === "distro") {
      await this.db.insert(distros).values(data as typeof distros.$inferInsert);
    } else if (targetType === "family") {
      await this.db.insert(families).values(data as typeof families.$inferInsert);
    }
  }

  private async modifyTarget(targetType: string, targetId: string, data: Record<string, unknown>) {
    if (targetType === "iso") {
      await this.db.update(isos).set({ ...data, updatedAt: new Date() }).where(eq(isos.id, Number(targetId)));
      // Recalculate completeness score
      await this.updateIsoCompleteness(Number(targetId));
    } else if (targetType === "distro") {
      await this.db.update(distros).set(data).where(eq(distros.id, Number(targetId)));
    } else if (targetType === "family") {
      await this.db.update(families).set(data).where(eq(families.id, Number(targetId)));
    }
  }

  private async destroyTarget(targetType: string, targetId: string) {
    if (targetType === "iso") {
      await this.db.delete(isos).where(eq(isos.id, Number(targetId)));
    } else if (targetType === "distro") {
      await this.db.delete(distros).where(eq(distros.id, Number(targetId)));
    } else if (targetType === "family") {
      await this.db.delete(families).where(eq(families.id, Number(targetId)));
    }
  }

  private async checkAutoPromotion(userId: string) {
    const [profile] = await this.db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    if (profile && profile.editsApproved >= AUTO_PROMOTION_THRESHOLD) {
      // User qualifies for Editor role - this would integrate with auth system
      // For now, just a placeholder
    }
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

  private calculateRank(editsApproved: number): string {
    if (editsApproved >= 50) return "trusted";
    if (editsApproved >= 10) return "curator";
    if (editsApproved >= 1) return "contributor";
    return "viewer";
  }

  // Recalculate completeness score for an ISO
  private async updateIsoCompleteness(isoId: number) {
    const { CompletenessService } = await import("./completeness.service");
    const svc = new CompletenessService(this.db);
    await svc.updateIsoScore(isoId);
  }

  // Check and award badges after edit accepted
  private async checkEditBadges(userId: string, editId: string) {
    const { BadgeService } = await import("./badge.service");
    const svc = new BadgeService(this.db);
    await svc.checkEditBadges(userId, editId);
  }

  // Check and award badges after vote
  private async checkVoteBadges(userId: string) {
    const { BadgeService } = await import("./badge.service");
    const svc = new BadgeService(this.db);
    await svc.checkVoteBadges(userId);
  }
}
