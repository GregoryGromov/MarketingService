import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import {
  CampaignPresetPublication,
  CampaignPresetRepository,
  type CampaignPresetId,
} from '../../index.js';
import { UpdateCampaignPresetCommand } from './update-campaign-preset.command.js';

@CommandHandler(UpdateCampaignPresetCommand)
export class UpdateCampaignPresetHandler
  implements ICommandHandler<UpdateCampaignPresetCommand, { id: string }>
{
  constructor(
    @Inject(CampaignPresetRepository)
    private readonly campaignPresetRepository: CampaignPresetRepository,
  ) {}

  async execute(command: UpdateCampaignPresetCommand): Promise<{ id: string }> {
    const preset = await this.campaignPresetRepository.findById(command.presetId as CampaignPresetId);

    if (!preset) {
      throw new Error(`Campaign preset ${command.presetId} not found`);
    }

    preset.update({
      name: command.name,
      description: command.description,
      sourceLanguage: command.sourceLanguage,
      sourceType: command.sourceType,
      isActive: command.isActive,
    });

    const publications = command.publications.map((publication) =>
      CampaignPresetPublication.create({
        presetId: preset.id,
        dayOffset: publication.dayOffset,
        localTime: publication.localTime,
        channel: publication.channel,
        language: publication.language,
        publicationType: publication.publicationType,
        style: publication.style,
        position: publication.position,
      }),
    );

    preset.replacePublications(publications);
    await this.campaignPresetRepository.save(preset);
    return { id: preset.id };
  }
}
