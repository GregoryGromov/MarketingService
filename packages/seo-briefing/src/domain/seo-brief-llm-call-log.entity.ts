import { generateId, type TypedId } from '@marketing-service/shared';
import type { SeoBriefRunId } from './seo-brief-run.aggregate.js';
import type { SeoBriefRunStepId } from './seo-brief-run-step.entity.js';
import type { SeoBriefJsonValue } from './seo-briefing.types.js';

export type SeoBriefLlmCallLogId = TypedId<'seo_brief_llm_call'>;
export type SeoBriefLlmCallStatus = 'running' | 'completed' | 'failed';

export interface StartSeoBriefLlmCallLogParams {
  runId: SeoBriefRunId;
  stepId?: SeoBriefRunStepId | null;
  operation: string;
  model: string;
  promptVersion: string;
  requestPayload: SeoBriefJsonValue;
}

export interface CompleteSeoBriefLlmCallLogParams {
  responsePayload: SeoBriefJsonValue;
  tokenUsageInput?: number | null;
  tokenUsageOutput?: number | null;
  estimatedCost?: number | null;
  finishedAt?: Date;
}

export interface FailSeoBriefLlmCallLogParams {
  errorMessage: string;
  responsePayload?: SeoBriefJsonValue | null;
  tokenUsageInput?: number | null;
  tokenUsageOutput?: number | null;
  estimatedCost?: number | null;
  finishedAt?: Date;
}

export interface SeoBriefLlmCallLogProps {
  id: SeoBriefLlmCallLogId;
  runId: SeoBriefRunId;
  stepId: SeoBriefRunStepId | null;
  operation: string;
  model: string;
  promptVersion: string;
  requestPayload: SeoBriefJsonValue;
  responsePayload: SeoBriefJsonValue | null;
  tokenUsageInput: number | null;
  tokenUsageOutput: number | null;
  estimatedCost: number | null;
  startedAt: Date;
  finishedAt: Date | null;
  status: SeoBriefLlmCallStatus;
  errorMessage: string | null;
  createdAt: Date;
}

function normalizeRequiredText(value: string): string {
  const nextValue = value.trim();
  if (nextValue.length === 0) {
    throw new Error('SEO brief LLM call log text fields must not be empty');
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

export class SeoBriefLlmCallLog {
  private constructor(
    public readonly id: SeoBriefLlmCallLogId,
    public readonly runId: SeoBriefRunId,
    public readonly stepId: SeoBriefRunStepId | null,
    public readonly operation: string,
    public readonly model: string,
    public readonly promptVersion: string,
    public readonly requestPayload: SeoBriefJsonValue,
    public responsePayload: SeoBriefJsonValue | null,
    public tokenUsageInput: number | null,
    public tokenUsageOutput: number | null,
    public estimatedCost: number | null,
    public readonly startedAt: Date,
    public finishedAt: Date | null,
    public status: SeoBriefLlmCallStatus,
    public errorMessage: string | null,
    public readonly createdAt: Date,
  ) {}

  static start(params: StartSeoBriefLlmCallLogParams): SeoBriefLlmCallLog {
    const now = new Date();

    return new SeoBriefLlmCallLog(
      generateId('seo_brief_llm_call'),
      params.runId,
      params.stepId ?? null,
      normalizeRequiredText(params.operation),
      normalizeRequiredText(params.model),
      normalizeRequiredText(params.promptVersion),
      params.requestPayload,
      null,
      null,
      null,
      null,
      now,
      null,
      'running',
      null,
      now,
    );
  }

  static rehydrate(props: SeoBriefLlmCallLogProps): SeoBriefLlmCallLog {
    return new SeoBriefLlmCallLog(
      props.id,
      props.runId,
      props.stepId,
      props.operation,
      props.model,
      props.promptVersion,
      props.requestPayload,
      props.responsePayload,
      props.tokenUsageInput,
      props.tokenUsageOutput,
      props.estimatedCost,
      props.startedAt,
      props.finishedAt,
      props.status,
      props.errorMessage,
      props.createdAt,
    );
  }

  complete(params: CompleteSeoBriefLlmCallLogParams): void {
    this.responsePayload = params.responsePayload;
    this.tokenUsageInput = normalizeNumber(params.tokenUsageInput);
    this.tokenUsageOutput = normalizeNumber(params.tokenUsageOutput);
    this.estimatedCost = normalizeNumber(params.estimatedCost);
    this.finishedAt = params.finishedAt ?? new Date();
    this.status = 'completed';
    this.errorMessage = null;
  }

  fail(params: FailSeoBriefLlmCallLogParams): void {
    this.responsePayload = params.responsePayload ?? null;
    this.tokenUsageInput = normalizeNumber(params.tokenUsageInput);
    this.tokenUsageOutput = normalizeNumber(params.tokenUsageOutput);
    this.estimatedCost = normalizeNumber(params.estimatedCost);
    this.finishedAt = params.finishedAt ?? new Date();
    this.status = 'failed';
    this.errorMessage = normalizeRequiredText(params.errorMessage);
  }
}
