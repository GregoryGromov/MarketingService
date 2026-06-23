CREATE TABLE IF NOT EXISTS "x_connections" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text DEFAULT 'default' NOT NULL,
  "publishing_target" text DEFAULT 'test' NOT NULL,
  "x_user_id" text NOT NULL,
  "x_username" text NOT NULL,
  "x_display_name" text,
  "access_token_encrypted" text,
  "refresh_token_encrypted" text,
  "access_token_expires_at" timestamp with time zone,
  "scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "token_version" integer DEFAULT 0 NOT NULL,
  "last_verified_at" timestamp with time zone,
  "last_refreshed_at" timestamp with time zone,
  "last_error_code" text,
  "last_error_at" timestamp with time zone,
  "connected_at" timestamp with time zone DEFAULT now() NOT NULL,
  "disconnected_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "x_connections_target_user_unique"
  ON "x_connections" ("tenant_id", "publishing_target", "x_user_id");

CREATE TABLE IF NOT EXISTS "x_oauth_attempts" (
  "state_hash" text PRIMARY KEY NOT NULL,
  "code_verifier_encrypted" text NOT NULL,
  "tenant_id" text DEFAULT 'default' NOT NULL,
  "publishing_target" text DEFAULT 'test' NOT NULL,
  "initiated_by_user_id" text,
  "return_to" text,
  "expires_at" timestamp with time zone NOT NULL,
  "consumed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "x_publications" (
  "id" text PRIMARY KEY NOT NULL,
  "request_id" text NOT NULL,
  "x_connection_id" text NOT NULL,
  "text_hash" text NOT NULL,
  "text_preview_sanitized" text,
  "has_media" boolean DEFAULT false NOT NULL,
  "media_count" integer DEFAULT 0 NOT NULL,
  "media_asset_ids" jsonb,
  "x_media_ids" jsonb,
  "made_with_ai" boolean DEFAULT false NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "x_post_id" text,
  "x_post_url" text,
  "x_response_metadata" jsonb,
  "error_code" text,
  "error_detail_sanitized" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "started_at" timestamp with time zone,
  "sent_at" timestamp with time zone,
  "failed_at" timestamp with time zone
);

CREATE UNIQUE INDEX IF NOT EXISTS "x_publications_connection_request_unique"
  ON "x_publications" ("x_connection_id", "request_id");
