import {
  AggregateRoot,
  createDomainEvent,
  generateId,
  type TypedId,
} from '@marketing-service/shared';

export type ArticleId = TypedId<'article'>;
export type ProjectId = TypedId<'project'>;
export type ArticleStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'cancelled';

export interface Original {
  content: string;
  language: string;
  uploadedAt: Date;
}

export interface CreateArticleParams {
  projectId: ProjectId;
  content: string;
  language: string;
}

export class Article extends AggregateRoot {
  private constructor(
    public readonly id: ArticleId,
    public readonly projectId: ProjectId,
    public status: ArticleStatus,
    public paused: boolean,
    public publishAt: Date | null,
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
      null,
      null,
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
}
