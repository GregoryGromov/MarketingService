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
}
