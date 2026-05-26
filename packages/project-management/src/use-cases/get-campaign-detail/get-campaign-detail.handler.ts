import { Inject } from '@nestjs/common';
import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import { ApprovalItemRepository } from '../../domain/approval-item.repository.js';
import { CampaignPresetRepository } from '../../domain/campaign-preset.repository.js';
import { CampaignRepository } from '../../domain/campaign.repository.js';
import { PlannedPublicationRepository } from '../../domain/planned-publication.repository.js';
import { WorkflowRunRepository } from '../../domain/workflow-run.repository.js';
import { GetCampaignDetailQuery } from './get-campaign-detail.query.js';

const EMPTY_CAMPAIGN_PRESET_ID = '__empty__';

export interface CampaignDetailPlannedPublicationResultItem {
  id: string;
  presetPublicationId: string | null;
  dayOffset: number;
  localTime: string;
  scheduledFor: Date;
  channel: string;
  language: string;
  publicationType: string;
  style: string;
  publishMode: string | null;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignDetailWorkflowRunResultItem {
  id: string;
  status: string;
  currentStep: string;
  errorMessage: string | null;
  startedAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetCampaignDetailResult {
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
  extraInstructions: string | null;
  finalApprovedAt: Date | null;
  pendingApprovalCount: number;
  createdAt: Date;
  updatedAt: Date;
  plannedPublications: CampaignDetailPlannedPublicationResultItem[];
  workflowRuns: CampaignDetailWorkflowRunResultItem[];
}

@QueryHandler(GetCampaignDetailQuery)
export class GetCampaignDetailHandler
  implements IQueryHandler<GetCampaignDetailQuery, GetCampaignDetailResult | null>
{
  constructor(
    @Inject(CampaignRepository)
    private readonly campaignRepository: CampaignRepository,
    @Inject(CampaignPresetRepository)
    private readonly campaignPresetRepository: CampaignPresetRepository,
    @Inject(PlannedPublicationRepository)
    private readonly plannedPublicationRepository: PlannedPublicationRepository,
    @Inject(WorkflowRunRepository)
    private readonly workflowRunRepository: WorkflowRunRepository,
    @Inject(ApprovalItemRepository)
    private readonly approvalItemRepository: ApprovalItemRepository,
  ) {}

  async execute(
    query: GetCampaignDetailQuery,
  ): Promise<GetCampaignDetailResult | null> {
    const campaign = await this.campaignRepository.findById(query.campaignId);
    if (!campaign) {
      return null;
    }

    const [preset, plannedPublications, workflowRuns, pendingApprovals] = await Promise.all([
      this.campaignPresetRepository.findById(campaign.presetId),
      this.plannedPublicationRepository.findByCampaignId(campaign.id),
      this.workflowRunRepository.findByCampaignId(campaign.id),
      this.approvalItemRepository.findByCampaignIdAndStatus(campaign.id, 'pending'),
    ]);

    return {
      id: campaign.id,
      projectId: campaign.projectId,
      presetId: campaign.presetId,
      presetName:
        preset?.name ??
        (String(campaign.presetId) === EMPTY_CAMPAIGN_PRESET_ID ? 'Empty preset' : null),
      name: campaign.name,
      sourceArticleId: campaign.sourceArticleId,
      startDate: campaign.startDate,
      sourceLanguage: campaign.sourceLanguage,
      publishingTarget: campaign.publishingTarget,
      status: campaign.status,
      extraInstructions: campaign.extraInstructions,
      finalApprovedAt: campaign.finalApprovedAt,
      pendingApprovalCount: pendingApprovals.length,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
      plannedPublications: [...plannedPublications]
        .sort((left, right) => left.scheduledFor.getTime() - right.scheduledFor.getTime())
        .map((plannedPublication) => ({
          id: plannedPublication.id,
          presetPublicationId: plannedPublication.presetPublicationId,
          dayOffset: plannedPublication.dayOffset,
          localTime: plannedPublication.localTime,
          scheduledFor: plannedPublication.scheduledFor,
          channel: plannedPublication.channel,
          language: plannedPublication.language,
          publicationType: plannedPublication.publicationType,
          style: plannedPublication.style,
          publishMode: plannedPublication.publishMode,
          status: plannedPublication.status,
          notes: plannedPublication.notes,
          createdAt: plannedPublication.createdAt,
          updatedAt: plannedPublication.updatedAt,
        })),
      workflowRuns: [...workflowRuns]
        .sort((left, right) => right.startedAt.getTime() - left.startedAt.getTime())
        .map((workflowRun) => ({
          id: workflowRun.id,
          status: workflowRun.status,
          currentStep: workflowRun.currentStep,
          errorMessage: workflowRun.errorMessage,
          startedAt: workflowRun.startedAt,
          completedAt: workflowRun.completedAt,
          createdAt: workflowRun.createdAt,
          updatedAt: workflowRun.updatedAt,
        })),
    };
  }
}
