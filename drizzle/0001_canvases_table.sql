-- Migration: Create canvases table for storing canvas data
-- This replaces the in-memory Map with persistent database storage

CREATE TABLE IF NOT EXISTS "Canvas" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"data" jsonb NOT NULL DEFAULT '{}'::jsonb,
	"isPublic" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index for faster queries by userId
CREATE INDEX IF NOT EXISTS "Canvas_userId_idx" ON "Canvas" USING btree ("userId" text_ops);

-- Index for public canvases
CREATE INDEX IF NOT EXISTS "Canvas_isPublic_idx" ON "Canvas" USING btree ("isPublic" bool_ops);

-- Function to auto-update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_canvas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
	NEW."updatedAt" = CURRENT_TIMESTAMP;
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updatedAt on canvas updates
CREATE TRIGGER canvas_updated_at_trigger
	BEFORE UPDATE ON "Canvas"
	FOR EACH ROW
	EXECUTE FUNCTION update_canvas_updated_at();
