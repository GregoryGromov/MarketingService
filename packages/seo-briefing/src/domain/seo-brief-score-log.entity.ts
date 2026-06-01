import { generateId, type TypedId } from '@marketing-service/shared';
import type { SeoBriefRunId } from './seo-brief-run.aggregate.js';
import type { SeoBriefRunStepId } from './seo-brief-run-step.entity.js';
import type { SeoBriefJsonValue } from './seo-briefing.types.js';

export type SeoBriefScoreLogId = TypedId<'seo_brief_score_log'>;

export interface CreateSeoBriefScoreLogParams {
  runId: SeoBriefRunId;
  stepId?: SeoBriefRunStepId | null;
  formulaName: string;
  inputPayload: SeoBriefJsonValue;
  resultPayload: SeoBriefJsonValue;
}

export interface SeoBriefScoreLogProps {
  id: SeoBriefScoreLogId;
  runId: SeoBriefRunId;
  stepId: SeoBriefRunStepId | null;
  formulaName: string;
  inputPayload: SeoBriefJsonValue;
  resultPayload: SeoBriefJsonValue;
  createdAt: Date;
}

function normalizeRequiredText(value: string): string {
  const nextValue = value.trim();
  if (nextValue.length === 0) {
    throw new Error('SEO brief score log text fields must not be empty');
  }

  return nextValue;
}

export class SeoBriefScoreLog {
  private constructor(
    public readonly id: SeoBriefScoreLogId,
    public readonly runId: SeoBriefRunId,
    public readonly stepId: SeoBriefRunStepId | null,
    public readonly formulaName: string,
    public readonly inputPayload: SeoBriefJsonValue,
    public readonly resultPayload: SeoBriefJsonValue,
    public readonly createdAt: Date,
  ) {}

  static create(params: CreateSeoBriefScoreLogParams): SeoBriefScoreLog {
    return new SeoBriefScoreLog(
      generateId('seo_brief_score_log'),
      params.runId,
      params.stepId ?? null,
      normalizeRequiredText(params.formulaName),
      params.inputPayload,
      params.resultPayload,
      new Date(),
    );
  }

  static rehydrate(props: SeoBriefScoreLogProps): SeoBriefScoreLog {
    return new SeoBriefScoreLog(
      props.id,
      props.runId,
      props.stepId,
      props.formulaName,
      props.inputPayload,
      props.resultPayload,
      props.createdAt,
    );
  }
}
