import type { CampaignId } from '../../domain/campaign.aggregate.js';

export class GetCampaignDetailQuery {
  constructor(public readonly campaignId: CampaignId) {}
}
