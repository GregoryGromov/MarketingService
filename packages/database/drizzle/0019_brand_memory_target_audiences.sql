ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "target_audiences" jsonb;--> statement-breakpoint
UPDATE "projects"
SET "target_audiences" = jsonb_build_array("target_audience")
WHERE "target_audiences" IS NULL
  AND "target_audience" IS NOT NULL
  AND btrim("target_audience") <> '';--> statement-breakpoint
