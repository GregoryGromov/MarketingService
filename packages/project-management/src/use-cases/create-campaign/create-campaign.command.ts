export class CreateCampaignCommand {
  constructor(
    public readonly projectId: string,
    public readonly presetId: string,
    public readonly name: string,
    public readonly startDate: Date,
    public readonly sourceLanguage?: string,
    public readonly extraInstructions?: string | null,
  ) {}
}
