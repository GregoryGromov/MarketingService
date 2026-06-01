import type { SeoBriefRunId } from './seo-brief-run.aggregate.js';
import type { SeoBriefRunStep } from './seo-brief-run-step.entity.js';

export abstract class SeoBriefRunStepRepository {
  abstract findByRunId(runId: SeoBriefRunId): Promise<SeoBriefRunStep[]>;
  abstract save(step: SeoBriefRunStep): Promise<void>;
}
