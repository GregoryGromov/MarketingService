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
import { ChannelAdaptation, } from '../../domain/channel-adaptation.entity.js';
import { ArticleRepository } from '../../domain/article.repository.js';
import { ChannelAdaptationRepository } from '../../domain/channel-adaptation.repository.js';
import { AddAdaptationCommand } from './add-adaptation.command.js';
let AddAdaptationHandler = class AddAdaptationHandler {
    articleRepository;
    channelAdaptationRepository;
    eventBus;
    constructor(articleRepository, channelAdaptationRepository, eventBus) {
        this.articleRepository = articleRepository;
        this.channelAdaptationRepository = channelAdaptationRepository;
        this.eventBus = eventBus;
    }
    async execute(command) {
        const article = await this.articleRepository.findById(command.articleId);
        if (!article) {
            throw new Error(`Article ${command.articleId} not found`);
        }
        const existingAdaptation = await this.channelAdaptationRepository.findByArticleIdAndChannelId(command.articleId, command.channelId);
        if (existingAdaptation) {
            throw new Error(`Article ${command.articleId} already has adaptation for channel ${command.channelId}`);
        }
        const adaptation = ChannelAdaptation.create({
            articleId: article.id,
            channelId: command.channelId,
            displayName: command.displayName,
            promptInstructions: command.promptInstructions,
            sourceLanguage: article.original.language,
        });
        await this.channelAdaptationRepository.save(adaptation);
        this.eventBus.publishAll(adaptation.pullEvents());
        return adaptation.id;
    }
};
AddAdaptationHandler = __decorate([
    CommandHandler(AddAdaptationCommand),
    __metadata("design:paramtypes", [ArticleRepository,
        ChannelAdaptationRepository,
        EventBus])
], AddAdaptationHandler);
export { AddAdaptationHandler };
//# sourceMappingURL=add-adaptation.handler.js.map