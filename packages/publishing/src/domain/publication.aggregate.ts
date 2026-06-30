import {
  AggregateRoot,
  createDomainEvent,
  generateId,
  type TypedId,
} from '@marketing-service/shared';
import type { AdaptationId, ArticleId, ChannelId } from '@marketing-service/editorial';

export type PublicationId = TypedId<'publication'>;
export type PlannedPublicationId = TypedId<'planned_publication'>;
export type PublicationStatus = 'scheduled' | 'publishing' | 'published' | 'failed';
export type PublicationPublishingTarget = 'test' | 'production';

export interface CreatePublicationParams {
  articleId: ArticleId;
  adaptationId: AdaptationId;
  plannedPublicationId?: PlannedPublicationId | null;
  channelId: ChannelId;
  displayName: string;
  targetLanguage: string;
  publishAt: Date;
  publishingTarget?: PublicationPublishingTarget;
}

export interface PublicationProps {
  id: PublicationId;
  articleId: ArticleId;
  adaptationId: AdaptationId;
  plannedPublicationId: PlannedPublicationId | null;
  channelId: ChannelId;
  displayName: string;
  targetLanguage: string;
  publishAt: Date;
  publishingTarget: PublicationPublishingTarget;
  status: PublicationStatus;
  telegramChatId: string | null;
  telegramMessageId: string | null;
  publishedAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Publication extends AggregateRoot {
  private constructor(
    public readonly id: PublicationId,
    public readonly articleId: ArticleId,
    public readonly adaptationId: AdaptationId,
    public readonly plannedPublicationId: PlannedPublicationId | null,
    public readonly channelId: ChannelId,
    public readonly displayName: string,
    public readonly targetLanguage: string,
    public publishAt: Date,
    public readonly publishingTarget: PublicationPublishingTarget,
    public status: PublicationStatus,
    public telegramChatId: string | null,
    public telegramMessageId: string | null,
    public publishedAt: Date | null,
    public errorMessage: string | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {
    super();
  }

  static create(params: CreatePublicationParams): Publication {
    const now = new Date();
    const publication = new Publication(
      generateId('publication'),
      params.articleId,
      params.adaptationId,
      params.plannedPublicationId ?? null,
      params.channelId,
      params.displayName,
      params.targetLanguage.toLowerCase(),
      params.publishAt,
      params.publishingTarget ?? 'test',
      'scheduled',
      null,
      null,
      null,
      null,
      now,
      now,
    );

    publication.addEvent(
      createDomainEvent({
        eventName: 'PublicationScheduled',
        aggregateId: publication.id,
      }),
    );

    return publication;
  }

  static rehydrate(props: PublicationProps): Publication {
    return new Publication(
      props.id,
      props.articleId,
      props.adaptationId,
      props.plannedPublicationId,
      props.channelId,
      props.displayName,
      props.targetLanguage,
      props.publishAt,
      props.publishingTarget ?? 'test',
      props.status,
      props.telegramChatId,
      props.telegramMessageId,
      props.publishedAt,
      props.errorMessage,
      props.createdAt,
      props.updatedAt,
    );
  }

  reschedule(publishAt: Date): void {
    if (this.status === 'published') {
      return;
    }

    this.publishAt = publishAt;
    this.status = 'scheduled';
    this.telegramChatId = null;
    this.telegramMessageId = null;
    this.publishedAt = null;
    this.errorMessage = null;
    this.updatedAt = new Date();
  }

  markPublishing(): void {
    if (this.status !== 'scheduled' && this.status !== 'failed') {
      return;
    }

    this.status = 'publishing';
    this.errorMessage = null;
    this.updatedAt = new Date();
  }

  markPublished(params: { telegramChatId: string; telegramMessageId: string }): void {
    this.status = 'published';
    this.telegramChatId = params.telegramChatId;
    this.telegramMessageId = params.telegramMessageId;
    this.publishedAt = new Date();
    this.errorMessage = null;
    this.updatedAt = new Date();

    this.addEvent(
      createDomainEvent({
        eventName: 'PublicationPublished',
        aggregateId: this.id,
      }),
    );
  }

  markFailed(message: string): void {
    this.status = 'failed';
    this.errorMessage = message;
    this.updatedAt = new Date();
  }
}
