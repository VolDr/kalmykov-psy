-- Замер воронки бота прямо на контакте: отдельная таблица событий тут избыточна,
-- человек проходит воронку один раз, а колонки видны в /admin/bot/contacts.
ALTER TABLE "bot_contacts" ADD COLUMN "metrika_client_id" text;--> statement-breakpoint
ALTER TABLE "bot_contacts" ADD COLUMN "source_key" text;--> statement-breakpoint
ALTER TABLE "bot_contacts" ADD COLUMN "bot_started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bot_contacts" ADD COLUMN "gate_shown_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bot_contacts" ADD COLUMN "gate_passed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bot_contacts" ADD COLUMN "metrika_start_sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bot_contacts" ADD COLUMN "metrika_subscribed_sent_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "bot_contacts_source_key_idx" ON "bot_contacts" ("source_key","bot_started_at");--> statement-breakpoint
-- Очередь выгрузки офлайн-конверсий: интересуют только контакты с ClientID
CREATE INDEX "bot_contacts_metrika_pending_idx" ON "bot_contacts" ("metrika_client_id")
	WHERE "metrika_client_id" IS NOT NULL;
