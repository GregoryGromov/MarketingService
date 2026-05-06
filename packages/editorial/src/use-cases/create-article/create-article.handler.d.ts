import { EventBus, type ICommandHandler } from '@nestjs/cqrs';
import { ArticleRepository } from '../../domain/article.repository.js';
import { CreateArticleCommand } from './create-article.command.js';
export declare class CreateArticleHandler implements ICommandHandler<CreateArticleCommand, string> {
    private readonly articleRepository;
    private readonly eventBus;
    constructor(articleRepository: ArticleRepository, eventBus: EventBus);
    execute(command: CreateArticleCommand): Promise<string>;
}
//# sourceMappingURL=create-article.handler.d.ts.map