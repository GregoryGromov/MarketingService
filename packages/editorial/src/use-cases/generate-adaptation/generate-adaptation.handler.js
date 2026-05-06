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
import { AdaptationVersionRepository } from '../../domain/adaptation-version.repository.js';
import { AdaptationVersion } from '../../domain/adaptation-version.entity.js';
import { AdaptationGeneratorPort } from '../../ports/adaptation-generator.port.js';
import { ArticleRepository } from '../../domain/article.repository.js';
import { ChannelAdaptationRepository } from '../../domain/channel-adaptation.repository.js';
import { GenerateAdaptationCommand } from './generate-adaptation.command.js';
let GenerateAdaptationHandler = class GenerateAdaptationHandler {
    articleRepository;
    channelAdaptationRepository;
    adaptationVersionRepository;
    adaptationGenerator;
    eventBus;
    constructor(articleRepository, channelAdaptationRepository, adaptationVersionRepository, adaptationGenerator, eventBus) {
        this.articleRepository = articleRepository;
        this.channelAdaptationRepository = channelAdaptationRepository;
        this.adaptationVersionRepository = adaptationVersionRepository;
        this.adaptationGenerator = adaptationGenerator;
        this.eventBus = eventBus;
    }
    async execute(command) {
        const adaptation = await this.channelAdaptationRepository.findById(command.adaptationId);
        if (!adaptation || adaptation.articleId !== command.articleId) {
            throw new Error(`Adaptation ${command.adaptationId} not found in article ${command.articleId}`);
        }
        const article = await this.articleRepository.findById(command.articleId);
        if (!article) {
            throw new Error(`Article ${command.articleId} not found`);
        }
        const adaptedContent = await this.adaptationGenerator.generate({
            originalContent: article.original.content,
            sourceLanguage: article.original.language,
            channelId: adaptation.channelId,
            displayName: adaptation.displayName,
            promptInstructions: adaptation.promptInstructions,
        });
        const version = AdaptationVersion.create({
            adaptationId: adaptation.id,
            content: adaptedContent,
            kind: 'generated',
            sourceVersionId: adaptation.selectedVersionId,
        });
        await this.adaptationVersionRepository.save(version);
        adaptation.markGenerated(version.id, adaptedContent);
        await this.channelAdaptationRepository.save(adaptation);
        this.eventBus.publishAll(adaptation.pullEvents());
        return adaptedContent;
    }
};
GenerateAdaptationHandler = __decorate([
    CommandHandler(GenerateAdaptationCommand),
    __metadata("design:paramtypes", [ArticleRepository,
        ChannelAdaptationRepository,
        AdaptationVersionRepository,
        AdaptationGeneratorPort,
        EventBus])
], GenerateAdaptationHandler);
export { GenerateAdaptationHandler };
//# sourceMappingURL=generate-adaptation.handler.js.map