CREATE TABLE "project_marker_placements" (
	"id" text PRIMARY KEY NOT NULL,
	"marker_id" text NOT NULL,
	"project_id" text NOT NULL,
	"channel_id" text NOT NULL,
	"target_language" text NOT NULL,
	"publish_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_markers" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"title" text NOT NULL,
	"notes" text,
	"color_bg" text NOT NULL,
	"color_border" text NOT NULL,
	"color_text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
