CREATE TABLE "publication_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"article_id" text NOT NULL,
	"project_id" text NOT NULL,
	"channel_id" text NOT NULL,
	"target_language" text NOT NULL,
	"publish_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
