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
import { ChannelAdaptationRepository } from '../../domain/channel-adaptation.repository.js';
import { TranslationRepository } from '../../domain/translation.repository.js';
import { TranslationGeneratorPort } from '../../ports/translation-generator.port.js';
import { GenerateTranslationCommand } from './generate-translation.command.js';
let GenerateTranslationHandler = class GenerateTranslationHandler {
    channelAdaptationRepository;
    translationRepository;
    translationGenerator;
    eventBus;
    constructor(channelAdaptationRepository, translationRepository, translationGenerator, eventBus) {
        this.channelAdaptationRepository = channelAdaptationRepository;
        this.translationRepository = translationRepository;
        this.translationGenerator = translationGenerator;
        this.eventBus = eventBus;
    }
    async execute(command) {
        const adaptation = await this.channelAdaptationRepository.findById(command.adaptationId);
        if (!adaptation || adaptation.articleId !== command.articleId) {
            throw new Error(`Adaptation ${command.adaptationId} not found in article ${command.articleId}`);
        }
        const translation = await this.translationRepository.findById(command.translationId);
        if (!translation || translation.adaptationId !== command.adaptationId) {
            throw new Error(`Translation ${command.translationId} not found for adaptation ${command.adaptationId}`);
        }
        if (!adaptation.adaptedContent) {
            throw new Error(`Adaptation ${command.adaptationId} has no content to translate`);
        }
        const translatedContent = await this.translationGenerator.translate({
            sourceContent: adaptation.adaptedContent,
            sourceLanguage: adaptation.sourceLanguage,
            targetLanguage: translation.targetLanguage,
            channelId: adaptation.channelId,
            displayName: adaptation.displayName,
            promptInstructions: adaptation.promptInstructions,
        });
        translation.markGenerated(translatedContent);
        await this.translationRepository.save(translation);
        this.eventBus.publishAll(translation.pullEvents());
        return translatedContent;
    }
};
GenerateTranslationHandler = __decorate([
    CommandHandler(GenerateTranslationCommand),
    __metadata("design:paramtypes", [ChannelAdaptationRepository,
        TranslationRepository,
        TranslationGeneratorPort,
        EventBus])
], GenerateTranslationHandler);
export { GenerateTranslationHandler };
//# sourceMappingURL=generate-translation.handler.js.map