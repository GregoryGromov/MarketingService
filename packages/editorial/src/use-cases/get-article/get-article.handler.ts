import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import { ArticleRepository } from '../../domain/article.repository.js';
import { GetArticleQuery } from './get-article.query.js';

@QueryHandler(GetArticleQuery)
export class GetArticleHandler implements IQueryHandler<GetArticleQuery> {
  constructor(private readonly articleRepository: ArticleRepository) {}

  async execute(query: GetArticleQuery) {
    return this.articleRepository.findById(query.articleId);
  }
}
