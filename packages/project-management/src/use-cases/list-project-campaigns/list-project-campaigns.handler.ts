import { Inject } from '@nestjs/common';
import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import { ApprovalItemRepository } from '../../domain/approval-item.repository.js';
import { CampaignPresetRepository } from '../../domain/campaign-preset.repository.js';
import { CampaignRepository } from '../../domain/campaign.repository.js';
import { PlannedPublicationRepository } from '../../domain/planned-publication.repository.js';
import { ProjectRepository } from '../../domain/project.repository.js';
import { ListProjectCampaignsQuery } from './list-project-campaigns.query.js';

export interface ListProjectCampaignsResultItem {
  id: string;
  projectId: string;
  presetId: string;
  presetName: string | null;
  name: string;
  sourceArticleId: string | null;
  startDate: Date;
  sourceLanguage: string;
  status: string;
  finalApprovedAt: Date | null;
  plannedPublicationCount: number;
  pendingApprovalCount: number;
  createdAt: Date;
  updatedAt: Date;
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
          presetName: presetNames.get(campaign.presetId) ?? null,
          name: campaign.name,
          sourceArticleId: campaign.sourceArticleId,
          startDate: campaign.startDate,
          sourceLanguage: campaign.sourceLanguage,
          status: campaign.status,
          finalApprovedAt: campaign.finalApprovedAt,
          plannedPublicationCount: plannedPublications.length,
          pendingApprovalCount: pendingApprovals.length,
          createdAt: campaign.createdAt,
          updatedAt: campaign.updatedAt,
        } satisfies ListProjectCampaignsResultItem;
      }),
    );

    return items.sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime());
  }
}
