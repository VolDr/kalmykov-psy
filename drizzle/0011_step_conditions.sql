-- DO-блоки и IF NOT EXISTS: миграция накатывалась вручную через psql, поэтому
-- должна безопасно переживать повторный прогон (в том числе через db:migrate).
DO $$ BEGIN
	CREATE TYPE "public"."bot_step_condition" AS ENUM('subscribed', 'not_subscribed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN
	CREATE TYPE "public"."bot_step_button_action" AS ENUM('url', 'check_subscription');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
ALTER TABLE "bot_scenario_steps" ADD COLUMN IF NOT EXISTS "condition" "bot_step_condition";--> statement-breakpoint
ALTER TABLE "bot_scenario_steps" ADD COLUMN IF NOT EXISTS "button_action" "bot_step_button_action" DEFAULT 'url' NOT NULL;
