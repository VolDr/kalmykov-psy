CREATE TABLE "EmailSubscription" (
    "id" text PRIMARY KEY NOT NULL,
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) with time zone NOT NULL,
    "disabled" boolean DEFAULT false NOT NULL,
    "email" text NOT NULL,
    "name" text,
    "unsubscribeKey" text NOT NULL,
    "status" text DEFAULT 'active' NOT NULL
);

CREATE UNIQUE INDEX "EmailSubscription_email_key"
ON "EmailSubscription"
USING btree ("email" text_ops);

CREATE UNIQUE INDEX "EmailSubscription_unsubscribeKey_key"
ON "EmailSubscription"
USING btree ("unsubscribeKey" text_ops);

CREATE INDEX "EmailSubscription_status_idx"
ON "EmailSubscription"
USING btree ("status" text_ops);