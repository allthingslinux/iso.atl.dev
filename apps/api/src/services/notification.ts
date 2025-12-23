import { type DbClient, notifications } from "@iso/db";
import { and, eq } from "drizzle-orm";

type CreateParams = {
  userId: string;
  type: string;
  title: string;
  message?: string;
  data?: unknown;
};

export class NotificationService {
  private readonly db: DbClient;

  constructor(db: DbClient) {
    this.db = db;
  }

  list(userId: string) {
    return this.db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(notifications.createdAt);
  }

  async markRead(id: string, userId: string) {
    const [updated] = await this.db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning();
    return updated ?? null;
  }

  async markAllRead(userId: string) {
    const result = await this.db
      .update(notifications)
      .set({ read: true })
      .where(
        and(eq(notifications.userId, userId), eq(notifications.read, false))
      )
      .returning();
    return result.length;
  }

  async create(params: CreateParams) {
    const [notification] = await this.db
      .insert(notifications)
      .values(params)
      .returning();
    return notification;
  }
}
