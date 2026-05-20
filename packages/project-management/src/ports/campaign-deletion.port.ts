import type { CampaignId } from '../domain/campaign.aggregate.js';

export abstract class CampaignDeletionPort {
  abstract deleteCampaignGraph(campaignId: CampaignId): Promise<void>;
}
