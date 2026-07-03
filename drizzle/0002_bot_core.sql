CREATE TYPE "public"."bot_message_direction" AS ENUM('in', 'out');--> statement-breakpoint
CREATE TABLE "bot_contacts" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"telegram_user_id" bigint NOT NULL,
	"username" text,
	"first_name" text,
	"last_name" text,
	"stage" text DEFAULT 'new' NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"notes" text,
	"bot_blocked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_interaction_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "bot_messages" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"contact_id" bigint NOT NULL,
	"direction" "bot_message_direction" NOT NULL,
	"telegram_message_id" bigint,
	"text" text,
	"payload" jsonb,
	"sent_by_account_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bot_messages" ADD CONSTRAINT "bot_messages_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."bot_contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bot_contacts_telegram_user_id_key" ON "bot_contacts" USING btree ("telegram_user_id");--> statement-breakpoint
CREATE INDEX "bot_messages_contact_created_idx" ON "bot_messages" USING btree ("contact_id","created_at");