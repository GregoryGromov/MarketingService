import type { ArticleId } from '@marketing-service/editorial';

export class GetArticlePublicationsQuery {
  constructor(public readonly articleId: ArticleId) {}
}
