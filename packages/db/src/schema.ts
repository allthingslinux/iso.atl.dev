import {
  bigint,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// Enums
export const osTypeEnum = pgEnum("os_type", [
  "linux",
  "bsd",
  "unix",
  "vintage",
  "other",
  "mobile",
  "windows",
]);

export const releaseStageEnum = pgEnum("release_stage", [
  "stable",
  "lts",
  "beta",
  "alpha",
  "rc",
  "snapshot",
  "nightly",
]);

export const isoTypeEnum = pgEnum("iso_type", [
  "live",
  "installer",
  "minimal",
  "netinst",
  "full",
  "server",
  "rescue",
  "cloud",
]);

export const isoStatusEnum = pgEnum("iso_status", [
  "pending",
  "staging",
  "verified",
  "flagged",
  "archived",
]);

export const editStatusEnum = pgEnum("edit_status", [
  "pending",
  "approved",
  "rejected",
  "applied",
]);

export const editTypeEnum = pgEnum("edit_type", [
  "create",
  "update",
  "merge",
  "delete",
]);

export const voteTypeEnum = pgEnum("vote_type", ["yes", "no", "abstain"]);

// Families Table
export const families = pgTable(
  "families",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 50 }).notNull().unique(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    website: varchar("website", { length: 512 }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [index("idx_families_slug").on(table.slug)]
);

// Distros Table
export const distros = pgTable(
  "distros",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 256 }).notNull().unique(),
    name: varchar("name", { length: 256 }).notNull(),
    osType: osTypeEnum("os_type").notNull(),
    familyId: integer("family_id").references(() => families.id),
    // biome-ignore lint/suspicious/noExplicitAny: self-reference requires any for Drizzle
    parentId: integer("parent_id").references((): any => distros.id),
    description: text("description"),
    website: varchar("website", { length: 512 }),
    logoUrl: varchar("logo_url", { length: 512 }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("idx_distros_slug").on(table.slug),
    index("idx_distros_family").on(table.familyId),
    index("idx_distros_parent").on(table.parentId),
    index("idx_distros_os_type").on(table.osType),
  ]
);

// ISOs Table
export const isos = pgTable(
  "isos",
  {
    id: serial("id").primaryKey(),
    distroId: integer("distro_id")
      .notNull()
      .references(() => distros.id),
    filename: varchar("filename", { length: 512 }).notNull(),
    driveId: varchar("drive_id", { length: 256 }).notNull().unique(),
    version: varchar("version", { length: 50 }),
    arch: varchar("arch", { length: 50 }),
    // Classification
    edition: varchar("edition", { length: 50 }),
    spin: varchar("spin", { length: 50 }),
    isoType: isoTypeEnum("iso_type"),
    releaseStage: releaseStageEnum("release_stage").default("stable"),
    // Optional metadata
    libc: varchar("libc", { length: 50 }),
    initSystem: varchar("init_system", { length: 50 }),
    hardwareTarget: varchar("hardware_target", { length: 50 }).default("generic"),
    language: varchar("language", { length: 10 }).default("en"),
    kernelVersion: varchar("kernel_version", { length: 50 }),
    releaseDate: date("release_date"),
    // File info
    size: bigint("size", { mode: "number" }),
    checksumMd5: varchar("checksum_md5", { length: 32 }),
    checksumSha1: varchar("checksum_sha1", { length: 40 }),
    checksumSha256: varchar("checksum_sha256", { length: 64 }),
    // Curation
    status: isoStatusEnum("status").default("pending"),
    confidenceScore: integer("confidence_score").default(0),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_isos_distro").on(table.distroId),
    index("idx_isos_status").on(table.status),
    index("idx_isos_arch").on(table.arch),
    index("idx_isos_version").on(table.version),
    index("idx_isos_edition").on(table.edition),
    index("idx_isos_spin").on(table.spin),
    index("idx_isos_iso_type").on(table.isoType),
    index("idx_isos_release_stage").on(table.releaseStage),
    index("idx_isos_release_date").on(table.releaseDate),
  ]
);

// Profiles Table
export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 256 }).notNull().unique(),
  username: varchar("username", { length: 256 }),
  reputation: integer("reputation").default(10).notNull(),
  editsSubmitted: integer("edits_submitted").default(0).notNull(),
  editsApproved: integer("edits_approved").default(0).notNull(),
  editsRejected: integer("edits_rejected").default(0).notNull(),
  votesCast: integer("votes_cast").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Edits Table
export const edits = pgTable(
  "edits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("user_id", { length: 256 })
      .notNull()
      .references(() => profiles.userId),
    targetType: varchar("target_type", { length: 50 }).notNull(),
    targetId: varchar("target_id", { length: 256 }),
    editType: editTypeEnum("edit_type").notNull(),
    status: editStatusEnum("status").default("pending"),
    data: jsonb("data").notNull(),
    votesYes: integer("votes_yes").default(0).notNull(),
    votesNo: integer("votes_no").default(0).notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at"),
    closedAt: timestamp("closed_at"),
  },
  (table) => [
    index("idx_edits_status").on(table.status),
    index("idx_edits_user").on(table.userId),
    index("idx_edits_target").on(table.targetType, table.targetId),
  ]
);

export const editVotes = pgTable(
  "edit_votes",
  {
    editId: uuid("edit_id")
      .notNull()
      .references(() => edits.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 256 })
      .notNull()
      .references(() => profiles.userId),
    vote: voteTypeEnum("vote").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.editId, table.userId] })]
);

export const editComments = pgTable(
  "edit_comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    editId: uuid("edit_id")
      .notNull()
      .references(() => edits.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 256 })
      .notNull()
      .references(() => profiles.userId),
    text: text("text").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [index("idx_edit_comments_edit").on(table.editId)]
);

// Drafts Table
export const drafts = pgTable(
  "drafts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("user_id", { length: 256 })
      .notNull()
      .references(() => profiles.userId),
    type: varchar("type", { length: 50 }).notNull(),
    data: jsonb("data").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [index("idx_drafts_user").on(table.userId)]
);

// Upload Sessions Table
export const uploadSessions = pgTable(
  "upload_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("user_id", { length: 256 })
      .notNull()
      .references(() => profiles.userId),
    filename: varchar("filename", { length: 512 }).notNull(),
    size: bigint("size", { mode: "number" }).notNull(),
    uploadUri: text("upload_uri").notNull(),
    driveFileId: varchar("drive_file_id", { length: 256 }),
    status: varchar("status", { length: 50 }).default("initiated"),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    completedAt: timestamp("completed_at"),
  },
  (table) => [
    index("idx_upload_sessions_user").on(table.userId),
    index("idx_upload_sessions_status").on(table.status),
  ]
);

// Downloads Table
export const downloads = pgTable(
  "downloads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    isoId: integer("iso_id").references(() => isos.id),
    userId: varchar("user_id", { length: 256 }),
    downloadType: varchar("download_type", { length: 50 }),
    startedAt: timestamp("started_at").defaultNow(),
    completedAt: timestamp("completed_at"),
  },
  (table) => [
    index("idx_downloads_iso").on(table.isoId),
    index("idx_downloads_started").on(table.startedAt),
  ]
);

// Notifications Table
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("user_id", { length: 256 })
      .notNull()
      .references(() => profiles.userId),
    type: varchar("type", { length: 50 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message"),
    data: jsonb("data"),
    read: boolean("read").default(false),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [index("idx_notifications_user").on(table.userId, table.read)]
);

// Activity Log Table
export const activityLog = pgTable(
  "activity_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: varchar("actor_id", { length: 256 }).references(
      () => profiles.userId
    ), // nullable for system actions
    action: varchar("action", { length: 50 }).notNull(), // created, updated, deleted, downloaded, uploaded, approved, rejected
    entityType: varchar("entity_type", { length: 50 }).notNull(), // iso, distro, family, edit, upload
    entityId: varchar("entity_id", { length: 256 }),
    data: jsonb("data"), // diff/context
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("idx_activity_log_actor").on(table.actorId),
    index("idx_activity_log_entity").on(table.entityType, table.entityId),
    index("idx_activity_log_created").on(table.createdAt),
  ]
);

// Collections Table (Future)
export const collections = pgTable("collections", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  curatorId: varchar("curator_id", { length: 256 }).references(
    () => profiles.userId
  ),
  public: boolean("public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const collectionItems = pgTable(
  "collection_items",
  {
    collectionId: integer("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    isoId: integer("iso_id")
      .notNull()
      .references(() => isos.id, { onDelete: "cascade" }),
    position: integer("position"),
    addedAt: timestamp("added_at").defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.collectionId, table.isoId] })]
);

// Zod Schemas
export const insertFamilySchema = createInsertSchema(families);
export const selectFamilySchema = createSelectSchema(families);
export const insertDistroSchema = createInsertSchema(distros);
export const selectDistroSchema = createSelectSchema(distros);
export const insertIsoSchema = createInsertSchema(isos);
export const selectIsoSchema = createSelectSchema(isos);
export const insertProfileSchema = createInsertSchema(profiles);
export const selectProfileSchema = createSelectSchema(profiles);
export const insertEditSchema = createInsertSchema(edits);
export const selectEditSchema = createSelectSchema(edits);
export const insertDraftSchema = createInsertSchema(drafts);
export const selectDraftSchema = createSelectSchema(drafts);

// Types
export type Family = typeof families.$inferSelect;
export type NewFamily = typeof families.$inferInsert;
export type Distro = typeof distros.$inferSelect;
export type NewDistro = typeof distros.$inferInsert;
export type Iso = typeof isos.$inferSelect;
export type NewIso = typeof isos.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Edit = typeof edits.$inferSelect;
export type NewEdit = typeof edits.$inferInsert;
export type EditVote = typeof editVotes.$inferSelect;
export type EditComment = typeof editComments.$inferSelect;
export type Draft = typeof drafts.$inferSelect;
export type NewDraft = typeof drafts.$inferInsert;
export type UploadSession = typeof uploadSessions.$inferSelect;
export type Download = typeof downloads.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Collection = typeof collections.$inferSelect;
export type ActivityLog = typeof activityLog.$inferSelect;
export type NewActivityLog = typeof activityLog.$inferInsert;
