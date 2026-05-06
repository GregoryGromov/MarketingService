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
import { Translation } from '../../domain/translation.aggregate.js';
import { TranslationRepository } from '../../domain/translation.repository.js';
import { AddTranslationCommand } from './add-translation.command.js';
let AddTranslationHandler = class AddTranslationHandler {
    channelAdaptationRepository;
    translationRepository;
    eventBus;
    constructor(channelAdaptationRepository, translationRepository, eventBus) {
        this.channelAdaptationRepository = channelAdaptationRepository;
        this.translationRepository = translationRepository;
        this.eventBus = eventBus;
    }
    async execute(command) {
        const adaptation = await this.channelAdaptationRepository.findById(command.adaptationId);
        if (!adaptation || adaptation.articleId !== command.articleId) {
            throw new Error(`Adaptation ${command.adaptationId} not found in article ${command.articleId}`);
        }
        const existingTranslation = await this.translationRepository.findByAdaptationIdAndTargetLanguage(command.adaptationId, command.targetLanguage);
        if (existingTranslation) {
            throw new Error(`Adaptation ${command.adaptationId} already has translation for ${command.targetLanguage}`);
        }
        const translation = Translation.create({
            adaptationId: adaptation.id,
            sourceLanguage: adaptation.sourceLanguage,
            targetLanguage: command.targetLanguage,
        });
        await this.translationRepository.save(translation);
        this.eventBus.publishAll(translation.pullEvents());
        return translation.id;
    }
};
AddTranslationHandler = __decorate([
    CommandHandler(AddTranslationCommand),
    __metadata("design:paramtypes", [ChannelAdaptationRepository,
        TranslationRepository,
        EventBus])
], AddTranslationHandler);
export { AddTranslationHandler };
//# sourceMappingURL=add-translation.handler.js.map