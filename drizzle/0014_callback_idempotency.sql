-- IF NOT EXISTS + пересоздание FK позволяют безопасно применить файл, даже если
-- ранняя версия этой миграции уже успела добавить две первые колонки и CASCADE-связь.
ALTER TABLE "bot_scheduled_steps" ADD COLUMN IF NOT EXISTS "source_step_id" bigint;--> statement-breakpoint
ALTER TABLE "bot_scheduled_steps" ADD COLUMN IF NOT EXISTS "source_message_id" bigint;--> statement-breakpoint
ALTER TABLE "bot_scheduled_steps" ADD COLUMN IF NOT EXISTS "cancellation_reason" text;--> statement-breakpoint
ALTER TABLE "bot_scheduled_steps" ADD COLUMN IF NOT EXISTS "message_telegram_id" bigint;--> statement-breakpoint
ALTER TABLE "bot_scheduled_steps" ADD COLUMN IF NOT EXISTS "file_telegram_message_id" bigint;--> statement-breakpoint
ALTER TABLE "bot_scheduled_steps" ADD COLUMN IF NOT EXISTS "effects_applied_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bot_scheduled_steps" ADD COLUMN IF NOT EXISTS "child_scenario_started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bot_scheduled_steps" DROP CONSTRAINT IF EXISTS "bot_scheduled_steps_source_step_id_fkey";--> statement-breakpoint
ALTER TABLE "bot_scheduled_steps" ADD CONSTRAINT "bot_scheduled_steps_source_step_id_fkey" FOREIGN KEY ("source_step_id") REFERENCES "public"."bot_scenario_steps"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
-- Индекс частичный: под ограничение попадают только продолжения после
-- шлагбаума, а не каждая строка рассылки. DROP перед CREATE — на случай, если
-- ранняя (полная) версия индекса уже успела уехать в базу.
-- Если таблица успеет вырасти, безопаснее применять руками, вне транзакции:
--   CREATE UNIQUE INDEX CONCURRENTLY ...
DROP INDEX IF EXISTS "bot_scheduled_steps_gate_callback_key";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "bot_scheduled_steps_gate_callback_key" ON "bot_scheduled_steps" USING btree ("contact_id","source_step_id","source_message_id") WHERE "source_step_id" IS NOT NULL;
