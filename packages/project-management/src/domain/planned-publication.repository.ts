import type { CampaignId } from './campaign.aggregate.js';
import type {
  PlannedPublication,
  PlannedPublicationId,
  PlannedPublicationStatus,
} from './planned-publication.entity.js';

export abstract class PlannedPublicationRepository {
  abstract findById(id: PlannedPublicationId): Promise<PlannedPublication | null>;
  abstract findByCampaignId(campaignId: CampaignId): Promise<PlannedPublication[]>;
  abstract findByCampaignIdAndStatus(
    campaignId: CampaignId,
    status: PlannedPublicationStatus,
  ): Promise<PlannedPublication[]>;
  abstract save(plannedPublication: PlannedPublication): Promise<void>;
  abstract saveMany(plannedPublications: PlannedPublication[]): Promise<void>;
}
