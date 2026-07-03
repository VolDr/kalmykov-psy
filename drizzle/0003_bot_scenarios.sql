CREATE TYPE "public"."bot_scenario_trigger" AS ENUM('start_param', 'command', 'text');--> statement-breakpoint
CREATE TYPE "public"."bot_scheduled_step_status" AS ENUM('pending', 'sent', 'failed', 'cancelled');--> statement-breakpoint
CREATE TABLE "bot_channel_posts" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"title" text,
	"chat_id" text NOT NULL,
	"message_id" bigint NOT NULL,
	"button_text" text NOT NULL,
	"scenario_id" bigint NOT NULL,
	"require_subscription" boolean DEFAULT true NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bot_scenario_steps" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"scenario_id" bigint NOT NULL,
	"position" integer NOT NULL,
	"delay_seconds" integer DEFAULT 0 NOT NULL,
	"message_text" text,
	"add_tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"set_stage" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bot_scenarios" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"trigger_type" "bot_scenario_trigger" NOT NULL,
	"trigger_value" text NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bot_scheduled_steps" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"contact_id" bigint NOT NULL,
	"scenario_id" bigint NOT NULL,
	"step_id" bigint NOT NULL,
	"status" "bot_scheduled_step_status" DEFAULT 'pending' NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "bot_channel_posts" ADD CONSTRAINT "bot_channel_posts_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "public"."bot_scenarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_scenario_steps" ADD CONSTRAINT "bot_scenario_steps_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "public"."bot_scenarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_scheduled_steps" ADD CONSTRAINT "bot_scheduled_steps_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."bot_contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_scheduled_steps" ADD CONSTRAINT "bot_scheduled_steps_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "public"."bot_scenarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_scheduled_steps" ADD CONSTRAINT "bot_scheduled_steps_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "public"."bot_scenario_steps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bot_scenario_steps_scenario_position_idx" ON "bot_scenario_steps" USING btree ("scenario_id","position");--> statement-breakpoint
CREATE INDEX "bot_scheduled_steps_status_scheduled_idx" ON "bot_scheduled_steps" USING btree ("status","scheduled_at");--> statement-breakpoint
CREATE INDEX "bot_scheduled_steps_contact_idx" ON "bot_scheduled_steps" USING btree ("contact_id");