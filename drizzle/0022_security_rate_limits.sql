CREATE TABLE IF NOT EXISTS "security_rate_limits" (
	"key_hash" text PRIMARY KEY NOT NULL,
	"hits" integer NOT NULL,
	"reset_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "security_rate_limits_reset_at_idx" ON "security_rate_limits" ("reset_at");
