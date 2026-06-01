CREATE TABLE "seo_brief_run_artifacts" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"stage" text NOT NULL,
	"artifact_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"attempt" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_brief_run_steps" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"stage" text NOT NULL,
	"status" text NOT NULL,
	"attempt_number" integer DEFAULT 1 NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_brief_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text,
	"topic_seed" text NOT NULL,
	"country" text NOT NULL,
	"language" text NOT NULL,
	"audience" text NOT NULL,
	"product_name" text NOT NULL,
	"product_description" text NOT NULL,
	"brand_memory_snapshot" jsonb NOT NULL,
	"key_message" text,
	"audience_before" text,
	"audience_after" text,
	"cta" text,
	"seo_weight" double precision NOT NULL,
	"product_weight" double precision NOT NULL,
	"status" text DEFAULT 'created' NOT NULL,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_briefs" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"selected_cluster_payload" jsonb NOT NULL,
	"brief_payload" jsonb NOT NULL,
	"rejected_clusters_payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
