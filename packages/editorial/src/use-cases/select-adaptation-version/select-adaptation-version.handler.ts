import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ChannelAdaptationRepository } from '../../domain/channel-adaptation.repository.js';
import { AdaptationVersionRepository } from '../../domain/adaptation-version.repository.js';
import { SelectAdaptationVersionCommand } from './select-adaptation-version.command.js';

@CommandHandler(SelectAdaptationVersionCommand)
export class SelectAdaptationVersionHandler
  implements ICommandHandler<SelectAdaptationVersionCommand, void>
{
  constructor(
    private readonly channelAdaptationRepository: ChannelAdaptationRepository,
    private readonly adaptationVersionRepository: AdaptationVersionRepository,
  ) {}

  async execute(command: SelectAdaptationVersionCommand): Promise<void> {
    const adaptation = await this.channelAdaptationRepository.findById(command.adaptationId);

    if (!adaptation || adaptation.articleId !== command.articleId) {
      throw new Error(`Adaptation ${command.adaptationId} not found in article ${command.articleId}`);
    }

    const version = await this.adaptationVersionRepository.findById(command.versionId);

    if (!version || version.adaptationId !== adaptation.id) {
      throw new Error(`Version ${command.versionId} not found in adaptation ${command.adaptationId}`);
    }

    adaptation.selectVersion(version.id, version.content);
    await this.channelAdaptationRepository.save(adaptation);
  }
}
