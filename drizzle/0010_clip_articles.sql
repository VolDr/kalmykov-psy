CREATE TABLE "clip_articles" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"enabled" boolean DEFAULT false NOT NULL,
	"pages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"quiz_enabled" boolean DEFAULT true NOT NULL,
	"quiz_button_text" text,
	"result_heading" text,
	"result_text_green" text,
	"result_text_orange" text,
	"result_text_red" text,
	"bot_cta_text" text,
	"bot_cta_button_text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_bot_settings" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"bot_username" text,
	"channel_chat_id" text,
	"channel_url" text,
	"require_subscription" boolean DEFAULT true NOT NULL,
	"subscribe_text" text,
	"subscribe_button_text" text,
	"check_button_text" text,
	"not_subscribed_alert" text,
	"results_header_text" text,
	"results_footer_text" text,
	"sphere_recs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"all_green_text" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_results" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"article_slug" text,
	"total_score" double precision NOT NULL,
	"average_score" double precision,
	"severity" text NOT NULL,
	"color" text NOT NULL,
	"subscales" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"contact_id" bigint,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quiz_results" ADD CONSTRAINT "quiz_results_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."bot_contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "clip_articles_slug_key" ON "clip_articles" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "quiz_results_token_key" ON "quiz_results" USING btree ("token");