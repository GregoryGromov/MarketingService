import { Inject } from '@nestjs/common';
import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import {
  ChannelAdaptationRepository,
  TranslationRepository,
} from '@marketing-service/editorial';
import { ApprovalItemRepository } from '../../domain/approval-item.repository.js';
import { CampaignRepository } from '../../domain/campaign.repository.js';
import { ProjectRepository } from '../../domain/project.repository.js';
import type {
  ApprovalItem,
  ApprovalItemSeverity,
  ApprovalItemType,
} from '../../domain/approval-item.aggregate.js';
import { GetProjectApprovalInboxQuery } from './get-project-approval-inbox.query.js';

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

export interface ProjectApprovalInboxItemResult {
  id: string;
  campaignId: string;
  campaignName: string;
  campaignStatus: string;
  sourceArticleId: string | null;
  plannedPublicationId: string | null;
  artifactType: string | null;
  artifactId: string | null;
  type: ApprovalItemType;
  status: string;
  severity: ApprovalItemSeverity;
  title: string;
  details: Record<string, unknown>;
  suggestedFix: Record<string, unknown> | null;
  currentContent: string | null;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
}

export interface GetProjectApprovalInboxResult {
  projectId: string;
  pendingCount: number;
  items: ProjectApprovalInboxItemResult[];
  historyItems: ProjectApprovalInboxItemResult[];
}

@QueryHandler(GetProjectApprovalInboxQuery)
export class GetProjectApprovalInboxHandler
  implements
    IQueryHandler<
      GetProjectApprovalInboxQuery,
      GetProjectApprovalInboxResult | null
    >
{
  constructor(
    @Inject(ProjectRepository)
    private readonly projectRepository: ProjectRepository,
    @Inject(CampaignRepository)
    private readonly campaignRepository: CampaignRepository,
    @Inject(ApprovalItemRepository)
    private readonly approvalItemRepository: ApprovalItemRepository,
    @Inject(ChannelAdaptationRepository)
    private readonly channelAdaptationRepository: ChannelAdaptationRepository,
    @Inject(TranslationRepository)
    private readonly translationRepository: TranslationRepository,
  ) {}

  private async getCurrentContent(item: {
    type: ApprovalItemType;
    artifactId: string | null;
  }): Promise<string | null> {
    if (!item.artifactId) {
      return null;
    }

    if (item.type === 'adaptation_quality_exception') {
      const adaptation = await this.channelAdaptationRepository.findById(item.artifactId as never);
      return adaptation?.adaptedContent ?? null;
    }

    if (item.type === 'translation_fidelity_exception') {
      const translation = await this.translationRepository.findById(item.artifactId as never);
      return translation?.translatedContent ?? null;
    }

    return null;
  }

  async execute(
    query: GetProjectApprovalInboxQuery,
  ): Promise<GetProjectApprovalInboxResult | null> {
    const project = await this.projectRepository.findById(query.projectId);
    if (!project) {
      return null;
    }

    const [campaigns, allProjectItems] = await Promise.all([
      this.campaignRepository.findByProjectId(project.id),
      this.approvalItemRepository.findByProjectId(project.id),
    ]);

    const campaignsById = new Map(campaigns.map((campaign) => [campaign.id, campaign] as const));
    const inboxItems = allProjectItems.filter(
      (item) => isInboxExceptionType(item.type) && campaignsById.has(item.campaignId),
    );
    const sortedItems = inboxItems
      .filter((item) => item.status === 'pending')
      .sort(compareInboxItems);

    const historyItems = [...inboxItems].sort(
      (left, right) =>
        right.updatedAt.getTime() - left.updatedAt.getTime() ||
        right.createdAt.getTime() - left.createdAt.getTime(),
    );

    const mapItem = async (
      item: ApprovalItem,
    ): Promise<ProjectApprovalInboxItemResult> => {
      const campaign = campaignsById.get(item.campaignId)!;
      return {
        id: item.id,
        campaignId: campaign.id,
        campaignName: campaign.name,
        campaignStatus: campaign.status,
        sourceArticleId: campaign.sourceArticleId,
        plannedPublicationId: item.plannedPublicationId,
        artifactType: item.artifactType,
        artifactId: item.artifactId,
        type: item.type,
        status: item.status,
        severity: item.severity,
        title: item.title,
        details: item.details,
        suggestedFix: item.suggestedFix,
        currentContent: await this.getCurrentContent(item),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        resolvedAt: item.resolvedAt,
      } satisfies ProjectApprovalInboxItemResult;
    };

    const [items, mappedHistoryItems] = await Promise.all([
      Promise.all(sortedItems.map(mapItem)),
      Promise.all(historyItems.map(mapItem)),
    ]);

    return {
      projectId: project.id,
      pendingCount: items.length,
      items,
      historyItems: mappedHistoryItems,
    };
  }
}
