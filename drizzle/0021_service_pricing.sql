-- Начальные тарифы совпадают с текущими ценами сайта и Робокассы.
CREATE TABLE IF NOT EXISTS "service_pricing" (
  "id" integer PRIMARY KEY NOT NULL,
  "single_price" integer NOT NULL,
  "package_price" integer NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "service_pricing_id_check" CHECK ("id" = 1),
  CONSTRAINT "service_pricing_single_price_check" CHECK ("single_price" BETWEEN 1 AND 1000000),
  CONSTRAINT "service_pricing_package_price_check" CHECK ("package_price" BETWEEN 1 AND 1000000)
);
--> statement-breakpoint
INSERT INTO "service_pricing" ("id", "single_price", "package_price")
VALUES (1, 4000, 14000)
ON CONFLICT ("id") DO NOTHING;
