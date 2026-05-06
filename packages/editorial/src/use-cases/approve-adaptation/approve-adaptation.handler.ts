import { CommandHandler, EventBus, type ICommandHandler } from '@nestjs/cqrs';
import { AdaptationVersionRepository } from '../../domain/adaptation-version.repository.js';
import { ChannelAdaptationRepository } from '../../domain/channel-adaptation.repository.js';
import { ApproveAdaptationCommand } from './approve-adaptation.command.js';

@CommandHandler(ApproveAdaptationCommand)
export class ApproveAdaptationHandler
  implements ICommandHandler<ApproveAdaptationCommand, void>
{
  constructor(
    private readonly channelAdaptationRepository: ChannelAdaptationRepository,
    private readonly adaptationVersionRepository: AdaptationVersionRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ApproveAdaptationCommand): Promise<void> {
    const adaptation = await this.channelAdaptationRepository.findById(command.adaptationId);

    if (!adaptation || adaptation.articleId !== command.articleId) {
      throw new Error(`Adaptation ${command.adaptationId} not found in article ${command.articleId}`);
    }

    adaptation.approve();

    await this.channelAdaptationRepository.save(adaptation);
    await this.adaptationVersionRepository.deleteByAdaptationIdExcept(
      adaptation.id,
      adaptation.approvedVersionId ? [adaptation.approvedVersionId] : [],
    );
    this.eventBus.publishAll(adaptation.pullEvents());
  }
}
