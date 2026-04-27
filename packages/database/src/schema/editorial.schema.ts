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
  publishAt: timestamp('publish_at', { withTimezone: true }),
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
