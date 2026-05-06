import { CommandHandler, EventBus, type ICommandHandler } from '@nestjs/cqrs';
import { AdaptationVersion } from '../../domain/adaptation-version.entity.js';
import { AdaptationVersionRepository } from '../../domain/adaptation-version.repository.js';
import { ChannelAdaptationRepository } from '../../domain/channel-adaptation.repository.js';
import { EditAdaptationCommand } from './edit-adaptation.command.js';

@CommandHandler(EditAdaptationCommand)
export class EditAdaptationHandler implements ICommandHandler<EditAdaptationCommand, void> {
  constructor(
    private readonly channelAdaptationRepository: ChannelAdaptationRepository,
    private readonly adaptationVersionRepository: AdaptationVersionRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: EditAdaptationCommand): Promise<void> {
    const adaptation = await this.channelAdaptationRepository.findById(command.adaptationId);

    if (!adaptation || adaptation.articleId !== command.articleId) {
      throw new Error(`Adaptation ${command.adaptationId} not found in article ${command.articleId}`);
    }

    const version = AdaptationVersion.create({
      adaptationId: adaptation.id,
      content: command.adaptedContent,
      kind: 'manual_edit',
      sourceVersionId: adaptation.selectedVersionId,
    });

    await this.adaptationVersionRepository.save(version);
    adaptation.edit(version.id, command.adaptedContent);

    await this.channelAdaptationRepository.save(adaptation);
    this.eventBus.publishAll(adaptation.pullEvents());
  }
}
