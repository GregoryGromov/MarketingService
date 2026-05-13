import { boolean, integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const projects = pgTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  brandName: text('brand_name'),
  productDescription: text('product_description'),
  targetAudience: text('target_audience'),
  approvedFacts: jsonb('approved_facts'),
  forbiddenClaims: jsonb('forbidden_claims'),
  glossary: jsonb('glossary'),
  bannedPhrases: jsonb('banned_phrases'),
  requiredPhrases: jsonb('required_phrases'),
  brandDocs: jsonb('brand_docs'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type ProjectRow = typeof projects.$inferSelect;
export type NewProjectRow = typeof projects.$inferInsert;

export const campaignPresets = pgTable('campaign_presets', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  sourceLanguage: text('source_language').notNull(),
  sourceType: text('source_type').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  isSystem: boolean('is_system').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type CampaignPresetRow = typeof campaignPresets.$inferSelect;
export type NewCampaignPresetRow = typeof campaignPresets.$inferInsert;

export const campaignPresetPublications = pgTable('campaign_preset_publications', {
  id: text('id').primaryKey(),
  presetId: text('preset_id').notNull(),
  dayOffset: integer('day_offset').notNull(),
  localTime: text('local_time').notNull(),
  channel: text('channel').notNull(),
  language: text('language').notNull(),
  publicationType: text('publication_type').notNull(),
  style: text('style').notNull(),
  position: integer('position').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type CampaignPresetPublicationRow = typeof campaignPresetPublications.$inferSelect;
export type NewCampaignPresetPublicationRow = typeof campaignPresetPublications.$inferInsert;

export const campaigns = pgTable('campaigns', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull(),
  presetId: text('preset_id').notNull(),
  name: text('name').notNull(),
  sourceArticleId: text('source_article_id'),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  sourceLanguage: text('source_language').notNull().default('en'),
  status: text('status').notNull().default('draft'),
  extraInstructions: text('extra_instructions'),
  finalApprovedAt: timestamp('final_approved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type CampaignRow = typeof campaigns.$inferSelect;
export type NewCampaignRow = typeof campaigns.$inferInsert;

export const plannedPublications = pgTable('planned_publications', {
  id: text('id').primaryKey(),
  campaignId: text('campaign_id').notNull(),
  presetPublicationId: text('preset_publication_id'),
  dayOffset: integer('day_offset').notNull(),
  localTime: text('local_time').notNull(),
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }).notNull(),
  channel: text('channel').notNull(),
  language: text('language').notNull(),
  publicationType: text('publication_type').notNull(),
  style: text('style').notNull(),
  publishMode: text('publish_mode'),
  status: text('status').notNull().default('pending'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type PlannedPublicationRow = typeof plannedPublications.$inferSelect;
export type NewPlannedPublicationRow = typeof plannedPublications.$inferInsert;

export const campaignArtifacts = pgTable('campaign_artifacts', {
  id: text('id').primaryKey(),
  campaignId: text('campaign_id').notNull(),
  plannedPublicationId: text('planned_publication_id'),
  artifactType: text('artifact_type').notNull(),
  artifactId: text('artifact_id').notNull(),
  role: text('role').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type CampaignArtifactRow = typeof campaignArtifacts.$inferSelect;
export type NewCampaignArtifactRow = typeof campaignArtifacts.$inferInsert;

export const approvalItems = pgTable('approval_items', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull(),
  campaignId: text('campaign_id').notNull(),
  plannedPublicationId: text('planned_publication_id'),
  artifactType: text('artifact_type'),
  artifactId: text('artifact_id'),
  type: text('type').notNull(),
  status: text('status').notNull().default('pending'),
  severity: text('severity').notNull().default('medium'),
  title: text('title').notNull(),
  details: jsonb('details').notNull(),
  suggestedFix: jsonb('suggested_fix'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
});

export type ApprovalItemRow = typeof approvalItems.$inferSelect;
export type NewApprovalItemRow = typeof approvalItems.$inferInsert;

export const qualityCheckResults = pgTable('quality_check_results', {
  id: text('id').primaryKey(),
  campaignId: text('campaign_id').notNull(),
  plannedPublicationId: text('planned_publication_id'),
  artifactType: text('artifact_type').notNull(),
  artifactId: text('artifact_id').notNull(),
  artifactVersionId: text('artifact_version_id'),
  checkType: text('check_type').notNull(),
  result: text('result').notNull(),
  attemptNumber: integer('attempt_number').notNull().default(1),
  reasons: jsonb('reasons').notNull(),
  suggestedFix: jsonb('suggested_fix'),
  rawAiResult: jsonb('raw_ai_result'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type QualityCheckResultRow = typeof qualityCheckResults.$inferSelect;
export type NewQualityCheckResultRow = typeof qualityCheckResults.$inferInsert;

export const workflowRuns = pgTable('workflow_runs', {
  id: text('id').primaryKey(),
  campaignId: text('campaign_id').notNull(),
  status: text('status').notNull(),
  currentStep: text('current_step').notNull(),
  errorMessage: text('error_message'),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type WorkflowRunRow = typeof workflowRuns.$inferSelect;
export type NewWorkflowRunRow = typeof workflowRuns.$inferInsert;

export const projectMarkers = pgTable('project_markers', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull(),
  title: text('title').notNull(),
  notes: text('notes'),
  colorBg: text('color_bg').notNull(),
  colorBorder: text('color_border').notNull(),
  colorText: text('color_text').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type ProjectMarkerRow = typeof projectMarkers.$inferSelect;
export type NewProjectMarkerRow = typeof projectMarkers.$inferInsert;

export const projectMarkerPlacements = pgTable('project_marker_placements', {
  id: text('id').primaryKey(),
  markerId: text('marker_id').notNull(),
  projectId: text('project_id').notNull(),
  channelId: text('channel_id').notNull(),
  targetLanguage: text('target_language').notNull(),
  publishAt: timestamp('publish_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type ProjectMarkerPlacementRow = typeof projectMarkerPlacements.$inferSelect;
export type NewProjectMarkerPlacementRow = typeof projectMarkerPlacements.$inferInsert;
