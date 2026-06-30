ALTER TABLE "project_marker_placements" ADD COLUMN IF NOT EXISTS "market_country" text;
--> statement-breakpoint
ALTER TABLE "project_marker_placements" ADD COLUMN IF NOT EXISTS "market_location_name" text;
