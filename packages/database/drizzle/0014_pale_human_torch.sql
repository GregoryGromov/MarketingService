CREATE TABLE "seo_brief_external_calls" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"step_id" text,
	"provider" text NOT NULL,
	"endpoint" text NOT NULL,
	"request_payload" jsonb NOT NULL,
	"response_payload" jsonb,
	"estimated_cost" double precision,
	"cache_hit" boolean DEFAULT false NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"status" text DEFAULT 'running' NOT NULL,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_brief_llm_calls" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"step_id" text,
	"operation" text NOT NULL,
	"model" text NOT NULL,
	"prompt_version" text NOT NULL,
	"request_payload" jsonb NOT NULL,
	"response_payload" jsonb,
	"token_usage_input" integer,
	"token_usage_output" integer,
	"estimated_cost" double precision,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"status" text DEFAULT 'running' NOT NULL,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_brief_score_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"step_id" text,
	"formula_name" text NOT NULL,
	"input_payload" jsonb NOT NULL,
	"result_payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
