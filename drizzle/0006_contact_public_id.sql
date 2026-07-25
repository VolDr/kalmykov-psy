ALTER TABLE "bot_contacts" ADD COLUMN "public_id" bigint;--> statement-breakpoint
-- Бэкфилл существующих контактов случайными 9-значными id
-- (коллизии при текущем объёме нереальны; уникальный индекс ниже подстрахует)
UPDATE "bot_contacts" SET "public_id" = floor(random() * 900000000 + 100000000)::bigint WHERE "public_id" IS NULL;--> statement-breakpoint
ALTER TABLE "bot_contacts" ALTER COLUMN "public_id" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "bot_contacts_public_id_key" ON "bot_contacts" USING btree ("public_id");
