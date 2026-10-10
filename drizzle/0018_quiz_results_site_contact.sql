-- Контакт, с чьей cookie из бота опросник прошли на сайте. Отдельно от
-- contact_id (владелец, забравший разбор по токену): по нему бот находит
-- незабранный результат, когда человек жмёт кнопку напоминания /start quiz_result.
ALTER TABLE "quiz_results" ADD COLUMN IF NOT EXISTS "site_contact_id" bigint;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "quiz_results" ADD CONSTRAINT "quiz_results_site_contact_id_fkey" FOREIGN KEY ("site_contact_id") REFERENCES "public"."bot_contacts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quiz_results_site_contact_id_idx" ON "quiz_results" USING btree ("site_contact_id");
