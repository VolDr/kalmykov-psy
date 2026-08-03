CREATE TYPE "public"."bot_step_condition" AS ENUM('subscribed', 'not_subscribed');--> statement-breakpoint
CREATE TYPE "public"."bot_step_button_action" AS ENUM('url', 'check_subscription');--> statement-breakpoint
ALTER TABLE "bot_scenario_steps" ADD COLUMN "condition" "bot_step_condition";--> statement-breakpoint
ALTER TABLE "bot_scenario_steps" ADD COLUMN "button_action" "bot_step_button_action" DEFAULT 'url' NOT NULL;
