import type { SeoBriefLlmCallLog, SeoBriefLlmCallLogId } from './seo-brief-llm-call-log.entity.js';
import type { SeoBriefRunId } from './seo-brief-run.aggregate.js';

export abstract class SeoBriefLlmLogRepository {
  abstract findById(id: SeoBriefLlmCallLogId): Promise<SeoBriefLlmCallLog | null>;
  abstract findByRunId(runId: SeoBriefRunId): Promise<SeoBriefLlmCallLog[]>;
  abstract save(log: SeoBriefLlmCallLog): Promise<void>;
}
