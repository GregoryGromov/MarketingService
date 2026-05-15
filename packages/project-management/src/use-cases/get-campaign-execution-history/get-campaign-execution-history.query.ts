import type { CampaignId } from '../../domain/campaign.aggregate.js';

export class GetCampaignExecutionHistoryQuery {
  constructor(public readonly campaignId: CampaignId) {}
}
