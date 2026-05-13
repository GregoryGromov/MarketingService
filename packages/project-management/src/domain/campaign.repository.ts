import type { Campaign, CampaignId } from './campaign.aggregate.js';
import type { ProjectId } from './project.aggregate.js';

export abstract class CampaignRepository {
  abstract findById(id: CampaignId): Promise<Campaign | null>;
  abstract findByProjectId(projectId: ProjectId): Promise<Campaign[]>;
  abstract save(campaign: Campaign): Promise<void>;
}
