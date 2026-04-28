export { EditorialModule } from './editorial.module';
export {
  Article,
  type ArticleId,
  type ArticleStatus,
  type CreateArticleParams,
  type Original,
  type ProjectId,
} from './domain/article.aggregate';
export { ArticleRepository } from './domain/article.repository';
export { CreateArticleCommand } from './use-cases/create-article/create-article.command';
