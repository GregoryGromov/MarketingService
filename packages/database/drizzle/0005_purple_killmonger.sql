CREATE TABLE "translations" (
	"id" text PRIMARY KEY NOT NULL,
	"adaptation_id" text NOT NULL,
	"source_language" text NOT NULL,
	"target_language" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"translated_content" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
