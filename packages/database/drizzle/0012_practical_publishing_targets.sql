ALTER TABLE "campaigns" ADD COLUMN "publishing_target" text DEFAULT 'test' NOT NULL;
ALTER TABLE "publications" ADD COLUMN "publishing_target" text DEFAULT 'test' NOT NULL;
