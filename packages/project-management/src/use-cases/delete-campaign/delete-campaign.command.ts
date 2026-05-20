import type { CampaignId } from '../../domain/campaign.aggregate.js';

export class DeleteCampaignCommand {
  constructor(public readonly campaignId: CampaignId) {}
}
