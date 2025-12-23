import { desc, eq, and, type SQL } from "drizzle-orm";
import { activityLog, profiles, type DbClient } from "@iso/db";

export class ActivityService {
  constructor(private db: DbClient) {}

  async list(params: {
    entityType?: string;
    entityId?: string;
    actorId?: string;
    page?: number;
    limit?: number;
  }) {
    const { entityType, entityId, actorId, page = 1, limit = 50 } = params;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];
    if (entityType) conditions.push(eq(activityLog.entityType, entityType));
    if (entityId) conditions.push(eq(activityLog.entityId, entityId));
    if (actorId) conditions.push(eq(activityLog.actorId, actorId));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, countResult] = await Promise.all([
      this.db
        .select({
          id: activityLog.id,
          action: activityLog.action,
          entityType: activityLog.entityType,
          entityId: activityLog.entityId,
          data: activityLog.data,
          createdAt: activityLog.createdAt,
          actor: {
            userId: profiles.userId,
            username: profiles.username,
          },
        })
        .from(activityLog)
        .leftJoin(profiles, eq(activityLog.actorId, profiles.userId))
        .where(where)
        .orderBy(desc(activityLog.createdAt))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: activityLog.id })
        .from(activityLog)
        .where(where)
        .then((r: { count: string }[]) => r.length),
    ]);

    return { items, total: countResult, page, limit };
  }

  async log(entry: {
    actorId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    data?: Record<string, unknown>;
  }) {
    const [result] = await this.db
      .insert(activityLog)
      .values(entry)
      .returning({ id: activityLog.id });
    return result;
  }
}
