import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const publications = pgTable('publications', {
  id: text('id').primaryKey(),
  articleId: text('article_id').notNull(),
  adaptationId: text('adaptation_id').notNull(),
  plannedPublicationId: text('planned_publication_id'),
  channelId: text('channel_id').notNull(),
  displayName: text('display_name').notNull(),
  targetLanguage: text('target_language').notNull(),
  publishAt: timestamp('publish_at', { withTimezone: true }).notNull(),
  publishingTarget: text('publishing_target').notNull().default('test'),
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

export const publicationPlans = pgTable('publication_plans', {
  id: text('id').primaryKey(),
  articleId: text('article_id').notNull(),
  projectId: text('project_id').notNull(),
  plannedPublicationId: text('planned_publication_id'),
  channelId: text('channel_id').notNull(),
  targetLanguage: text('target_language').notNull(),
  publishAt: timestamp('publish_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type PublicationPlanRow = typeof publicationPlans.$inferSelect;
export type NewPublicationPlanRow = typeof publicationPlans.$inferInsert;

export const xConnections = pgTable(
  'x_connections',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id').notNull().default('default'),
    publishingTarget: text('publishing_target').notNull().default('test'),
    xUserId: text('x_user_id').notNull(),
    xUsername: text('x_username').notNull(),
    xDisplayName: text('x_display_name'),
    accessTokenEncrypted: text('access_token_encrypted'),
    refreshTokenEncrypted: text('refresh_token_encrypted'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
    scopes: jsonb('scopes').$type<string[]>().notNull().default([]),
    status: text('status').notNull().default('active'),
    tokenVersion: integer('token_version').notNull().default(0),
    lastVerifiedAt: timestamp('last_verified_at', { withTimezone: true }),
    lastRefreshedAt: timestamp('last_refreshed_at', { withTimezone: true }),
    lastErrorCode: text('last_error_code'),
    lastErrorAt: timestamp('last_error_at', { withTimezone: true }),
    connectedAt: timestamp('connected_at', { withTimezone: true }).defaultNow().notNull(),
    disconnectedAt: timestamp('disconnected_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('x_connections_target_user_unique').on(
      table.tenantId,
      table.publishingTarget,
      table.xUserId,
    ),
  ],
);

export type XConnectionRow = typeof xConnections.$inferSelect;
export type NewXConnectionRow = typeof xConnections.$inferInsert;

export const xOauthAttempts = pgTable('x_oauth_attempts', {
  stateHash: text('state_hash').primaryKey(),
  codeVerifierEncrypted: text('code_verifier_encrypted').notNull(),
  tenantId: text('tenant_id').notNull().default('default'),
  publishingTarget: text('publishing_target').notNull().default('test'),
  initiatedByUserId: text('initiated_by_user_id'),
  returnTo: text('return_to'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  consumedAt: timestamp('consumed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type XOauthAttemptRow = typeof xOauthAttempts.$inferSelect;
export type NewXOauthAttemptRow = typeof xOauthAttempts.$inferInsert;

export const xPublications = pgTable(
  'x_publications',
  {
    id: text('id').primaryKey(),
    requestId: text('request_id').notNull(),
    xConnectionId: text('x_connection_id').notNull(),
    textHash: text('text_hash').notNull(),
    textPreviewSanitized: text('text_preview_sanitized'),
    hasMedia: boolean('has_media').notNull().default(false),
    mediaCount: integer('media_count').notNull().default(0),
    mediaAssetIds: jsonb('media_asset_ids').$type<string[]>(),
    xMediaIds: jsonb('x_media_ids').$type<string[]>(),
    madeWithAi: boolean('made_with_ai').notNull().default(false),
    status: text('status').notNull().default('pending'),
    xPostId: text('x_post_id'),
    xPostUrl: text('x_post_url'),
    xResponseMetadata: jsonb('x_response_metadata').$type<Record<string, unknown>>(),
    errorCode: text('error_code'),
    errorDetailSanitized: text('error_detail_sanitized'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    failedAt: timestamp('failed_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('x_publications_connection_request_unique').on(
      table.xConnectionId,
      table.requestId,
    ),
  ],
);

export type XPublicationRow = typeof xPublications.$inferSelect;
export type NewXPublicationRow = typeof xPublications.$inferInsert;
