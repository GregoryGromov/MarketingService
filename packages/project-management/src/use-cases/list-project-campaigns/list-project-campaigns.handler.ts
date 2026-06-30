import { Inject } from '@nestjs/common';
import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import { ApprovalItemRepository } from '../../domain/approval-item.repository.js';
import { CampaignPresetRepository } from '../../domain/campaign-preset.repository.js';
import { CampaignRepository } from '../../domain/campaign.repository.js';
import { PlannedPublicationRepository } from '../../domain/planned-publication.repository.js';
import { ProjectRepository } from '../../domain/project.repository.js';
import { ListProjectCampaignsQuery } from './list-project-campaigns.query.js';

const EMPTY_CAMPAIGN_PRESET_ID = '__empty__';

export interface ListProjectCampaignsResultItem {
  id: string;
  projectId: string;
  presetId: string;
  presetName: string | null;
  name: string;
  sourceArticleId: string | null;
  startDate: Date;
  sourceLanguage: string;
  publishingTarget: string;
  status: string;
  finalApprovedAt: Date | null;
  plannedPublicationCount: number;
  publicationStatusCounts: Record<string, number>;
  pendingApprovalCount: number;
  createdAt: Date;
  updatedAt: Date;
}

function countPublicationStatuses(
  plannedPublications: { status: string }[],
): Record<string, number> {
  return plannedPublications.reduce<Record<string, number>>((acc, publication) => {
    acc[publication.status] = (acc[publication.status] ?? 0) + 1;
    return acc;
  }, {});
}

@QueryHandler(ListProjectCampaignsQuery)
export class ListProjectCampaignsHandler
  implements
    IQueryHandler<
      ListProjectCampaignsQuery,
      ListProjectCampaignsResultItem[] | null
    >
{
  constructor(
    @Inject(ProjectRepository)
    private readonly projectRepository: ProjectRepository,
    @Inject(CampaignRepository)
    private readonly campaignRepository: CampaignRepository,
    @Inject(CampaignPresetRepository)
    private readonly campaignPresetRepository: CampaignPresetRepository,
    @Inject(PlannedPublicationRepository)
    private readonly plannedPublicationRepository: PlannedPublicationRepository,
    @Inject(ApprovalItemRepository)
    private readonly approvalItemRepository: ApprovalItemRepository,
  ) {}

  async execute(
    query: ListProjectCampaignsQuery,
  ): Promise<ListProjectCampaignsResultItem[] | null> {
    const project = await this.projectRepository.findById(query.projectId);
    if (!project) {
      return null;
    }

    const [campaigns, presets] = await Promise.all([
      this.campaignRepository.findByProjectId(project.id),
      this.campaignPresetRepository.findAll(),
    ]);
    const presetNames = new Map(presets.map((preset) => [preset.id, preset.name] as const));

    const items = await Promise.all(
      campaigns.map(async (campaign) => {
        const [plannedPublications, pendingApprovals] = await Promise.all([
          this.plannedPublicationRepository.findByCampaignId(campaign.id),
          this.approvalItemRepository.findByCampaignIdAndStatus(campaign.id, 'pending'),
        ]);

        return {
          id: campaign.id,
          projectId: campaign.projectId,
          presetId: campaign.presetId,
          presetName:
            presetNames.get(campaign.presetId) ??
            (String(campaign.presetId) === EMPTY_CAMPAIGN_PRESET_ID ? 'Empty preset' : null),
          name: campaign.name,
          sourceArticleId: campaign.sourceArticleId,
          startDate: campaign.startDate,
          sourceLanguage: campaign.sourceLanguage,
          publishingTarget: campaign.publishingTarget,
          status: campaign.status,
          finalApprovedAt: campaign.finalApprovedAt,
          plannedPublicationCount: plannedPublications.length,
          publicationStatusCounts: countPublicationStatuses(plannedPublications),
          pendingApprovalCount: pendingApprovals.length,
          createdAt: campaign.createdAt,
          updatedAt: campaign.updatedAt,
        } satisfies ListProjectCampaignsResultItem;
      }),
    );

    return items.sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime());
  }
}
