import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const projects = pgTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type ProjectRow = typeof projects.$inferSelect;
export type NewProjectRow = typeof projects.$inferInsert;

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
