import type { Article, ArticleId, ProjectId } from './article.aggregate.js';

export abstract class ArticleRepository {
  abstract findById(id: ArticleId): Promise<Article | null>;
  abstract findByProjectId(projectId: ProjectId): Promise<Article[]>;
  abstract save(article: Article): Promise<void>;
}
