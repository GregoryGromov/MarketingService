import {
  AggregateRoot,
  createDomainEvent,
  generateId,
  type TypedId,
} from '@marketing-service/shared';
import type { AdaptationId, NodeStatus } from './channel-adaptation.entity.js';

export type TranslationId = TypedId<'translation'>;

export interface CreateTranslationParams {
  adaptationId: AdaptationId;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface TranslationProps {
  id: TranslationId;
  adaptationId: AdaptationId;
  sourceLanguage: string;
  targetLanguage: string;
  status: NodeStatus;
  translatedContent: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Translation extends AggregateRoot {
  private constructor(
    public readonly id: TranslationId,
    public readonly adaptationId: AdaptationId,
    public readonly sourceLanguage: string,
    public readonly targetLanguage: string,
    public status: NodeStatus,
    public translatedContent: string | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {
    super();
  }

  static create(params: CreateTranslationParams): Translation {
    const now = new Date();
    const translation = new Translation(
      generateId('translation'),
      params.adaptationId,
      params.sourceLanguage,
      params.targetLanguage,
      'pending',
      null,
      now,
      now,
    );

    translation.addEvent(
      createDomainEvent({
        eventName: 'TranslationAdded',
        aggregateId: translation.id,
      }),
    );

    return translation;
  }

  static rehydrate(props: TranslationProps): Translation {
    return new Translation(
      props.id,
      props.adaptationId,
      props.sourceLanguage,
      props.targetLanguage,
      props.status,
      props.translatedContent,
      props.createdAt,
      props.updatedAt,
    );
  }

  markGenerated(translatedContent: string): void {
    this.translatedContent = translatedContent;
    this.status = 'generated';
    this.updatedAt = new Date();

    this.addEvent(
      createDomainEvent({
        eventName: 'TranslationGenerated',
        aggregateId: this.id,
      }),
    );
  }

  edit(translatedContent: string): void {
    this.translatedContent = translatedContent;
    this.status = 'edited';
    this.updatedAt = new Date();

    this.addEvent(
      createDomainEvent({
        eventName: 'TranslationEdited',
        aggregateId: this.id,
      }),
    );
  }

  approve(): void {
    if (this.status !== 'generated' && this.status !== 'edited') {
      throw new Error(`Cannot approve translation from status "${this.status}"`);
    }

    if (!this.translatedContent) {
      throw new Error('Cannot approve translation without content');
    }

    this.status = 'approved';
    this.updatedAt = new Date();

    this.addEvent(
      createDomainEvent({
        eventName: 'TranslationApproved',
        aggregateId: this.id,
      }),
    );
  }

  markOutdated(): void {
    this.status = 'outdated';
    this.updatedAt = new Date();
  }

  resetToPending(): void {
    this.status = 'pending';
    this.translatedContent = null;
    this.updatedAt = new Date();
  }
}
