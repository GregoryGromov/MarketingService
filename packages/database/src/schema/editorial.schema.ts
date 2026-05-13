import { boolean, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

// Editorial bounded context schema
//
// For the first vertical slice we only need the articles table.
// Original content is embedded directly into the row.

export const articles = pgTable('articles', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull(),
  status: text('status').notNull().default('draft'),
  paused: boolean('paused').notNull().default(false),
  defaultCoverUrl: text('default_cover_url'),
  originalContent: text('original_content').notNull(),
  originalLanguage: text('original_language').notNull(),
  originalUploadedAt: timestamp('original_uploaded_at', { withTimezone: true }).notNull(),
  releasePlanSnapshot: jsonb('release_plan_snapshot'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type ArticleRow = typeof articles.$inferSelect;
export type NewArticleRow = typeof articles.$inferInsert;

export const articleSourceVersions = pgTable('article_source_versions', {
  id: text('id').primaryKey(),
  articleId: text('article_id').notNull(),
  content: text('content').notNull(),
  language: text('language').notNull(),
  kind: text('kind').notNull(),
  sourceVersionId: text('source_version_id'),
  meta: jsonb('meta'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type ArticleSourceVersionRow = typeof articleSourceVersions.$inferSelect;
export type NewArticleSourceVersionRow = typeof articleSourceVersions.$inferInsert;

export const channelAdaptations = pgTable('channel_adaptations', {
  id: text('id').primaryKey(),
  articleId: text('article_id').notNull(),
  channelId: text('channel_id').notNull(),
  displayName: text('display_name').notNull(),
  promptInstructions: text('prompt_instructions'),
  sourceLanguage: text('source_language').notNull(),
  status: text('status').notNull().default('pending'),
  adaptedContent: text('adapted_content'),
  selectedVersionId: text('selected_version_id'),
  approvedVersionId: text('approved_version_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type ChannelAdaptationRow = typeof channelAdaptations.$inferSelect;
export type NewChannelAdaptationRow = typeof channelAdaptations.$inferInsert;

export const channelAdaptationVersions = pgTable('channel_adaptation_versions', {
  id: text('id').primaryKey(),
  adaptationId: text('adaptation_id').notNull(),
  content: text('content').notNull(),
  kind: text('kind').notNull(),
  sourceVersionId: text('source_version_id'),
  meta: jsonb('meta'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type ChannelAdaptationVersionRow = typeof channelAdaptationVersions.$inferSelect;
export type NewChannelAdaptationVersionRow = typeof channelAdaptationVersions.$inferInsert;

export const translations = pgTable('translations', {
  id: text('id').primaryKey(),
  adaptationId: text('adaptation_id').notNull(),
  sourceLanguage: text('source_language').notNull(),
  targetLanguage: text('target_language').notNull(),
  status: text('status').notNull().default('pending'),
  translatedContent: text('translated_content'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type TranslationRow = typeof translations.$inferSelect;
export type NewTranslationRow = typeof translations.$inferInsert;

export const translationVersions = pgTable('translation_versions', {
  id: text('id').primaryKey(),
  translationId: text('translation_id').notNull(),
  content: text('content').notNull(),
  kind: text('kind').notNull(),
  sourceVersionId: text('source_version_id'),
  meta: jsonb('meta'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type TranslationVersionRow = typeof translationVersions.$inferSelect;
export type NewTranslationVersionRow = typeof translationVersions.$inferInsert;
