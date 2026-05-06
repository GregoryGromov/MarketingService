import { generateId, type TypedId } from '@marketing-service/shared';
import type { AdaptationId } from './channel-adaptation.entity.js';

export type AdaptationVersionId = TypedId<'adaptation_version'>;
export type AdaptationVersionKind = 'generated' | 'ai_revision' | 'manual_edit';

export interface CreateAdaptationVersionParams {
  adaptationId: AdaptationId;
  content: string;
  kind: AdaptationVersionKind;
  sourceVersionId?: AdaptationVersionId | null;
  meta?: Record<string, unknown> | null;
}

export interface AdaptationVersionProps {
  id: AdaptationVersionId;
  adaptationId: AdaptationId;
  content: string;
  kind: AdaptationVersionKind;
  sourceVersionId: AdaptationVersionId | null;
  meta: Record<string, unknown> | null;
  createdAt: Date;
}

export class AdaptationVersion {
  private constructor(
    public readonly id: AdaptationVersionId,
    public readonly adaptationId: AdaptationId,
    public readonly content: string,
    public readonly kind: AdaptationVersionKind,
    public readonly sourceVersionId: AdaptationVersionId | null,
    public readonly meta: Record<string, unknown> | null,
    public readonly createdAt: Date,
  ) {}

  static create(params: CreateAdaptationVersionParams): AdaptationVersion {
    return new AdaptationVersion(
      generateId('adaptation_version'),
      params.adaptationId,
      params.content,
      params.kind,
      params.sourceVersionId ?? null,
      params.meta ?? null,
      new Date(),
    );
  }

  static rehydrate(props: AdaptationVersionProps): AdaptationVersion {
    return new AdaptationVersion(
      props.id,
      props.adaptationId,
      props.content,
      props.kind,
      props.sourceVersionId,
      props.meta,
      props.createdAt,
    );
  }
}
