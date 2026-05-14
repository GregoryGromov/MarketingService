import { Inject } from '@nestjs/common';
import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import { ApprovalItemRepository } from '../../domain/approval-item.repository.js';
import { CampaignRepository } from '../../domain/campaign.repository.js';
import type {
  ApprovalItemSeverity,
  ApprovalItemType,
} from '../../domain/approval-item.aggregate.js';
import { GetCampaignApprovalInboxQuery } from './get-campaign-approval-inbox.query.js';

const SEVERITY_RANK: Record<ApprovalItemSeverity, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

function compareInboxItems(
  left: { severity: ApprovalItemSeverity; updatedAt: Date; createdAt: Date },
  right: { severity: ApprovalItemSeverity; updatedAt: Date; createdAt: Date },
): number {
  if (SEVERITY_RANK[left.severity] !== SEVERITY_RANK[right.severity]) {
    return SEVERITY_RANK[right.severity] - SEVERITY_RANK[left.severity];
  }

  if (left.updatedAt.getTime() !== right.updatedAt.getTime()) {
    return right.updatedAt.getTime() - left.updatedAt.getTime();
  }

  return right.createdAt.getTime() - left.createdAt.getTime();
}

function isInboxExceptionType(type: ApprovalItemType): boolean {
  return type !== 'final_campaign_approval';
}

export interface CampaignApprovalInboxItemResult {
  id: string;
  plannedPublicationId: string | null;
  artifactType: string | null;
  artifactId: string | null;
  type: ApprovalItemType;
  severity: ApprovalItemSeverity;
  title: string;
  details: Record<string, unknown>;
  suggestedFix: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetCampaignApprovalInboxResult {
  campaignId: string;
  campaignStatus: string;
  pendingCount: number;
  items: CampaignApprovalInboxItemResult[];
}

@QueryHandler(GetCampaignApprovalInboxQuery)
export class GetCampaignApprovalInboxHandler
  implements
    IQueryHandler<
      GetCampaignApprovalInboxQuery,
      GetCampaignApprovalInboxResult | null
    >
{
  constructor(
    @Inject(CampaignRepository)
    private readonly campaignRepository: CampaignRepository,
    @Inject(ApprovalItemRepository)
    private readonly approvalItemRepository: ApprovalItemRepository,
  ) {}

  async execute(
    query: GetCampaignApprovalInboxQuery,
  ): Promise<GetCampaignApprovalInboxResult | null> {
    const campaign = await this.campaignRepository.findById(query.campaignId as never);
    if (!campaign) {
      return null;
    }

    const pendingItems = await this.approvalItemRepository.findByCampaignIdAndStatus(
      campaign.id,
      'pending',
    );

    const items = pendingItems
      .filter((item) => isInboxExceptionType(item.type))
      .sort(compareInboxItems)
      .map((item) => ({
        id: item.id,
        plannedPublicationId: item.plannedPublicationId,
        artifactType: item.artifactType,
        artifactId: item.artifactId,
        type: item.type,
        severity: item.severity,
        title: item.title,
        details: item.details,
        suggestedFix: item.suggestedFix,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));

    return {
      campaignId: campaign.id,
      campaignStatus: campaign.status,
      pendingCount: items.length,
      items,
    };
  }
}
