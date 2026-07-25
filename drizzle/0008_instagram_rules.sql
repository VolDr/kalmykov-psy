CREATE TYPE "public"."instagram_rule_trigger" AS ENUM('comment', 'dm');--> statement-breakpoint
CREATE TABLE "instagram_processed" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"object_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instagram_rules" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"trigger_type" "instagram_rule_trigger" NOT NULL,
	"keywords" text[] DEFAULT '{}'::text[] NOT NULL,
	"match_exact" boolean DEFAULT false NOT NULL,
	"media_id" text,
	"comment_reply_text" text,
	"dm_text" text,
	"enabled" boolean DEFAULT false NOT NULL,
	"hits" integer DEFAULT 0 NOT NULL,
	"last_hit_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "instagram_processed_object_id_key" ON "instagram_processed" USING btree ("object_id");