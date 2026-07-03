CREATE TYPE "lead_magnet_event_status" AS ENUM('pending', 'sent', 'failed');
--> statement-breakpoint
CREATE TABLE "lead_magnet_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"client_id" bigint NOT NULL,
	"lead_magnet" text NOT NULL,
	"event_name" text NOT NULL,
	"status" "lead_magnet_event_status" DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"sent_at" timestamptz
);
--> statement-breakpoint
CREATE UNIQUE INDEX "lead_magnet_events_client_magnet_event_key" ON "lead_magnet_events" ("client_id","lead_magnet","event_name");
