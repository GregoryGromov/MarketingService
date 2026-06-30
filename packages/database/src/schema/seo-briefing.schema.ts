import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const seoBriefRuns = pgTable('seo_brief_runs', {
  id: text('id').primaryKey(),
  projectId: text('project_id'),
  topicSeed: text('topic_seed').notNull(),
  country: text('country').notNull(),
  language: text('language').notNull(),
  audience: text('audience').notNull(),
  productName: text('product_name').notNull(),
  productDescription: text('product_description').notNull(),
  brandMemorySnapshot: jsonb('brand_memory_snapshot').notNull(),
  keyMessage: text('key_message'),
  audienceBefore: text('audience_before'),
  audienceAfter: text('audience_after'),
  cta: text('cta'),
  seoWeight: doublePrecision('seo_weight').notNull(),
  productWeight: doublePrecision('product_weight').notNull(),
  status: text('status').notNull().default('created'),
  failureReason: text('failure_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type SeoBriefRunRow = typeof seoBriefRuns.$inferSelect;
export type NewSeoBriefRunRow = typeof seoBriefRuns.$inferInsert;

export const seoBriefRunSteps = pgTable('seo_brief_run_steps', {
  id: text('id').primaryKey(),
  runId: text('run_id').notNull(),
  stage: text('stage').notNull(),
  status: text('status').notNull(),
  attemptNumber: integer('attempt_number').notNull().default(1),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type SeoBriefRunStepRow = typeof seoBriefRunSteps.$inferSelect;
export type NewSeoBriefRunStepRow = typeof seoBriefRunSteps.$inferInsert;

export const seoBriefRunArtifacts = pgTable('seo_brief_run_artifacts', {
  id: text('id').primaryKey(),
  runId: text('run_id').notNull(),
  stage: text('stage').notNull(),
  artifactType: text('artifact_type').notNull(),
  payload: jsonb('payload').notNull(),
  attempt: integer('attempt').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type SeoBriefRunArtifactRow = typeof seoBriefRunArtifacts.$inferSelect;
export type NewSeoBriefRunArtifactRow = typeof seoBriefRunArtifacts.$inferInsert;

export const seoBriefs = pgTable('seo_briefs', {
  id: text('id').primaryKey(),
  runId: text('run_id').notNull(),
  selectedClusterPayload: jsonb('selected_cluster_payload').notNull(),
  briefPayload: jsonb('brief_payload').notNull(),
  rejectedClustersPayload: jsonb('rejected_clusters_payload'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type SeoBriefRow = typeof seoBriefs.$inferSelect;
export type NewSeoBriefRow = typeof seoBriefs.$inferInsert;

export const seoBriefLlmCalls = pgTable('seo_brief_llm_calls', {
  id: text('id').primaryKey(),
  runId: text('run_id').notNull(),
  stepId: text('step_id'),
  operation: text('operation').notNull(),
  model: text('model').notNull(),
  promptVersion: text('prompt_version').notNull(),
  requestPayload: jsonb('request_payload').notNull(),
  responsePayload: jsonb('response_payload'),
  tokenUsageInput: integer('token_usage_input'),
  tokenUsageOutput: integer('token_usage_output'),
  estimatedCost: doublePrecision('estimated_cost'),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  status: text('status').notNull().default('running'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type SeoBriefLlmCallRow = typeof seoBriefLlmCalls.$inferSelect;
export type NewSeoBriefLlmCallRow = typeof seoBriefLlmCalls.$inferInsert;

export const seoBriefExternalCalls = pgTable('seo_brief_external_calls', {
  id: text('id').primaryKey(),
  runId: text('run_id').notNull(),
  stepId: text('step_id'),
  provider: text('provider').notNull(),
  endpoint: text('endpoint').notNull(),
  requestPayload: jsonb('request_payload').notNull(),
  responsePayload: jsonb('response_payload'),
  estimatedCost: doublePrecision('estimated_cost'),
  cacheHit: boolean('cache_hit').notNull().default(false),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  status: text('status').notNull().default('running'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type SeoBriefExternalCallRow = typeof seoBriefExternalCalls.$inferSelect;
export type NewSeoBriefExternalCallRow = typeof seoBriefExternalCalls.$inferInsert;

export const seoBriefScoreLogs = pgTable('seo_brief_score_logs', {
  id: text('id').primaryKey(),
  runId: text('run_id').notNull(),
  stepId: text('step_id'),
  formulaName: text('formula_name').notNull(),
  inputPayload: jsonb('input_payload').notNull(),
  resultPayload: jsonb('result_payload').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type SeoBriefScoreLogRow = typeof seoBriefScoreLogs.$inferSelect;
export type NewSeoBriefScoreLogRow = typeof seoBriefScoreLogs.$inferInsert;
