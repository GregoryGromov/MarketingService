CREATE TABLE "article_source_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"article_id" text NOT NULL,
	"content" text NOT NULL,
	"language" text NOT NULL,
	"kind" text NOT NULL,
	"source_version_id" text,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "translation_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"translation_id" text NOT NULL,
	"content" text NOT NULL,
	"kind" text NOT NULL,
	"source_version_id" text,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approval_items" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"campaign_id" text NOT NULL,
	"planned_publication_id" text,
	"artifact_type" text,
	"artifact_id" text,
	"type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"severity" text DEFAULT 'medium' NOT NULL,
	"title" text NOT NULL,
	"details" jsonb NOT NULL,
	"suggested_fix" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "campaign_artifacts" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"planned_publication_id" text,
	"artifact_type" text NOT NULL,
	"artifact_id" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_preset_publications" (
	"id" text PRIMARY KEY NOT NULL,
	"preset_id" text NOT NULL,
	"day_offset" integer NOT NULL,
	"local_time" text NOT NULL,
	"channel" text NOT NULL,
	"language" text NOT NULL,
	"publication_type" text NOT NULL,
	"style" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_presets" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"source_language" text NOT NULL,
	"source_type" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_system" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"preset_id" text NOT NULL,
	"name" text NOT NULL,
	"source_article_id" text,
	"start_date" timestamp with time zone NOT NULL,
	"source_language" text DEFAULT 'en' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"extra_instructions" text,
	"final_approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "planned_publications" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"preset_publication_id" text,
	"day_offset" integer NOT NULL,
	"local_time" text NOT NULL,
	"scheduled_for" timestamp with time zone NOT NULL,
	"channel" text NOT NULL,
	"language" text NOT NULL,
	"publication_type" text NOT NULL,
	"style" text NOT NULL,
	"publish_mode" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quality_check_results" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"planned_publication_id" text,
	"artifact_type" text NOT NULL,
	"artifact_id" text NOT NULL,
	"artifact_version_id" text,
	"check_type" text NOT NULL,
	"result" text NOT NULL,
	"attempt_number" integer DEFAULT 1 NOT NULL,
	"reasons" jsonb NOT NULL,
	"suggested_fix" jsonb,
	"raw_ai_result" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"status" text NOT NULL,
	"current_step" text NOT NULL,
	"error_message" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "brand_name" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "product_description" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "target_audience" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "approved_facts" jsonb;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "forbidden_claims" jsonb;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "glossary" jsonb;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "banned_phrases" jsonb;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "required_phrases" jsonb;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "brand_docs" jsonb;--> statement-breakpoint
ALTER TABLE "publication_plans" ADD COLUMN "planned_publication_id" text;--> statement-breakpoint
ALTER TABLE "publications" ADD COLUMN "planned_publication_id" text;