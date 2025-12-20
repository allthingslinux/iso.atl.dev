import {
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const distros = pgTable("distros", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 256 }).notNull().unique(),
  name: varchar("name", { length: 256 }).notNull(),
  family: varchar("family", { length: 50 }).notNull(), // Linux, BSD
  description: text("description"),
});

export const isos = pgTable("isos", {
  id: serial("id").primaryKey(),
  distroId: integer("distro_id").references(() => distros.id),
  filename: varchar("filename", { length: 512 }).notNull(),
  driveId: varchar("drive_id", { length: 256 }).notNull().unique(), // Google Drive ID
  checksum: varchar("checksum", { length: 64 }), // SHA256
  version: varchar("version", { length: 50 }),
  arch: varchar("arch", { length: 50 }),
  status: varchar("status", { length: 20 }).default("STAGING"), // STAGING, LIVE
  confidenceScore: integer("confidence_score").default(0),
  metadata: jsonb("metadata"), // Flexible fields
  createdAt: timestamp("created_at").defaultNow(),
});

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 256 }).notNull().unique(),
  reputation: integer("reputation").default(10).notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Zod Schemas
export const insertDistroSchema = createInsertSchema(distros);
export const selectDistroSchema = createSelectSchema(distros);

export const insertIsoSchema = createInsertSchema(isos);
export const selectIsoSchema = createSelectSchema(isos);

export const insertProfileSchema = createInsertSchema(profiles);
export const selectProfileSchema = createSelectSchema(profiles);

// Types
export type Distro = typeof distros.$inferSelect;
export type NewDistro = typeof distros.$inferInsert;

export type Iso = typeof isos.$inferSelect;
export type NewIso = typeof isos.$inferInsert;

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
