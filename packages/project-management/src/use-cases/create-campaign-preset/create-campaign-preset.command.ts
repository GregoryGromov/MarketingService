export interface CreateCampaignPresetPublicationInput {
  dayOffset: number;
  localTime: string;
  channel: string;
  language: string;
  publicationType: string;
  style: string;
  position: number;
}

export class CreateCampaignPresetCommand {
  constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly sourceLanguage: string,
    public readonly sourceType: string,
    public readonly publications: CreateCampaignPresetPublicationInput[],
    public readonly isActive = true,
  ) {}
}
