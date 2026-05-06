ALTER TABLE "articles" ADD COLUMN "adaptations" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "articles" DROP COLUMN "publish_at";