CREATE TABLE "channel_adaptations" (
	"id" text PRIMARY KEY NOT NULL,
	"article_id" text NOT NULL,
	"channel_id" text NOT NULL,
	"source_language" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"adapted_content" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "articles" DROP COLUMN "adaptations";