var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { CommandHandler } from '@nestjs/cqrs';
import { ChannelAdaptationRepository } from '../../domain/channel-adaptation.repository.js';
import { TranslationRepository } from '../../domain/translation.repository.js';
import { TelegramPublisherPort, } from '../../ports/telegram-publisher.port.js';
import { PublishTelegramMessageCommand } from './publish-telegram-message.command.js';
let PublishTelegramMessageHandler = class PublishTelegramMessageHandler {
    channelAdaptationRepository;
    translationRepository;
    telegramPublisher;
    constructor(channelAdaptationRepository, translationRepository, telegramPublisher) {
        this.channelAdaptationRepository = channelAdaptationRepository;
        this.translationRepository = translationRepository;
        this.telegramPublisher = telegramPublisher;
    }
    async execute(command) {
        const adaptation = await this.channelAdaptationRepository.findById(command.adaptationId);
        if (!adaptation || adaptation.articleId !== command.articleId) {
            throw new Error(`Adaptation ${command.adaptationId} not found in article ${command.articleId}`);
        }
        if (adaptation.channelId !== 'channel_telegram') {
            throw new Error(`Adaptation ${adaptation.id} belongs to ${adaptation.channelId} and cannot be published to Telegram`);
        }
        const targetLanguage = (command.targetLanguage?.trim() || adaptation.sourceLanguage).toLowerCase();
        if (targetLanguage === adaptation.sourceLanguage.toLowerCase()) {
            if (adaptation.status !== 'approved' || !adaptation.adaptedContent) {
                throw new Error(`Adaptation ${adaptation.id} is not approved for Telegram publishing`);
            }
            return this.telegramPublisher.publishMessage({
                language: targetLanguage,
                text: adaptation.adaptedContent,
            });
        }
        const translation = await this.translationRepository.findByAdaptationIdAndTargetLanguage(adaptation.id, targetLanguage);
        if (!translation) {
            throw new Error(`Translation ${targetLanguage} not found for adaptation ${adaptation.id}`);
        }
        if (translation.status !== 'approved' || !translation.translatedContent) {
            throw new Error(`Translation ${translation.id} (${targetLanguage}) is not approved for Telegram publishing`);
        }
        return this.telegramPublisher.publishMessage({
            language: targetLanguage,
            text: translation.translatedContent,
        });
    }
};
PublishTelegramMessageHandler = __decorate([
    CommandHandler(PublishTelegramMessageCommand),
    __metadata("design:paramtypes", [ChannelAdaptationRepository,
        TranslationRepository,
        TelegramPublisherPort])
], PublishTelegramMessageHandler);
export { PublishTelegramMessageHandler };
//# sourceMappingURL=publish-telegram-message.handler.js.map