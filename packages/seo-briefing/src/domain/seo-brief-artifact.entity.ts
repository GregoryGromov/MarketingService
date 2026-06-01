import { generateId, type TypedId } from '@marketing-service/shared';
import type { SeoBriefRunId } from './seo-brief-run.aggregate.js';
import type { SeoBriefRunStage } from './seo-brief-run-step.entity.js';
import type { SeoBriefJsonValue } from './seo-briefing.types.js';

export type SeoBriefArtifactId = TypedId<'seo_brief_artifact'>;

export interface CreateSeoBriefArtifactParams {
  runId: SeoBriefRunId;
  stage: SeoBriefRunStage;
  artifactType: string;
  payload: SeoBriefJsonValue;
  attempt?: number;
}

export interface SeoBriefArtifactProps {
  id: SeoBriefArtifactId;
  runId: SeoBriefRunId;
  stage: SeoBriefRunStage;
  artifactType: string;
  payload: SeoBriefJsonValue;
  attempt: number;
  createdAt: Date;
}

export class SeoBriefArtifact {
  private constructor(
    public readonly id: SeoBriefArtifactId,
    public readonly runId: SeoBriefRunId,
    public readonly stage: SeoBriefRunStage,
    public readonly artifactType: string,
    public readonly payload: SeoBriefJsonValue,
    public readonly attempt: number,
    public readonly createdAt: Date,
  ) {}

  static create(params: CreateSeoBriefArtifactParams): SeoBriefArtifact {
    return new SeoBriefArtifact(
      generateId('seo_brief_artifact'),
      params.runId,
      params.stage,
      params.artifactType.trim(),
      params.payload,
      params.attempt ?? 1,
      new Date(),
    );
  }

  static rehydrate(props: SeoBriefArtifactProps): SeoBriefArtifact {
    return new SeoBriefArtifact(
      props.id,
      props.runId,
      props.stage,
      props.artifactType,
      props.payload,
      props.attempt,
      props.createdAt,
    );
  }
}
