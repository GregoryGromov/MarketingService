export class AttachCampaignSourceCommand {
  constructor(
    public readonly campaignId: string,
    public readonly content: string,
    public readonly language: string,
  ) {}
}
