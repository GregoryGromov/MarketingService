import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ChannelAdaptationRepository } from '../../domain/channel-adaptation.repository.js';
import { TranslationRepository } from '../../domain/translation.repository.js';
import {
  TelegramPublisherPort,
  type PublishTelegramMessageResult,
} from '../../ports/telegram-publisher.port.js';
import { PublishTelegramMessageCommand } from './publish-telegram-message.command.js';

@CommandHandler(PublishTelegramMessageCommand)
export class PublishTelegramMessageHandler
  implements ICommandHandler<PublishTelegramMessageCommand, PublishTelegramMessageResult>
{
  constructor(
    private readonly channelAdaptationRepository: ChannelAdaptationRepository,
    private readonly translationRepository: TranslationRepository,
    private readonly telegramPublisher: TelegramPublisherPort,
  ) {}

  async execute(
    command: PublishTelegramMessageCommand,
  ): Promise<PublishTelegramMessageResult> {
    const adaptation = await this.channelAdaptationRepository.findById(command.adaptationId);

    if (!adaptation || adaptation.articleId !== command.articleId) {
      throw new Error(`Adaptation ${command.adaptationId} not found in article ${command.articleId}`);
    }

    if (adaptation.channelId !== 'channel_telegram') {
      throw new Error(
        `Adaptation ${adaptation.id} belongs to ${adaptation.channelId} and cannot be published to Telegram`,
      );
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

    const translation = await this.translationRepository.findByAdaptationIdAndTargetLanguage(
      adaptation.id,
      targetLanguage,
    );

    if (!translation) {
      throw new Error(`Translation ${targetLanguage} not found for adaptation ${adaptation.id}`);
    }

    if (translation.status !== 'approved' || !translation.translatedContent) {
      throw new Error(
        `Translation ${translation.id} (${targetLanguage}) is not approved for Telegram publishing`,
      );
    }

    return this.telegramPublisher.publishMessage({
      language: targetLanguage,
      text: translation.translatedContent,
    });
  }
}
