-- Migration: Add categories for articles and full survey management
-- Created: 2025-11-16

-- Article Categories
CREATE TABLE "ArticleCategory" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "sortOrder" INTEGER DEFAULT 0 NOT NULL,
  "disabled" BOOLEAN DEFAULT false NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX "ArticleCategory_slug_key" ON "ArticleCategory" USING btree ("slug");
CREATE INDEX "ArticleCategory_sortOrder_idx" ON "ArticleCategory" USING btree ("sortOrder");

-- Add categoryId to Article
ALTER TABLE "Article" ADD COLUMN "categoryId" TEXT;
CREATE INDEX "Article_categoryId_idx" ON "Article" USING btree ("categoryId");
ALTER TABLE "Article" ADD CONSTRAINT "Article_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "ArticleCategory"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Survey Categories
CREATE TABLE "SurveyCategory" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "sortOrder" INTEGER DEFAULT 0 NOT NULL,
  "disabled" BOOLEAN DEFAULT false NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX "SurveyCategory_slug_key" ON "SurveyCategory" USING btree ("slug");
CREATE INDEX "SurveyCategory_sortOrder_idx" ON "SurveyCategory" USING btree ("sortOrder");

-- Surveys (main table for storing survey configurations)
CREATE TABLE "Survey" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "categoryId" TEXT,
  "config" JSONB NOT NULL, -- Full SurveyConfig object
  "isPublished" BOOLEAN DEFAULT false NOT NULL,
  "sortOrder" INTEGER DEFAULT 0 NOT NULL,
  "disabled" BOOLEAN DEFAULT false NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX "Survey_slug_key" ON "Survey" USING btree ("slug");
CREATE INDEX "Survey_categoryId_idx" ON "Survey" USING btree ("categoryId");
CREATE INDEX "Survey_isPublished_idx" ON "Survey" USING btree ("isPublished");
CREATE INDEX "Survey_sortOrder_idx" ON "Survey" USING btree ("sortOrder");

ALTER TABLE "Survey" ADD CONSTRAINT "Survey_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "SurveyCategory"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Survey Results (stores user responses)
CREATE TABLE "SurveyResult" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "surveyId" TEXT NOT NULL,
  "clientId" TEXT,
  "sessionId" TEXT,
  "answers" JSONB NOT NULL, -- { questionId: value, ... }
  "totalScore" DOUBLE PRECISION NOT NULL,
  "maxScore" DOUBLE PRECISION NOT NULL,
  "interpretation" TEXT,
  "interpretationSeverity" TEXT,
  "interpretationColor" TEXT,
  "subscaleResults" JSONB, -- Array of subscale scores
  "warnings" JSONB, -- Array of triggered warnings
  "completedAt" TIMESTAMP(3) NOT NULL,
  "disabled" BOOLEAN DEFAULT false NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "SurveyResult_surveyId_idx" ON "SurveyResult" USING btree ("surveyId");
CREATE INDEX "SurveyResult_clientId_idx" ON "SurveyResult" USING btree ("clientId");
CREATE INDEX "SurveyResult_completedAt_idx" ON "SurveyResult" USING btree ("completedAt" DESC);
CREATE INDEX "SurveyResult_sessionId_idx" ON "SurveyResult" USING btree ("sessionId");

ALTER TABLE "SurveyResult" ADD CONSTRAINT "SurveyResult_surveyId_fkey"
  FOREIGN KEY ("surveyId") REFERENCES "Survey"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SurveyResult" ADD CONSTRAINT "SurveyResult_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "Client"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
