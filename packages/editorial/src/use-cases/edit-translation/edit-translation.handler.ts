import { CommandHandler, EventBus, type ICommandHandler } from '@nestjs/cqrs';
import { TranslationRepository } from '../../domain/translation.repository.js';
import { EditTranslationCommand } from './edit-translation.command.js';

@CommandHandler(EditTranslationCommand)
export class EditTranslationHandler
  implements ICommandHandler<EditTranslationCommand, void>
{
  constructor(
    private readonly translationRepository: TranslationRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: EditTranslationCommand): Promise<void> {
    const translation = await this.translationRepository.findById(command.translationId);

    if (!translation || translation.adaptationId !== command.adaptationId) {
      throw new Error(
        `Translation ${command.translationId} not found for adaptation ${command.adaptationId}`,
      );
    }

    translation.edit(command.translatedContent);
    await this.translationRepository.save(translation);
    this.eventBus.publishAll(translation.pullEvents());
  }
}
