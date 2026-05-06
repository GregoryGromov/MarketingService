import { CommandHandler, EventBus, type ICommandHandler } from '@nestjs/cqrs';
import { ChannelAdaptationRepository } from '../../domain/channel-adaptation.repository.js';
import { TranslationRepository } from '../../domain/translation.repository.js';
import { TranslationGeneratorPort } from '../../ports/translation-generator.port.js';
import { GenerateTranslationCommand } from './generate-translation.command.js';

@CommandHandler(GenerateTranslationCommand)
export class GenerateTranslationHandler
  implements ICommandHandler<GenerateTranslationCommand, string>
{
  constructor(
    private readonly channelAdaptationRepository: ChannelAdaptationRepository,
    private readonly translationRepository: TranslationRepository,
    private readonly translationGenerator: TranslationGeneratorPort,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: GenerateTranslationCommand): Promise<string> {
    const adaptation = await this.channelAdaptationRepository.findById(command.adaptationId);

    if (!adaptation || adaptation.articleId !== command.articleId) {
      throw new Error(`Adaptation ${command.adaptationId} not found in article ${command.articleId}`);
    }

    const translation = await this.translationRepository.findById(command.translationId);

    if (!translation || translation.adaptationId !== command.adaptationId) {
      throw new Error(
        `Translation ${command.translationId} not found for adaptation ${command.adaptationId}`,
      );
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
}
