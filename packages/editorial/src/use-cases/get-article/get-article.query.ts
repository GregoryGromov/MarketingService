import type { ArticleId } from '../../domain/article.aggregate.js';

export class GetArticleQuery {
  constructor(public readonly articleId: ArticleId) {}
}
