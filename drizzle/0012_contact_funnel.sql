-- Замер воронки бота прямо на контакте: отдельная таблица событий тут избыточна,
-- человек проходит воронку один раз, а колонки видны в /admin/bot/contacts.
--
-- IF NOT EXISTS: миграция накатывалась вручную через psql, поэтому должна
-- безопасно переживать повторный прогон (в том числе через db:migrate).
ALTER TABLE "bot_contacts" ADD COLUMN IF NOT EXISTS "metrika_client_id" text;--> statement-breakpoint
ALTER TABLE "bot_contacts" ADD COLUMN IF NOT EXISTS "source_key" text;--> statement-breakpoint
ALTER TABLE "bot_contacts" ADD COLUMN IF NOT EXISTS "bot_started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bot_contacts" ADD COLUMN IF NOT EXISTS "gate_shown_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bot_contacts" ADD COLUMN IF NOT EXISTS "gate_passed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bot_contacts" ADD COLUMN IF NOT EXISTS "metrika_start_sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bot_contacts" ADD COLUMN IF NOT EXISTS "metrika_subscribed_sent_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bot_contacts_source_key_idx" ON "bot_contacts" ("source_key","bot_started_at");--> statement-breakpoint
-- Очередь выгрузки офлайн-конверсий: интересуют только контакты с ClientID
CREATE INDEX IF NOT EXISTS "bot_contacts_metrika_pending_idx" ON "bot_contacts" ("metrika_client_id")
	WHERE "metrika_client_id" IS NOT NULL;
