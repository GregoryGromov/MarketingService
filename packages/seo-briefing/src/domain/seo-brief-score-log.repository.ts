import type { SeoBriefRunId } from './seo-brief-run.aggregate.js';
import type { SeoBriefScoreLog } from './seo-brief-score-log.entity.js';

export abstract class SeoBriefScoreLogRepository {
  abstract findByRunId(runId: SeoBriefRunId): Promise<SeoBriefScoreLog[]>;
  abstract save(log: SeoBriefScoreLog): Promise<void>;
}
