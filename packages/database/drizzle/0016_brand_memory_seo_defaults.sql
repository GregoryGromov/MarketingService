ALTER TABLE "projects" ADD COLUMN "key_message" text;
ALTER TABLE "projects" ADD COLUMN "default_cta" text;
ALTER TABLE "projects" ADD COLUMN "brand_constraints" jsonb;
ALTER TABLE "projects" ADD COLUMN "claims_constraints" jsonb;
