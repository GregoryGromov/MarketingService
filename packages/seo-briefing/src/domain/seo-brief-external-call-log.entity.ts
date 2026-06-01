import { generateId, type TypedId } from '@marketing-service/shared';
import type { SeoBriefRunId } from './seo-brief-run.aggregate.js';
import type { SeoBriefRunStepId } from './seo-brief-run-step.entity.js';
import type { SeoBriefJsonValue } from './seo-briefing.types.js';

export type SeoBriefExternalCallLogId = TypedId<'seo_brief_external_call'>;
export type SeoBriefExternalCallStatus = 'running' | 'completed' | 'failed';

export interface StartSeoBriefExternalCallLogParams {
  runId: SeoBriefRunId;
  stepId?: SeoBriefRunStepId | null;
  provider: string;
  endpoint: string;
  requestPayload: SeoBriefJsonValue;
}

export interface CompleteSeoBriefExternalCallLogParams {
  responsePayload: SeoBriefJsonValue;
  estimatedCost?: number | null;
  cacheHit?: boolean;
  finishedAt?: Date;
}

export interface FailSeoBriefExternalCallLogParams {
  errorMessage: string;
  responsePayload?: SeoBriefJsonValue | null;
  estimatedCost?: number | null;
  cacheHit?: boolean;
  finishedAt?: Date;
}

export interface SeoBriefExternalCallLogProps {
  id: SeoBriefExternalCallLogId;
  runId: SeoBriefRunId;
  stepId: SeoBriefRunStepId | null;
  provider: string;
  endpoint: string;
  requestPayload: SeoBriefJsonValue;
  responsePayload: SeoBriefJsonValue | null;
  estimatedCost: number | null;
  cacheHit: boolean;
  startedAt: Date;
  finishedAt: Date | null;
  status: SeoBriefExternalCallStatus;
  errorMessage: string | null;
  createdAt: Date;
}

function normalizeRequiredText(value: string): string {
  const nextValue = value.trim();
  if (nextValue.length === 0) {
    throw new Error('SEO brief external call log text fields must not be empty');
  }

  return nextValue;
}

function normalizeNumber(value?: number | null): number | null {
  if (value == null) {
    return null;
  }

  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return null;
  }

  return value;
}

export class SeoBriefExternalCallLog {
  private constructor(
    public readonly id: SeoBriefExternalCallLogId,
    public readonly runId: SeoBriefRunId,
    public readonly stepId: SeoBriefRunStepId | null,
    public readonly provider: string,
    public readonly endpoint: string,
    public readonly requestPayload: SeoBriefJsonValue,
    public responsePayload: SeoBriefJsonValue | null,
    public estimatedCost: number | null,
    public cacheHit: boolean,
    public readonly startedAt: Date,
    public finishedAt: Date | null,
    public status: SeoBriefExternalCallStatus,
    public errorMessage: string | null,
    public readonly createdAt: Date,
  ) {}

  static start(params: StartSeoBriefExternalCallLogParams): SeoBriefExternalCallLog {
    const now = new Date();

    return new SeoBriefExternalCallLog(
      generateId('seo_brief_external_call'),
      params.runId,
      params.stepId ?? null,
      normalizeRequiredText(params.provider),
      normalizeRequiredText(params.endpoint),
      params.requestPayload,
      null,
      null,
      false,
      now,
      null,
      'running',
      null,
      now,
    );
  }

  static rehydrate(props: SeoBriefExternalCallLogProps): SeoBriefExternalCallLog {
    return new SeoBriefExternalCallLog(
      props.id,
      props.runId,
      props.stepId,
      props.provider,
      props.endpoint,
      props.requestPayload,
      props.responsePayload,
      props.estimatedCost,
      props.cacheHit,
      props.startedAt,
      props.finishedAt,
      props.status,
      props.errorMessage,
      props.createdAt,
    );
  }

  complete(params: CompleteSeoBriefExternalCallLogParams): void {
    this.responsePayload = params.responsePayload;
    this.estimatedCost = normalizeNumber(params.estimatedCost);
    this.cacheHit = params.cacheHit ?? false;
    this.finishedAt = params.finishedAt ?? new Date();
    this.status = 'completed';
    this.errorMessage = null;
  }

  fail(params: FailSeoBriefExternalCallLogParams): void {
    this.responsePayload = params.responsePayload ?? null;
    this.estimatedCost = normalizeNumber(params.estimatedCost);
    this.cacheHit = params.cacheHit ?? false;
    this.finishedAt = params.finishedAt ?? new Date();
    this.status = 'failed';
    this.errorMessage = normalizeRequiredText(params.errorMessage);
  }
}
