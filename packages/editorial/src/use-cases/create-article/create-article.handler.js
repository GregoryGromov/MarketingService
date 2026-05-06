var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { CommandHandler, EventBus } from '@nestjs/cqrs';
import { Article } from '../../domain/article.aggregate.js';
import { ArticleRepository } from '../../domain/article.repository.js';
import { CreateArticleCommand } from './create-article.command.js';
let CreateArticleHandler = class CreateArticleHandler {
    articleRepository;
    eventBus;
    constructor(articleRepository, eventBus) {
        this.articleRepository = articleRepository;
        this.eventBus = eventBus;
    }
    async execute(command) {
        const article = Article.create({
            projectId: command.projectId,
            content: command.content,
            language: command.language,
            releasePlanSnapshot: command.releasePlanSnapshot,
        });
        await this.articleRepository.save(article);
        this.eventBus.publishAll(article.pullEvents());
        return article.id;
    }
};
CreateArticleHandler = __decorate([
    CommandHandler(CreateArticleCommand),
    __metadata("design:paramtypes", [ArticleRepository,
        EventBus])
], CreateArticleHandler);
export { CreateArticleHandler };
//# sourceMappingURL=create-article.handler.js.map