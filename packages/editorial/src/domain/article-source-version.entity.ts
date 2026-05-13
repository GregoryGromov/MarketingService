import { generateId, type TypedId } from '@marketing-service/shared';
import type { ArticleId } from './article.aggregate.js';

export type ArticleSourceVersionId = TypedId<'article_source_version'>;
export type ArticleSourceVersionKind =
  | 'original'
  | 'suggested_fix'
  | 'manual_edit'
  | 'accepted_source';

export interface CreateArticleSourceVersionParams {
  articleId: ArticleId;
  content: string;
  language: string;
  kind: ArticleSourceVersionKind;
  sourceVersionId?: ArticleSourceVersionId | null;
  meta?: Record<string, unknown> | null;
}

export interface ArticleSourceVersionProps {
  id: ArticleSourceVersionId;
  articleId: ArticleId;
  content: string;
  language: string;
  kind: ArticleSourceVersionKind;
  sourceVersionId: ArticleSourceVersionId | null;
  meta: Record<string, unknown> | null;
  createdAt: Date;
}

export class ArticleSourceVersion {
  private constructor(
    public readonly id: ArticleSourceVersionId,
    public readonly articleId: ArticleId,
    public readonly content: string,
    public readonly language: string,
    public readonly kind: ArticleSourceVersionKind,
    public readonly sourceVersionId: ArticleSourceVersionId | null,
    public readonly meta: Record<string, unknown> | null,
    public readonly createdAt: Date,
  ) {}

  static create(params: CreateArticleSourceVersionParams): ArticleSourceVersion {
    return new ArticleSourceVersion(
      generateId('article_source_version'),
      params.articleId,
      params.content,
      params.language.trim().toLowerCase(),
      params.kind,
      params.sourceVersionId ?? null,
      params.meta ?? null,
      new Date(),
    );
  }

  static rehydrate(props: ArticleSourceVersionProps): ArticleSourceVersion {
    return new ArticleSourceVersion(
      props.id,
      props.articleId,
      props.content,
      props.language,
      props.kind,
      props.sourceVersionId,
      props.meta,
      props.createdAt,
    );
  }
}
