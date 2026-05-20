import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApprovalItemRepository } from '../../domain/approval-item.repository.js';
import { CampaignRepository } from '../../domain/campaign.repository.js';
import { PlannedPublicationRepository } from '../../domain/planned-publication.repository.js';
import { CampaignDeletionPort } from '../../ports/campaign-deletion.port.js';
import { DeleteCampaignCommand } from './delete-campaign.command.js';

const DELETABLE_CAMPAIGN_STATUSES = new Set([
  'draft',
  'source_checking',
  'source_needs_review',
  'producing',
  'needs_attention',
  'ready_for_final_approval',
  'failed',
  'cancelled',
]);

@CommandHandler(DeleteCampaignCommand)
export class DeleteCampaignHandler implements ICommandHandler<DeleteCampaignCommand, void> {
  constructor(
    @Inject(CampaignRepository)
    private readonly campaignRepository: CampaignRepository,
    @Inject(PlannedPublicationRepository)
    private readonly plannedPublicationRepository: PlannedPublicationRepository,
    @Inject(ApprovalItemRepository)
    private readonly approvalItemRepository: ApprovalItemRepository,
    @Inject(CampaignDeletionPort)
    private readonly campaignDeletionPort: CampaignDeletionPort,
  ) {}

  async execute(command: DeleteCampaignCommand): Promise<void> {
    const campaign = await this.campaignRepository.findById(command.campaignId);
    if (!campaign) {
      throw new Error(`Campaign ${command.campaignId} not found`);
    }

    const [plannedPublications, pendingApprovals] = await Promise.all([
      this.plannedPublicationRepository.findByCampaignId(campaign.id),
      this.approvalItemRepository.findByCampaignIdAndStatus(campaign.id, 'pending'),
    ]);

    if (
      !DELETABLE_CAMPAIGN_STATUSES.has(campaign.status) &&
      pendingApprovals.length === 0 &&
      plannedPublications.length > 0
    ) {
      throw new Error(`Campaign ${command.campaignId} is not draft and cannot be deleted`);
    }

    await this.campaignDeletionPort.deleteCampaignGraph(command.campaignId);
  }
}
