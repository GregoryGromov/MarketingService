import { CommandHandler, EventBus, type ICommandHandler } from '@nestjs/cqrs';
import { ChannelAdaptationRepository } from '../../domain/channel-adaptation.repository.js';
import { Translation, type TranslationId } from '../../domain/translation.aggregate.js';
import { TranslationRepository } from '../../domain/translation.repository.js';
import { AddTranslationCommand } from './add-translation.command.js';

@CommandHandler(AddTranslationCommand)
export class AddTranslationHandler
  implements ICommandHandler<AddTranslationCommand, TranslationId>
{
  constructor(
    private readonly channelAdaptationRepository: ChannelAdaptationRepository,
    private readonly translationRepository: TranslationRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: AddTranslationCommand): Promise<TranslationId> {
    const adaptation = await this.channelAdaptationRepository.findById(command.adaptationId);

    if (!adaptation || adaptation.articleId !== command.articleId) {
      throw new Error(`Adaptation ${command.adaptationId} not found in article ${command.articleId}`);
    }

    const existingTranslation = await this.translationRepository.findByAdaptationIdAndTargetLanguage(
      command.adaptationId,
      command.targetLanguage,
    );

    if (existingTranslation) {
      throw new Error(
        `Adaptation ${command.adaptationId} already has translation for ${command.targetLanguage}`,
      );
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
}
