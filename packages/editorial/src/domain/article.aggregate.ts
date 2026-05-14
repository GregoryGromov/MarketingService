import {
  AggregateRoot,
  createDomainEvent,
  generateId,
  type TypedId,
} from '@marketing-service/shared';

export type ArticleId = TypedId<'article'>;
export type ProjectId = TypedId<'project'>;
export type ArticleStatus = 'draft' | 'ready' | 'active' | 'completed' | 'cancelled';

export interface Original {
  content: string;
  language: string;
  uploadedAt: Date;
}

export interface CreateArticleParams {
  projectId: ProjectId;
  content: string;
  language: string;
  releasePlanSnapshot?: Record<string, unknown> | null;
}

export interface ArticleProps {
  id: ArticleId;
  projectId: ProjectId;
  status: ArticleStatus;
  paused: boolean;
  releasePlanSnapshot: Record<string, unknown> | null;
  original: Original;
  createdAt: Date;
  updatedAt: Date;
}

export class Article extends AggregateRoot {
  private constructor(
    public readonly id: ArticleId,
    public readonly projectId: ProjectId,
    public status: ArticleStatus,
    public paused: boolean,
    public releasePlanSnapshot: Record<string, unknown> | null,
    public readonly original: Original,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {
    super();
  }

  static create(params: CreateArticleParams): Article {
    const now = new Date();

    const article = new Article(
      generateId('article'),
      params.projectId,
      'draft',
      false,
      params.releasePlanSnapshot ?? null,
      {
        content: params.content,
        language: params.language,
        uploadedAt: now,
      },
      now,
      now,
    );

    article.addEvent(
      createDomainEvent({
        eventName: 'ArticleCreated',
        aggregateId: article.id,
      }),
    );

    return article;
  }

  static rehydrate(props: ArticleProps): Article {
    return new Article(
      props.id,
      props.projectId,
      props.status,
      props.paused,
      props.releasePlanSnapshot,
      props.original,
      props.createdAt,
      props.updatedAt,
    );
  }

  removePublicationIntent(channelId: string, targetLanguage: string): void {
    const snapshot = this.releasePlanSnapshot;
    if (!snapshot || typeof snapshot !== 'object') {
      return;
    }

    const intents = Array.isArray(snapshot.publicationIntents)
      ? snapshot.publicationIntents
      : [];

    const nextIntents = intents
      .map((intent) => {
        if (!intent || typeof intent !== 'object' || intent.channelId !== channelId) {
          return intent;
        }

        const translations = Array.isArray(intent.translations) ? intent.translations : [];
        const nextTranslations = translations.filter((item: any) =>
          String(item?.targetLanguage || '').toLowerCase() !== targetLanguage.toLowerCase(),
        );

        return {
          ...intent,
          translations: nextTranslations,
        };
      })
      .filter((intent) => {
        if (!intent || typeof intent !== 'object') {
          return false;
        }

        const translations = Array.isArray(intent.translations) ? intent.translations : [];
        return translations.length > 0;
      });

    this.releasePlanSnapshot = {
      ...snapshot,
      publicationIntents: nextIntents,
    };
    this.updatedAt = new Date();

    this.addEvent(
      createDomainEvent({
        eventName: 'ArticlePublicationIntentRemoved',
        aggregateId: this.id,
      }),
    );
  }

  replaceOriginal(content: string, language: string, uploadedAt: Date = new Date()): void {
    this.original.content = content;
    this.original.language = language;
    this.original.uploadedAt = uploadedAt;
    this.updatedAt = new Date();
  }
}
