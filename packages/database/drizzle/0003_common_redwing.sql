CREATE TABLE "channel_adaptation_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"adaptation_id" text NOT NULL,
	"content" text NOT NULL,
	"kind" text NOT NULL,
	"source_version_id" text,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "channel_adaptations" ADD COLUMN "selected_version_id" text;--> statement-breakpoint
ALTER TABLE "channel_adaptations" ADD COLUMN "approved_version_id" text;
--> statement-breakpoint
WITH inserted_versions AS (
	INSERT INTO "channel_adaptation_versions" (
		"id",
		"adaptation_id",
		"content",
		"kind",
		"source_version_id",
		"meta",
		"created_at"
	)
	SELECT
		'adaptation_version_' || substr(md5("id" || coalesce("updated_at"::text, now()::text) || random()::text), 1, 26),
		"id",
		"adapted_content",
		CASE
			WHEN "status" = 'edited' THEN 'manual_edit'
			WHEN "status" = 'approved' THEN 'manual_edit'
			ELSE 'generated'
		END,
		NULL,
		NULL,
		coalesce("updated_at", now())
	FROM "channel_adaptations"
	WHERE "adapted_content" IS NOT NULL
	RETURNING "id", "adaptation_id"
)
UPDATE "channel_adaptations" AS ca
SET
	"selected_version_id" = iv."id",
	"approved_version_id" = CASE WHEN ca."status" = 'approved' THEN iv."id" ELSE NULL END
FROM inserted_versions AS iv
WHERE ca."id" = iv."adaptation_id";
