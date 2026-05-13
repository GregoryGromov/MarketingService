import { generateId, type TypedId } from '@marketing-service/shared';
import type { CampaignId } from './campaign.aggregate.js';
import type { CampaignArtifactType } from './campaign-artifact.entity.js';
import type { PlannedPublicationId } from './planned-publication.entity.js';

export type QualityCheckResultId = TypedId<'quality_check_result'>;
export type QualityCheckType =
  | 'source_guideline_check'
  | 'stage_1_adaptation_quality'
  | 'stage_2_translation_fidelity';
export type QualityCheckOutcome = 'passed' | 'warning' | 'failed' | 'blocked';
export type QualityCheckReason = string | Record<string, unknown>;

export interface CreateQualityCheckResultParams {
  campaignId: CampaignId;
  plannedPublicationId?: PlannedPublicationId | null;
  artifactType: CampaignArtifactType;
  artifactId: string;
  artifactVersionId?: string | null;
  checkType: QualityCheckType;
  result: QualityCheckOutcome;
  attemptNumber?: number;
  reasons: QualityCheckReason[];
  suggestedFix?: Record<string, unknown> | null;
  rawAiResult?: Record<string, unknown> | null;
}

export interface QualityCheckResultProps {
  id: QualityCheckResultId;
  campaignId: CampaignId;
  plannedPublicationId: PlannedPublicationId | null;
  artifactType: CampaignArtifactType;
  artifactId: string;
  artifactVersionId: string | null;
  checkType: QualityCheckType;
  result: QualityCheckOutcome;
  attemptNumber: number;
  reasons: QualityCheckReason[];
  suggestedFix: Record<string, unknown> | null;
  rawAiResult: Record<string, unknown> | null;
  createdAt: Date;
}

function normalizeText(value?: string | null): string | null {
  const nextValue = value?.trim();
  return nextValue ? nextValue : null;
}

export class QualityCheckResult {
  private constructor(
    public readonly id: QualityCheckResultId,
    public readonly campaignId: CampaignId,
    public readonly plannedPublicationId: PlannedPublicationId | null,
    public readonly artifactType: CampaignArtifactType,
    public readonly artifactId: string,
    public readonly artifactVersionId: string | null,
    public readonly checkType: QualityCheckType,
    public readonly result: QualityCheckOutcome,
    public readonly attemptNumber: number,
    public readonly reasons: QualityCheckReason[],
    public readonly suggestedFix: Record<string, unknown> | null,
    public readonly rawAiResult: Record<string, unknown> | null,
    public readonly createdAt: Date,
  ) {}

  static create(params: CreateQualityCheckResultParams): QualityCheckResult {
    return new QualityCheckResult(
      generateId('quality_check_result'),
      params.campaignId,
      params.plannedPublicationId ?? null,
      params.artifactType,
      params.artifactId,
      normalizeText(params.artifactVersionId),
      params.checkType,
      params.result,
      params.attemptNumber ?? 1,
      params.reasons,
      params.suggestedFix ?? null,
      params.rawAiResult ?? null,
      new Date(),
    );
  }

  static rehydrate(props: QualityCheckResultProps): QualityCheckResult {
    return new QualityCheckResult(
      props.id,
      props.campaignId,
      props.plannedPublicationId,
      props.artifactType,
      props.artifactId,
      props.artifactVersionId,
      props.checkType,
      props.result,
      props.attemptNumber,
      props.reasons,
      props.suggestedFix,
      props.rawAiResult,
      props.createdAt,
    );
  }
}
