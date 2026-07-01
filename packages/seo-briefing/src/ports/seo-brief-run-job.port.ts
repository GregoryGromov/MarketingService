import type { SeoBriefRunId } from '../domain/seo-brief-run.aggregate.js';
import type { SeoBriefRerunnableStage } from '../domain/seo-brief-run-step.entity.js';

export const SEO_BRIEF_RUN_QUEUE = 'seo-brief-run';
export const PROCESS_SEO_BRIEF_RUN_JOB = 'process-seo-brief-run';

export interface SeoBriefRunJobPayload {
  runId: SeoBriefRunId;
  startStage?: SeoBriefRerunnableStage;
  stopAfterStage?: SeoBriefRerunnableStage;
  skipManualReview?: boolean;
  // When true the worker runs the full headless article auto-flow (keyword research
  // through packaged longread) by invoking the manual CQRS command chain in sequence,
  // instead of the SEO-only ProcessSeoBriefRunExecutor pipeline.
  fullAutoFlow?: boolean;
}

export interface EnqueuedSeoBriefRunJob {
  jobId: string;
}

export abstract class SeoBriefRunJobPort {
  abstract enqueueRun(payload: SeoBriefRunJobPayload): Promise<EnqueuedSeoBriefRunJob>;
}
