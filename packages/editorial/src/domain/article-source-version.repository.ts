import type { ArticleId } from './article.aggregate.js';
import type {
  ArticleSourceVersion,
  ArticleSourceVersionId,
} from './article-source-version.entity.js';

export abstract class ArticleSourceVersionRepository {
  abstract findById(id: ArticleSourceVersionId): Promise<ArticleSourceVersion | null>;
  abstract findByArticleId(articleId: ArticleId): Promise<ArticleSourceVersion[]>;
  abstract save(version: ArticleSourceVersion): Promise<void>;
  abstract deleteByArticleIdExcept(
    articleId: ArticleId,
    keepIds: ArticleSourceVersionId[],
  ): Promise<void>;
}
