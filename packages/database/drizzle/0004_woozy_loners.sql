ALTER TABLE "channel_adaptations" ADD COLUMN "display_name" text;--> statement-breakpoint
ALTER TABLE "channel_adaptations" ADD COLUMN "prompt_instructions" text;--> statement-breakpoint

UPDATE "channel_adaptations"
SET "display_name" = CASE
  WHEN "channel_id" = 'channel_telegram' THEN 'Telegram'
  WHEN "channel_id" = 'channel_x' THEN 'X'
  ELSE initcap(replace(replace("channel_id", 'channel_', ''), '_', ' '))
END
WHERE "display_name" IS NULL;--> statement-breakpoint

ALTER TABLE "channel_adaptations" ALTER COLUMN "display_name" SET NOT NULL;
