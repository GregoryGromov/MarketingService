import {
  AggregateRoot,
  createDomainEvent,
  generateId,
  type TypedId,
} from '@marketing-service/shared';
import type { ArticleId } from './article.aggregate.js';
import type { AdaptationVersionId } from './adaptation-version.entity.js';

export type AdaptationId = TypedId<'adaptation'>;
export type ChannelId = TypedId<'channel'>;
export type NodeStatus = 'pending' | 'generated' | 'edited' | 'approved' | 'outdated';

export interface CreateChannelAdaptationParams {
  articleId: ArticleId;
  channelId: ChannelId;
  displayName: string;
  promptInstructions: string | null;
  sourceLanguage: string;
}

export interface ChannelAdaptationProps {
  id: AdaptationId;
  articleId: ArticleId;
  channelId: ChannelId;
  displayName: string;
  promptInstructions: string | null;
  sourceLanguage: string;
  status: NodeStatus;
  adaptedContent: string | null;
  selectedVersionId: AdaptationVersionId | null;
  approvedVersionId: AdaptationVersionId | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ChannelAdaptation extends AggregateRoot {
  private constructor(
    public readonly id: AdaptationId,
    public readonly articleId: ArticleId,
    public readonly channelId: ChannelId,
    public readonly displayName: string,
    public readonly promptInstructions: string | null,
    public readonly sourceLanguage: string,
    public status: NodeStatus,
    public adaptedContent: string | null,
    public selectedVersionId: AdaptationVersionId | null,
    public approvedVersionId: AdaptationVersionId | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {
    super();
  }

  static create(params: CreateChannelAdaptationParams): ChannelAdaptation {
    const now = new Date();
    const adaptation = new ChannelAdaptation(
      generateId('adaptation'),
      params.articleId,
      params.channelId,
      params.displayName,
      params.promptInstructions,
      params.sourceLanguage,
      'pending',
      null,
      null,
      null,
      now,
      now,
    );

    adaptation.addEvent(
      createDomainEvent({
        eventName: 'AdaptationAdded',
        aggregateId: adaptation.id,
      }),
    );

    return adaptation;
  }

  static rehydrate(props: ChannelAdaptationProps): ChannelAdaptation {
    return new ChannelAdaptation(
      props.id,
      props.articleId,
      props.channelId,
      props.displayName,
      props.promptInstructions,
      props.sourceLanguage,
      props.status,
      props.adaptedContent,
      props.selectedVersionId,
      props.approvedVersionId,
      props.createdAt,
      props.updatedAt,
    );
  }

  markGenerated(versionId: AdaptationVersionId, adaptedContent: string): void {
    this.adaptedContent = adaptedContent;
    this.selectedVersionId = versionId;
    this.status = 'generated';
    this.updatedAt = new Date();

    this.addEvent(
      createDomainEvent({
        eventName: 'AdaptationGenerated',
        aggregateId: this.id,
      }),
    );
  }

  edit(versionId: AdaptationVersionId, adaptedContent: string): void {
    this.adaptedContent = adaptedContent;
    this.selectedVersionId = versionId;
    this.status = 'edited';
    this.updatedAt = new Date();

    this.addEvent(
      createDomainEvent({
        eventName: 'AdaptationEdited',
        aggregateId: this.id,
      }),
    );
  }

  selectVersion(versionId: AdaptationVersionId, adaptedContent: string): void {
    this.selectedVersionId = versionId;
    this.adaptedContent = adaptedContent;
    this.updatedAt = new Date();
  }

  approve(): void {
    if (this.status !== 'generated' && this.status !== 'edited') {
      throw new Error(`Cannot approve adaptation from status "${this.status}"`);
    }

    if (!this.selectedVersionId || !this.adaptedContent) {
      throw new Error('Cannot approve adaptation without selected version');
    }

    this.approvedVersionId = this.selectedVersionId;
    this.status = 'approved';
    this.updatedAt = new Date();

    this.addEvent(
      createDomainEvent({
        eventName: 'AdaptationApproved',
        aggregateId: this.id,
      }),
    );
  }

  markOutdated(): void {
    this.status = 'outdated';
    this.approvedVersionId = null;
    this.updatedAt = new Date();
  }

  resetToPending(): void {
    this.status = 'pending';
    this.selectedVersionId = null;
    this.approvedVersionId = null;
    this.adaptedContent = null;
    this.updatedAt = new Date();
  }
}
