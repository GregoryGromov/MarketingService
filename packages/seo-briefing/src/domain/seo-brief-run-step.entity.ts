import { generateId, type TypedId } from '@marketing-service/shared';
import type { SeoBriefRunId } from './seo-brief-run.aggregate.js';

export type SeoBriefRunStepId = TypedId<'seo_brief_step'>;
export type SeoBriefRunStage =
  | 'created'
  | 'keyword_expansion'
  | 'keyword_research'
  | 'related_keyword_research'
  | 'serp_research'
  | 'domain_metrics_research'
  | 'onpage_research'
  | 'keyword_triage'
  | 'clustering'
  | 'cluster_scoring'
  | 'cluster_selection'
  | 'brief_generation';
export type SeoBriefRunStepStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped'
  | 'superseded';

export const SEO_BRIEF_RUN_STAGE_ORDER: SeoBriefRunStage[] = [
  'created',
  'keyword_expansion',
  'keyword_research',
  'related_keyword_research',
  'serp_research',
  'domain_metrics_research',
  'onpage_research',
  'keyword_triage',
  'clustering',
  'cluster_scoring',
  'cluster_selection',
  'brief_generation',
];

export const SEO_BRIEF_RERUNNABLE_STAGES = [
  'keyword_expansion',
  'keyword_research',
  'related_keyword_research',
  'serp_research',
  'domain_metrics_research',
  'onpage_research',
  'keyword_triage',
  'clustering',
  'cluster_scoring',
  'cluster_selection',
  'brief_generation',
] as const;

export type SeoBriefRerunnableStage = (typeof SEO_BRIEF_RERUNNABLE_STAGES)[number];

export interface CreateSeoBriefRunStepParams {
  runId: SeoBriefRunId;
  stage: SeoBriefRunStage;
  status: SeoBriefRunStepStatus;
  attemptNumber?: number;
  startedAt?: Date;
  finishedAt?: Date | null;
  errorMessage?: string | null;
}

export interface SeoBriefRunStepProps {
  id: SeoBriefRunStepId;
  runId: SeoBriefRunId;
  stage: SeoBriefRunStage;
  status: SeoBriefRunStepStatus;
  attemptNumber: number;
  startedAt: Date;
  finishedAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
}

function normalizeText(value?: string | null): string | null {
  const nextValue = value?.trim();
  return nextValue ? nextValue : null;
}

function normalizeRequiredText(value: string): string {
  const nextValue = value.trim();
  if (nextValue.length === 0) {
    throw new Error('SEO brief run step error message must not be empty');
  }

  return nextValue;
}

export class SeoBriefRunStep {
  private constructor(
    public readonly id: SeoBriefRunStepId,
    public readonly runId: SeoBriefRunId,
    public readonly stage: SeoBriefRunStage,
    public status: SeoBriefRunStepStatus,
    public attemptNumber: number,
    public startedAt: Date,
    public finishedAt: Date | null,
    public errorMessage: string | null,
    public readonly createdAt: Date,
  ) {}

  static create(params: CreateSeoBriefRunStepParams): SeoBriefRunStep {
    const now = params.startedAt ?? new Date();

    return new SeoBriefRunStep(
      generateId('seo_brief_step'),
      params.runId,
      params.stage,
      params.status,
      params.attemptNumber ?? 1,
      now,
      params.finishedAt ?? null,
      normalizeText(params.errorMessage),
      now,
    );
  }

  static rehydrate(props: SeoBriefRunStepProps): SeoBriefRunStep {
    return new SeoBriefRunStep(
      props.id,
      props.runId,
      props.stage,
      props.status,
      props.attemptNumber,
      props.startedAt,
      props.finishedAt,
      props.errorMessage,
      props.createdAt,
    );
  }

  markRunning(startedAt: Date = new Date()): void {
    this.status = 'running';
    this.startedAt = startedAt;
    this.finishedAt = null;
    this.errorMessage = null;
  }

  complete(finishedAt: Date = new Date()): void {
    this.status = 'completed';
    this.finishedAt = finishedAt;
    this.errorMessage = null;
  }

  fail(errorMessage: string, finishedAt: Date = new Date()): void {
    this.status = 'failed';
    this.finishedAt = finishedAt;
    this.errorMessage = normalizeRequiredText(errorMessage);
  }

  skip(finishedAt: Date = new Date()): void {
    this.status = 'skipped';
    this.finishedAt = finishedAt;
    this.errorMessage = null;
  }

  supersede(finishedAt: Date = new Date()): void {
    this.status = 'superseded';
    this.finishedAt = finishedAt;
  }
}
