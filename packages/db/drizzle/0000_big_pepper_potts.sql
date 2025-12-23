CREATE TYPE "public"."edit_status" AS ENUM('pending', 'approved', 'rejected', 'applied');--> statement-breakpoint
CREATE TYPE "public"."edit_type" AS ENUM('create', 'update', 'merge', 'delete');--> statement-breakpoint
CREATE TYPE "public"."iso_status" AS ENUM('pending', 'staging', 'verified', 'flagged', 'archived');--> statement-breakpoint
CREATE TYPE "public"."iso_type" AS ENUM('live', 'installer', 'minimal', 'netinst', 'full', 'server', 'rescue', 'cloud');--> statement-breakpoint
CREATE TYPE "public"."os_type" AS ENUM('linux', 'bsd', 'unix', 'vintage', 'other', 'mobile', 'windows');--> statement-breakpoint
CREATE TYPE "public"."release_stage" AS ENUM('stable', 'lts', 'beta', 'alpha', 'rc', 'snapshot', 'nightly');--> statement-breakpoint
CREATE TYPE "public"."vote_type" AS ENUM('yes', 'no', 'abstain');--> statement-breakpoint
CREATE TABLE "collection_items" (
	"collection_id" integer NOT NULL,
	"iso_id" integer NOT NULL,
	"position" integer,
	"added_at" timestamp DEFAULT now(),
	CONSTRAINT "collection_items_collection_id_iso_id_pk" PRIMARY KEY("collection_id","iso_id")
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"curator_id" varchar(256),
	"public" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "distros" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(256) NOT NULL,
	"name" varchar(256) NOT NULL,
	"os_type" "os_type" NOT NULL,
	"family_id" integer,
	"parent_id" integer,
	"description" text,
	"website" varchar(512),
	"logo_url" varchar(512),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "distros_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "downloads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"iso_id" integer,
	"user_id" varchar(256),
	"download_type" varchar(50),
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"type" varchar(50) NOT NULL,
	"data" jsonb NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "edit_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"edit_id" uuid NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "edit_votes" (
	"edit_id" uuid NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"vote" "vote_type" NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "edit_votes_edit_id_user_id_pk" PRIMARY KEY("edit_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "edits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"target_type" varchar(50) NOT NULL,
	"target_id" varchar(256),
	"edit_type" "edit_type" NOT NULL,
	"status" "edit_status" DEFAULT 'pending',
	"data" jsonb NOT NULL,
	"votes_yes" integer DEFAULT 0 NOT NULL,
	"votes_no" integer DEFAULT 0 NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	"closed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "families" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"website" varchar(512),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "families_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "isos" (
	"id" serial PRIMARY KEY NOT NULL,
	"distro_id" integer NOT NULL,
	"filename" varchar(512) NOT NULL,
	"drive_id" varchar(256) NOT NULL,
	"version" varchar(50),
	"arch" varchar(50),
	"edition" varchar(50),
	"spin" varchar(50),
	"iso_type" "iso_type",
	"release_stage" "release_stage" DEFAULT 'stable',
	"wrapper" varchar(50),
	"hardware_target" varchar(50),
	"language" varchar(10) DEFAULT 'en',
	"kernel_version" varchar(50),
	"release_date" date,
	"size" bigint,
	"checksum_md5" varchar(32),
	"checksum_sha1" varchar(40),
	"checksum_sha256" varchar(64),
	"status" "iso_status" DEFAULT 'pending',
	"confidence_score" integer DEFAULT 0,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "isos_drive_id_unique" UNIQUE("drive_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text,
	"data" jsonb,
	"read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"username" varchar(256),
	"reputation" integer DEFAULT 10 NOT NULL,
	"edits_submitted" integer DEFAULT 0 NOT NULL,
	"edits_approved" integer DEFAULT 0 NOT NULL,
	"edits_rejected" integer DEFAULT 0 NOT NULL,
	"votes_cast" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "upload_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"filename" varchar(512) NOT NULL,
	"size" bigint NOT NULL,
	"upload_uri" text NOT NULL,
	"drive_file_id" varchar(256),
	"status" varchar(50) DEFAULT 'initiated',
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_iso_id_isos_id_fk" FOREIGN KEY ("iso_id") REFERENCES "public"."isos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_curator_id_profiles_user_id_fk" FOREIGN KEY ("curator_id") REFERENCES "public"."profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "distros" ADD CONSTRAINT "distros_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "distros" ADD CONSTRAINT "distros_parent_id_distros_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."distros"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "downloads" ADD CONSTRAINT "downloads_iso_id_isos_id_fk" FOREIGN KEY ("iso_id") REFERENCES "public"."isos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drafts" ADD CONSTRAINT "drafts_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edit_comments" ADD CONSTRAINT "edit_comments_edit_id_edits_id_fk" FOREIGN KEY ("edit_id") REFERENCES "public"."edits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edit_comments" ADD CONSTRAINT "edit_comments_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edit_votes" ADD CONSTRAINT "edit_votes_edit_id_edits_id_fk" FOREIGN KEY ("edit_id") REFERENCES "public"."edits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edit_votes" ADD CONSTRAINT "edit_votes_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edits" ADD CONSTRAINT "edits_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "isos" ADD CONSTRAINT "isos_distro_id_distros_id_fk" FOREIGN KEY ("distro_id") REFERENCES "public"."distros"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload_sessions" ADD CONSTRAINT "upload_sessions_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_distros_slug" ON "distros" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_distros_family" ON "distros" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "idx_distros_parent" ON "distros" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_distros_os_type" ON "distros" USING btree ("os_type");--> statement-breakpoint
CREATE INDEX "idx_downloads_iso" ON "downloads" USING btree ("iso_id");--> statement-breakpoint
CREATE INDEX "idx_downloads_started" ON "downloads" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "idx_drafts_user" ON "drafts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_edit_comments_edit" ON "edit_comments" USING btree ("edit_id");--> statement-breakpoint
CREATE INDEX "idx_edits_status" ON "edits" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_edits_user" ON "edits" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_edits_target" ON "edits" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "idx_families_slug" ON "families" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_isos_distro" ON "isos" USING btree ("distro_id");--> statement-breakpoint
CREATE INDEX "idx_isos_status" ON "isos" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_isos_arch" ON "isos" USING btree ("arch");--> statement-breakpoint
CREATE INDEX "idx_isos_version" ON "isos" USING btree ("version");--> statement-breakpoint
CREATE INDEX "idx_isos_edition" ON "isos" USING btree ("edition");--> statement-breakpoint
CREATE INDEX "idx_isos_spin" ON "isos" USING btree ("spin");--> statement-breakpoint
CREATE INDEX "idx_isos_iso_type" ON "isos" USING btree ("iso_type");--> statement-breakpoint
CREATE INDEX "idx_isos_release_stage" ON "isos" USING btree ("release_stage");--> statement-breakpoint
CREATE INDEX "idx_isos_release_date" ON "isos" USING btree ("release_date");--> statement-breakpoint
CREATE INDEX "idx_notifications_user" ON "notifications" USING btree ("user_id","read");--> statement-breakpoint
CREATE INDEX "idx_upload_sessions_user" ON "upload_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_upload_sessions_status" ON "upload_sessions" USING btree ("status");