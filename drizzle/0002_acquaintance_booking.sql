CREATE TYPE "public"."booking_type" AS ENUM('consultation', 'acquaintance');
--> statement-breakpoint
ALTER TABLE "Booking" ADD COLUMN "type" "booking_type" DEFAULT 'consultation' NOT NULL;
