import type { Article, ArticleId } from './article.aggregate.js';
export declare abstract class ArticleRepository {
    abstract findById(id: ArticleId): Promise<Article | null>;
    abstract save(article: Article): Promise<void>;
}
//# sourceMappingURL=article.repository.d.ts.map