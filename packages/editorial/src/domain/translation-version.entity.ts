import { generateId, type TypedId } from '@marketing-service/shared';
import type { TranslationId } from './translation.aggregate.js';

export type TranslationVersionId = TypedId<'translation_version'>;
export type TranslationVersionKind = 'generated' | 'ai_revision' | 'manual_edit';

export interface CreateTranslationVersionParams {
  translationId: TranslationId;
  content: string;
  kind: TranslationVersionKind;
  sourceVersionId?: TranslationVersionId | null;
  meta?: Record<string, unknown> | null;
}

export interface TranslationVersionProps {
  id: TranslationVersionId;
  translationId: TranslationId;
  content: string;
  kind: TranslationVersionKind;
  sourceVersionId: TranslationVersionId | null;
  meta: Record<string, unknown> | null;
  createdAt: Date;
}

export class TranslationVersion {
  private constructor(
    public readonly id: TranslationVersionId,
    public readonly translationId: TranslationId,
    public readonly content: string,
    public readonly kind: TranslationVersionKind,
    public readonly sourceVersionId: TranslationVersionId | null,
    public readonly meta: Record<string, unknown> | null,
    public readonly createdAt: Date,
  ) {}

  static create(params: CreateTranslationVersionParams): TranslationVersion {
    return new TranslationVersion(
      generateId('translation_version'),
      params.translationId,
      params.content,
      params.kind,
      params.sourceVersionId ?? null,
      params.meta ?? null,
      new Date(),
    );
  }

  static rehydrate(props: TranslationVersionProps): TranslationVersion {
    return new TranslationVersion(
      props.id,
      props.translationId,
      props.content,
      props.kind,
      props.sourceVersionId,
      props.meta,
      props.createdAt,
    );
  }
}
