import type { ArticleId } from '@marketing-service/editorial';

export class GetArticlePublicationPlansQuery {
  constructor(
    public readonly articleId: ArticleId,
  ) {}
}
