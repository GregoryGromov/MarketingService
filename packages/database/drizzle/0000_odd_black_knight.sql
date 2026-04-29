CREATE TABLE "articles" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"paused" boolean DEFAULT false NOT NULL,
	"publish_at" timestamp with time zone,
	"default_cover_url" text,
	"original_content" text NOT NULL,
	"original_language" text NOT NULL,
	"original_uploaded_at" timestamp with time zone NOT NULL,
	"release_plan_snapshot" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
