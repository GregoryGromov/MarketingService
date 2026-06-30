import type { SeoBriefDocument } from './seo-brief-document.entity.js';
import type { SeoBriefRunId } from './seo-brief-run.aggregate.js';

export abstract class SeoBriefDocumentRepository {
  abstract findLatestByRunId(runId: SeoBriefRunId): Promise<SeoBriefDocument | null>;
  abstract save(document: SeoBriefDocument): Promise<void>;
}
