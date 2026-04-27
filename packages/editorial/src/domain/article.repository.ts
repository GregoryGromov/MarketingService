import type { Article, ArticleId } from './article.aggregate';

export abstract class ArticleRepository {
  abstract findById(id: ArticleId): Promise<Article | null>;
  abstract save(article: Article): Promise<void>;
}
