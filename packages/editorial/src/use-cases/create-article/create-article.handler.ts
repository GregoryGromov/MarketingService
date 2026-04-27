import { CommandHandler, EventBus, type ICommandHandler } from '@nestjs/cqrs';
import { Article } from '../../domain/article.aggregate';
import { ArticleRepository } from '../../domain/article.repository';
import { CreateArticleCommand } from './create-article.command';

@CommandHandler(CreateArticleCommand)
export class CreateArticleHandler implements ICommandHandler<CreateArticleCommand, string> {
  constructor(
    private readonly articleRepository: ArticleRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateArticleCommand): Promise<string> {
    const article = Article.create({
      projectId: command.projectId,
      content: command.content,
      language: command.language,
    });

    await this.articleRepository.save(article);
    this.eventBus.publishAll(article.pullEvents());

    return article.id;
  }
}
