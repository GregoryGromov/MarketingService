export interface CreateCampaignPlannedPublicationOverride {
  presetPublicationId?: string | null;
  dayOffset: number;
  localTime: string;
  channel: string;
  language: string;
  publicationType: string;
  style: string;
}

export class CreateCampaignCommand {
  constructor(
    public readonly projectId: string,
    public readonly presetId: string,
    public readonly name: string,
    public readonly startDate: Date,
    public readonly sourceLanguage?: string,
    public readonly extraInstructions?: string | null,
    public readonly plannedPublicationOverrides?: CreateCampaignPlannedPublicationOverride[] | null,
    public readonly publishingTarget?: 'test' | 'production',
  ) {}
}
