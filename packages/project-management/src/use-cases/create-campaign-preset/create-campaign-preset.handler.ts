import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import {
  CampaignPreset,
  CampaignPresetPublication,
  CampaignPresetRepository,
} from '../../index.js';
import { CreateCampaignPresetCommand } from './create-campaign-preset.command.js';

@CommandHandler(CreateCampaignPresetCommand)
export class CreateCampaignPresetHandler
  implements ICommandHandler<CreateCampaignPresetCommand, { id: string }>
{
  constructor(
    @Inject(CampaignPresetRepository)
    private readonly campaignPresetRepository: CampaignPresetRepository,
  ) {}

  async execute(command: CreateCampaignPresetCommand): Promise<{ id: string }> {
    const preset = CampaignPreset.create({
      name: command.name,
      description: command.description,
      sourceLanguage: command.sourceLanguage,
      sourceType: command.sourceType,
      isActive: command.isActive,
      isSystem: false,
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
