CREATE TABLE "distros" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(256) NOT NULL,
	"name" varchar(256) NOT NULL,
	"family" varchar(50) NOT NULL,
	"description" text,
	CONSTRAINT "distros_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "isos" (
	"id" serial PRIMARY KEY NOT NULL,
	"distro_id" integer,
	"filename" varchar(512) NOT NULL,
	"drive_id" varchar(256) NOT NULL,
	"checksum" varchar(64),
	"version" varchar(50),
	"arch" varchar(50),
	"status" varchar(20) DEFAULT 'STAGING',
	"confidence_score" integer DEFAULT 0,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "isos_drive_id_unique" UNIQUE("drive_id")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"reputation" integer DEFAULT 10 NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "isos" ADD CONSTRAINT "isos_distro_id_distros_id_fk" FOREIGN KEY ("distro_id") REFERENCES "public"."distros"("id") ON DELETE no action ON UPDATE no action;