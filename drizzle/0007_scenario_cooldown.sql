CREATE TABLE "bot_scenario_runs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"contact_id" bigint NOT NULL,
	"scenario_id" bigint NOT NULL,
	"last_started_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bot_scenarios" ADD COLUMN "cooldown_days" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "bot_scenario_runs" ADD CONSTRAINT "bot_scenario_runs_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."bot_contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_scenario_runs" ADD CONSTRAINT "bot_scenario_runs_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "public"."bot_scenarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bot_scenario_runs_contact_scenario_key" ON "bot_scenario_runs" USING btree ("contact_id","scenario_id");