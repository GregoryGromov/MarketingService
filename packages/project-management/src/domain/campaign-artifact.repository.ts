import type { CampaignId } from './campaign.aggregate.js';
import type {
  CampaignArtifact,
  CampaignArtifactId,
} from './campaign-artifact.entity.js';
import type { PlannedPublicationId } from './planned-publication.entity.js';

export abstract class CampaignArtifactRepository {
  abstract findById(id: CampaignArtifactId): Promise<CampaignArtifact | null>;
  abstract findByCampaignId(campaignId: CampaignId): Promise<CampaignArtifact[]>;
  abstract findByCampaignIdAndRole(
    campaignId: CampaignId,
    role: string,
  ): Promise<CampaignArtifact[]>;
  abstract findByPlannedPublicationId(
    plannedPublicationId: PlannedPublicationId,
  ): Promise<CampaignArtifact[]>;
  abstract save(artifact: CampaignArtifact): Promise<void>;
}
