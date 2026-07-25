CREATE TYPE "public"."bot_scenario_kind" AS ENUM('funnel', 'broadcast');--> statement-breakpoint
CREATE TABLE "bot_broadcast_runs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"scenario_id" bigint NOT NULL,
	"require_tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"exclude_tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"matched_count" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bot_scenarios" ALTER COLUMN "trigger_type" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "bot_scenarios" ALTER COLUMN "trigger_value" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "bot_scenario_steps" ADD COLUMN "start_scenario_id" bigint;--> statement-breakpoint
ALTER TABLE "bot_scenarios" ADD COLUMN "kind" "bot_scenario_kind" DEFAULT 'funnel' NOT NULL;--> statement-breakpoint
ALTER TABLE "bot_scenarios" ADD COLUMN "cancels_others" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "bot_scenarios" ADD COLUMN "protected_from_cancel" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "bot_broadcast_runs" ADD CONSTRAINT "bot_broadcast_runs_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "public"."bot_scenarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_scenario_steps" ADD CONSTRAINT "bot_scenario_steps_start_scenario_id_fkey" FOREIGN KEY ("start_scenario_id") REFERENCES "public"."bot_scenarios"("id") ON DELETE set null ON UPDATE no action;