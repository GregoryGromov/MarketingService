import type { CampaignPresetId } from '../../domain/campaign-preset.aggregate.js';
import type { CreateCampaignPresetPublicationInput } from '../create-campaign-preset/create-campaign-preset.command.js';

export class UpdateCampaignPresetCommand {
  constructor(
    public readonly presetId: CampaignPresetId,
    public readonly name: string,
    public readonly description: string,
    public readonly sourceLanguage: string,
    public readonly sourceType: string,
    public readonly publications: CreateCampaignPresetPublicationInput[],
    public readonly isActive: boolean,
  ) {}
}
