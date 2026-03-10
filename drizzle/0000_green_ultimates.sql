-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "Source" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) with time zone NOT NULL,
	"disabled" boolean DEFAULT false NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Client" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) with time zone NOT NULL,
	"disabled" boolean DEFAULT false NOT NULL,
	"name" text NOT NULL,
	"description" varchar,
	"nick" text,
	"sourceId" bigint NOT NULL,
	"invocation" text,
	"gender" text
);
--> statement-breakpoint
CREATE TABLE "Activity" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) with time zone NOT NULL,
	"disabled" boolean DEFAULT false NOT NULL,
	"scheduledDate" timestamp(3) with time zone NOT NULL,
	"scheduledDay" timestamp(3) with time zone NOT NULL,
	"description" text,
	"rejectReason" text,
	"status" text NOT NULL,
	"income" numeric(65, 30),
	"clientId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Contact" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) with time zone NOT NULL,
	"disabled" boolean DEFAULT false NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"clientId" text NOT NULL,
	"contactTypeId" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ContactType" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) with time zone NOT NULL,
	"disabled" boolean DEFAULT false NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CurrentState" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) with time zone NOT NULL,
	"disabled" boolean DEFAULT false NOT NULL,
	"editable" boolean DEFAULT true NOT NULL,
	"individual" double precision NOT NULL,
	"family" double precision NOT NULL,
	"social" double precision NOT NULL,
	"generally" double precision NOT NULL,
	"clientId" text NOT NULL,
	"smallId" text NOT NULL,
	"datetime" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) with time zone NOT NULL,
	"disabled" boolean DEFAULT false NOT NULL,
	"editable" boolean DEFAULT true NOT NULL,
	"attitude" double precision NOT NULL,
	"goals" double precision NOT NULL,
	"method" double precision NOT NULL,
	"generally" double precision NOT NULL,
	"clientId" text NOT NULL,
	"smallId" text NOT NULL,
	"datetime" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Account" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"disabled" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "_prisma_migrations" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"checksum" varchar(64) NOT NULL,
	"finished_at" timestamp with time zone,
	"migration_name" varchar(255) NOT NULL,
	"logs" text,
	"rolled_back_at" timestamp with time zone,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"applied_steps_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Article" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"content" jsonb NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"imageUrl" text,
	"viewCount" integer DEFAULT 0 NOT NULL,
	"uri" text NOT NULL,
	"descriptionMeta" text
);
--> statement-breakpoint
ALTER TABLE "Client" ADD CONSTRAINT "Client_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "public"."Source"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_contactTypeId_fkey" FOREIGN KEY ("contactTypeId") REFERENCES "public"."ContactType"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "CurrentState" ADD CONSTRAINT "CurrentState_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "Source_name_key" ON "Source" USING btree ("name" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "Client_name_key" ON "Client" USING btree ("name" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "Client_nick_key" ON "Client" USING btree ("nick" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "Contact_contactTypeId_value_key" ON "Contact" USING btree ("contactTypeId" int8_ops,"value" int8_ops);--> statement-breakpoint
CREATE INDEX "Contact_value_idx" ON "Contact" USING btree ("value" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "ContactType_name_key" ON "ContactType" USING btree ("name" text_ops);--> statement-breakpoint
CREATE INDEX "CurrentState_smallId_idx" ON "CurrentState" USING btree ("smallId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "CurrentState_smallId_key" ON "CurrentState" USING btree ("smallId" text_ops);--> statement-breakpoint
CREATE INDEX "Feedback_smallId_idx" ON "Feedback" USING btree ("smallId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "Feedback_smallId_key" ON "Feedback" USING btree ("smallId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "Account_username_key" ON "Account" USING btree ("username" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "Article_uri_key" ON "Article" USING btree ("uri" text_ops);
*/