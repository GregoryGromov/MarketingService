// Publishing bounded context schema
//
// Tables: publishing_targets, publications
// All IDs are text (TypeID strings)
// Use jsonb for: PublishingTarget.config, DestinationSnapshot
// Statuses stored as text: PublicationStatus
//
// See domain doc: sections 3.5 (PublishingTarget AR), 3.6 (Publication AR)

export {};
