import { text, timestamp } from 'drizzle-orm/pg-core';
import { pgTable } from 'drizzle-orm/pg-core';

export const publications = pgTable('publications', {
  id: text('id').primaryKey(),
  articleId: text('article_id').notNull(),
  adaptationId: text('adaptation_id').notNull(),
  channelId: text('channel_id').notNull(),
  displayName: text('display_name').notNull(),
  targetLanguage: text('target_language').notNull(),
  publishAt: timestamp('publish_at', { withTimezone: true }).notNull(),
  status: text('status').notNull().default('scheduled'),
  telegramChatId: text('telegram_chat_id'),
  telegramMessageId: text('telegram_message_id'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type PublicationRow = typeof publications.$inferSelect;
export type NewPublicationRow = typeof publications.$inferInsert;
