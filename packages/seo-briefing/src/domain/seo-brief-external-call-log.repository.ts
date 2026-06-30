import type {
  SeoBriefExternalCallLog,
  SeoBriefExternalCallLogId,
} from './seo-brief-external-call-log.entity.js';
import type { SeoBriefRunId } from './seo-brief-run.aggregate.js';

export abstract class SeoBriefExternalCallLogRepository {
  abstract findById(id: SeoBriefExternalCallLogId): Promise<SeoBriefExternalCallLog | null>;
  abstract findByRunId(runId: SeoBriefRunId): Promise<SeoBriefExternalCallLog[]>;
  abstract save(log: SeoBriefExternalCallLog): Promise<void>;
}
