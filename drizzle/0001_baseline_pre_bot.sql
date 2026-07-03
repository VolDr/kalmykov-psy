-- ⚠️ BASELINE FILE — DO NOT RUN AGAINST PRODUCTION.
-- These tables already exist in the live DB (applied by hand via psql across
-- 0001_lead_magnet_events.sql, 0002_acquaintance_booking.sql,
-- 0003_booking_sb_client_id.sql, 000X_create_email_subscription.sql, and
-- Availability/Booking/RobokassaPayment/Subscriber/analytics_events, which had
-- no migration file at all). This file exists only so drizzle-kit's journal
-- has an accurate snapshot to diff future `drizzle-kit generate` runs against.
-- Real migrations that should actually be applied start after this file.
CREATE TYPE "public"."booking_status" AS ENUM('pending_payment', 'confirmed', 'cancelled', 'requires_refund');--> statement-breakpoint
CREATE TYPE "public"."booking_type" AS ENUM('consultation', 'acquaintance');--> statement-breakpoint
CREATE TYPE "public"."lead_magnet_event_status" AS ENUM('pending', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'failed');--> statement-breakpoint
CREATE TYPE "public"."subscriber_status" AS ENUM('pending', 'active', 'unsubscribed');--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"goal" text NOT NULL,
	"session_id" text,
	"page" text,
	"params" jsonb
);
--> statement-breakpoint
CREATE TABLE "Availability" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Booking" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"availability_id" bigint NOT NULL,
	"booked_at" timestamp with time zone NOT NULL,
	"email" text NOT NULL,
	"client_name" text NOT NULL,
	"status" "booking_status" DEFAULT 'pending_payment' NOT NULL,
	"lockedUntil" timestamp(3) with time zone,
	"payment_id" bigint,
	"type" "booking_type" DEFAULT 'consultation' NOT NULL,
	"sb_client_id" bigint,
	"createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) with time zone NOT NULL
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE "lead_magnet_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"client_id" bigint NOT NULL,
	"lead_magnet" text NOT NULL,
	"event_name" text NOT NULL,
	"status" "lead_magnet_event_status" DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"sent_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "RobokassaPayment" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) with time zone NOT NULL,
	"outSum" numeric(10, 2) NOT NULL,
	"description" text NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"email" text,
	"op_key" text
);
--> statement-breakpoint
CREATE TABLE "Subscriber" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"status" "subscriber_status" DEFAULT 'pending' NOT NULL,
	"token" text,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "Subscriber_email_unique" UNIQUE("email"),
	CONSTRAINT "Subscriber_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "unique_active_booking_slot" ON "Booking" USING btree ("availability_id","booked_at") WHERE status IN ('confirmed', 'pending_payment');--> statement-breakpoint
CREATE UNIQUE INDEX "EmailSubscription_email_key" ON "EmailSubscription" USING btree ("email" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "EmailSubscription_unsubscribeKey_key" ON "EmailSubscription" USING btree ("unsubscribeKey" text_ops);--> statement-breakpoint
CREATE INDEX "EmailSubscription_status_idx" ON "EmailSubscription" USING btree ("status" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "lead_magnet_events_client_magnet_event_key" ON "lead_magnet_events" USING btree ("client_id","lead_magnet","event_name");