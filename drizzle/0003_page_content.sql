-- Migration: Add dynamic page content management
-- Created: 2025-11-16

-- Page Content - stores all dynamic content for pages
CREATE TABLE "PageContent" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "pageSlug" TEXT NOT NULL, -- e.g., 'home', 'online-therapy', 'for-doctors', 'sos'
  "sectionKey" TEXT NOT NULL, -- e.g., 'hero', 'about', 'issues', 'seo'
  "content" JSONB NOT NULL, -- flexible structure for any content type
  "sortOrder" INTEGER DEFAULT 0 NOT NULL,
  "isActive" BOOLEAN DEFAULT true NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX "PageContent_pageSlug_sectionKey_key" ON "PageContent" USING btree ("pageSlug", "sectionKey");
CREATE INDEX "PageContent_pageSlug_idx" ON "PageContent" USING btree ("pageSlug");
CREATE INDEX "PageContent_isActive_idx" ON "PageContent" USING btree ("isActive");
CREATE INDEX "PageContent_sortOrder_idx" ON "PageContent" USING btree ("sortOrder");

-- Site Settings - global settings like footer info, header, etc.
CREATE TABLE "SiteSettings" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "key" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "description" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX "SiteSettings_key_key" ON "SiteSettings" USING btree ("key");

-- Insert default site settings
INSERT INTO "SiteSettings" ("id", "key", "value", "description", "updatedAt") VALUES
(gen_random_uuid()::text, 'footer', '{"name": "Калмыков Андрей Викторович", "inn": "ИНН 710710030502"}', 'Footer information', NOW()),
(gen_random_uuid()::text, 'telegramBanner', '{"link": "https://t.me/kalmykov_psy", "text": "Мой тг-канал со всяким полезным — [тык]({link})"}', 'Telegram banner', NOW()),
(gen_random_uuid()::text, 'contacts', '{"whatsapp": "https://api.whatsapp.com/send?phone=79065378241", "telegram": "https://t.me/psy_kalmykov", "telegramBooking": "https://t.me/m/hSP1SM5sYjcy", "phone": "+7 (906) 537-82-41"}', 'Contact information', NOW());
