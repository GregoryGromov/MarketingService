CREATE TABLE "publications" (
	"id" text PRIMARY KEY NOT NULL,
	"article_id" text NOT NULL,
	"adaptation_id" text NOT NULL,
	"channel_id" text NOT NULL,
	"display_name" text NOT NULL,
	"target_language" text NOT NULL,
	"publish_at" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"telegram_chat_id" text,
	"telegram_message_id" text,
	"published_at" timestamp with time zone,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
