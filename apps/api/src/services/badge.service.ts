import { type DbClient, badges, userBadges, profiles, authUsers } from "@iso/db";
import { and, eq, isNull, sql } from "drizzle-orm";

// Badge definitions - these get seeded into the badges table
export const BADGE_DEFINITIONS = {
  // Tutorial badges
  "first-edit": { name: "First Edit", description: "Sharing is caring", type: "tutorial", points: 2, icon: "✏️" },
  "first-vote": { name: "First Vote", description: "Democracy in action", type: "tutorial", points: 1, icon: "🗳️" },
  "first-comment": { name: "First Comment", description: "Make yourself known!", type: "tutorial", points: 1, icon: "💬" },
  
  // Achievement badges
  "perfectionist": { name: "Perfectionist", description: "Brought an ISO to 100% completeness", type: "achievement", points: 5, icon: "✨" },
  "completionist": { name: "Completionist", description: "Completed all ISOs for a distro", type: "achievement", points: 10, icon: "🏁" },
  "archaeologist": { name: "Archaeologist", description: "Added a vintage/legacy ISO", type: "achievement", points: 3, icon: "🦴" },
  "polyglot": { name: "Polyglot", description: "Contributed to 5+ OS types", type: "achievement", points: 5, icon: "🌍" },
  "bug-hunter": { name: "Bug Hunter", description: "Flagged ISO with confirmed issue", type: "achievement", points: 3, icon: "🐛" },
  "tie-breaker": { name: "Tie Breaker", description: "Cast the deciding vote", type: "achievement", points: 2, icon: "⚖️" },
  
  // Milestone badges (tier 1-5)
  "contributor": { name: "Contributor", description: "Accepted edits milestone", type: "milestone", points: 2, icon: "📝" },
  "curator": { name: "Curator", description: "Votes cast milestone", type: "milestone", points: 2, icon: "👁️" },
  "archivist": { name: "Archivist", description: "ISOs contributed milestone", type: "milestone", points: 2, icon: "📚" },
  "verifier": { name: "Verifier", description: "Checksums added milestone", type: "milestone", points: 2, icon: "✓" },
  "veteran": { name: "Veteran", description: "Time on site milestone", type: "milestone", points: 2, icon: "⏰" },
  
  // Secret badges
  "night-owl": { name: "Night Owl", hint: "🦉 Who?", description: "Submit edit between 2-5 AM", type: "secret", points: 1, icon: "🦉", secret: true },
  "speed-demon": { name: "Speed Demon", hint: "⚡ Gotta go fast", description: "Edit accepted within 1 hour", type: "secret", points: 1, icon: "⚡", secret: true },
  "necromancer": { name: "Necromancer", hint: "💀 Back from the dead", description: "Edit an ISO untouched for 1+ year", type: "secret", points: 1, icon: "💀", secret: true },
  
  // Special badges
  "founder": { name: "Founder", description: "Original team member", type: "special", points: 50, icon: "🏛️" },
  "pioneer": { name: "Pioneer", description: "First 100 users", type: "special", points: 20, icon: "🚀" },
  "beta-tester": { name: "Beta Tester", description: "Pre-launch contributor", type: "special", points: 15, icon: "🧪" },
} as const;

// Milestone thresholds
const MILESTONE_THRESHOLDS = {
  contributor: [10, 50, 100, 250, 500],
  curator: [10, 50, 100, 250, 500],
  archivist: [10, 50, 100, 250, 500],
  verifier: [10, 50, 100, 250, 500],
};

export class BadgeService {
  constructor(private readonly db: DbClient) {}

  // Award a badge to a user
  async awardBadge(userId: string, badgeId: string, tier?: number, metadata?: Record<string, unknown>) {
    // Check if already has badge
    const [existing] = await this.db
      .select()
      .from(userBadges)
      .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badgeId)))
      .limit(1);

    if (existing) {
      // Update tier if higher
      if (tier && (!existing.tier || tier > existing.tier)) {
        await this.db
          .update(userBadges)
          .set({ tier, metadata: metadata ?? existing.metadata })
          .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badgeId)));
        return { awarded: false, upgraded: true };
      }
      return { awarded: false, upgraded: false };
    }

    // Award new badge
    await this.db.insert(userBadges).values({
      userId,
      badgeId,
      tier,
      metadata,
    });

    // Award reputation points
    const badge = BADGE_DEFINITIONS[badgeId as keyof typeof BADGE_DEFINITIONS];
    if (badge?.points) {
      const points = tier ? badge.points * tier : badge.points;
      await this.db
        .update(profiles)
        .set({ reputation: sql`${profiles.reputation} + ${points}` })
        .where(eq(profiles.userId, userId));
    }

    return { awarded: true, upgraded: false };
  }

  // Remove a conditional badge
  async revokeBadge(userId: string, badgeId: string) {
    await this.db
      .update(userBadges)
      .set({ lostAt: new Date() })
      .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badgeId)));
  }

  // Get user's badges
  async getUserBadges(userId: string) {
    return this.db
      .select({
        badgeId: userBadges.badgeId,
        tier: userBadges.tier,
        earnedAt: userBadges.earnedAt,
        badge: badges,
      })
      .from(userBadges)
      .innerJoin(badges, eq(userBadges.badgeId, badges.id))
      .where(and(eq(userBadges.userId, userId), isNull(userBadges.lostAt)));
  }

  // Check and award badges after edit accepted
  async checkEditBadges(userId: string, editId: string) {
    const [profile] = await this.db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    if (!profile) return;

    // First edit badge
    if (profile.editsApproved === 1) {
      await this.awardBadge(userId, "first-edit");
    }

    // Contributor milestone
    const tier = this.getMilestoneTier(profile.editsApproved, MILESTONE_THRESHOLDS.contributor);
    if (tier > 0) {
      await this.awardBadge(userId, "contributor", tier);
    }
  }

  // Check and award badges after vote
  async checkVoteBadges(userId: string) {
    const [profile] = await this.db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    if (!profile) return;

    // First vote badge
    if (profile.votesCast === 1) {
      await this.awardBadge(userId, "first-vote");
    }

    // Curator milestone
    const tier = this.getMilestoneTier(profile.votesCast, MILESTONE_THRESHOLDS.curator);
    if (tier > 0) {
      await this.awardBadge(userId, "curator", tier);
    }
  }

  // Check for perfectionist badge (ISO at 100%)
  async checkPerfectionistBadge(userId: string, isoId: number, completenessScore: number) {
    if (completenessScore === 100) {
      await this.awardBadge(userId, "perfectionist", undefined, { isoId });
    }
  }

  // Get milestone tier from count
  private getMilestoneTier(count: number, thresholds: number[]): number {
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (count >= thresholds[i]) return i + 1;
    }
    return 0;
  }

  // Seed badge definitions into database
  async seedBadges() {
    for (const [id, def] of Object.entries(BADGE_DEFINITIONS)) {
      await this.db
        .insert(badges)
        .values({
          id,
          name: def.name,
          description: def.description,
          hint: "hint" in def ? def.hint : null,
          icon: def.icon,
          type: def.type as "tutorial" | "achievement" | "milestone" | "secret" | "special",
          points: def.points,
          secret: "secret" in def ? def.secret : false,
        })
        .onConflictDoNothing();
    }
  }

  // Seed sample badges for a user (dev/testing)
  async seedUserBadges(userId: string) {
    // Ensure dev user exists in auth_users
    await this.db
      .insert(authUsers)
      .values({
        id: userId,
        name: userId.includes("admin") ? "Test Admin" : "Test User",
        email: `${userId}@dev.local`,
      })
      .onConflictDoNothing();

    // Ensure profile exists
    await this.db
      .insert(profiles)
      .values({ userId, editsApproved: 25, votesCast: 15 })
      .onConflictDoNothing();

    const sampleBadges = [
      { id: "first-edit", tier: undefined },
      { id: "first-vote", tier: undefined },
      { id: "contributor", tier: 2 },
      { id: "curator", tier: 1 },
      { id: "perfectionist", tier: undefined },
      { id: "night-owl", tier: undefined },
      { id: "beta-tester", tier: undefined },
    ];
    
    let awarded = 0;
    for (const { id, tier } of sampleBadges) {
      const result = await this.awardBadge(userId, id, tier);
      if (result.awarded) awarded++;
    }
    return awarded;
  }
}
