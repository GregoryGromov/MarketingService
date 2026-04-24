// Editorial bounded context schema
//
// Tables: articles, channel_adaptations, translations
// Original is embedded in articles table (original_content, original_language, etc.)
// All IDs are text (TypeID strings)
// Use jsonb for: ReleasePlanSnapshot
// Statuses stored as text: ArticleStatus, NodeStatus
//
// See domain doc: sections 3.3 (Article AR), 3.4 (Translation AR)

export {};
