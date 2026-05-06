import { CommandHandler, EventBus, type ICommandHandler } from '@nestjs/cqrs';
import { TranslationRepository } from '../../domain/translation.repository.js';
import { ApproveTranslationCommand } from './approve-translation.command.js';

@CommandHandler(ApproveTranslationCommand)
export class ApproveTranslationHandler
  implements ICommandHandler<ApproveTranslationCommand, void>
{
  constructor(
    private readonly translationRepository: TranslationRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ApproveTranslationCommand): Promise<void> {
    const translation = await this.translationRepository.findById(command.translationId);

    if (!translation || translation.adaptationId !== command.adaptationId) {
      throw new Error(
        `Translation ${command.translationId} not found for adaptation ${command.adaptationId}`,
      );
    }

    translation.approve();
    await this.translationRepository.save(translation);
    this.eventBus.publishAll(translation.pullEvents());
  }
}
