ALTER TABLE "translation_entries"
	ADD COLUMN IF NOT EXISTS "translation_version" integer DEFAULT 0 NOT NULL,
	ADD COLUMN IF NOT EXISTS "comment_version" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "translation_operations" (
	"doc_id" bigint NOT NULL REFERENCES "translation_docs"("id") ON DELETE CASCADE,
	"operation_id" text NOT NULL,
	"item_key" text NOT NULL,
	"field" text NOT NULL CHECK ("field" IN ('translation', 'comment')),
	"value" text NOT NULL,
	"expected_version" integer NOT NULL,
	"version" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	PRIMARY KEY ("doc_id", "operation_id")
);
