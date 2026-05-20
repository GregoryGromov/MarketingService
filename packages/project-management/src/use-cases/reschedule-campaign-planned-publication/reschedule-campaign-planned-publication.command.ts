import type { CampaignId } from '../../domain/campaign.aggregate.js';
import type { PlannedPublicationId } from '../../domain/planned-publication.entity.js';

export class RescheduleCampaignPlannedPublicationCommand {
  constructor(
    public readonly campaignId: CampaignId,
    public readonly plannedPublicationId: PlannedPublicationId,
    public readonly publishAt: Date,
  ) {}
}
