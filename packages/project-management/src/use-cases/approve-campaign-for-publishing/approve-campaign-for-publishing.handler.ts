import { Inject } from '@nestjs/common';
import type {
  ChannelAdaptation,
  ChannelAdaptationRepository,
  Translation,
} from '@marketing-service/editorial';
import type { DomainEvent } from '@marketing-service/shared';
import { CommandHandler, EventBus, type ICommandHandler } from '@nestjs/cqrs';
import { CampaignArtifact } from '../../domain/campaign-artifact.entity.js';
import { CampaignArtifactRepository } from '../../domain/campaign-artifact.repository.js';
import type {
  PlannedPublication,
  PlannedPublicationStatus,
} from '../../domain/planned-publication.entity.js';
import { CampaignFlowTransactionPort } from '../../ports/campaign-flow-transaction.port.js';
import { ApproveCampaignForPublishingCommand } from './approve-campaign-for-publishing.command.js';

const STAGE_1_BASE_ADAPTATION_ROLE = 'stage_1_base_adaptation';
const SCHEDULED_PUBLICATION_ROLE = 'scheduled_publication';
const MANUAL_EXPORT_PLAN_ROLE = 'manual_export_plan';
const APPROVABLE_CAMPAIGN_STATUSES = new Set([
  'ready_for_final_approval',
  'approved_for_publishing',
  'publishing',
]);
const ELIGIBLE_PLANNED_PUBLICATION_STATUSES = new Set<PlannedPublicationStatus>([
  'ready',
  'publication_scheduled',
  'exported',
  'published',
]);

function translationRequired(
  targetLanguage: string,
  sourceLanguage: string,
): boolean {
  return targetLanguage !== sourceLanguage;
}

async function ensurePublicationArtifact(
  campaignArtifactRepository: CampaignArtifactRepository,
  params: {
    campaignId: string;
    plannedPublicationId: string;
    artifactId: string;
    role: string;
  },
): Promise<void> {
  const existingArtifacts = await campaignArtifactRepository.findByPlannedPublicationId(
    params.plannedPublicationId as never,
  );

  const existingArtifact = existingArtifacts.find(
    (artifact) =>
      artifact.artifactType === 'publication' && artifact.role === params.role,
  );

  if (existingArtifact) {
    if (existingArtifact.artifactId !== params.artifactId) {
      throw new Error(
        `Planned publication ${params.plannedPublicationId} is already linked to a different ${params.role} artifact`,
      );
    }

    return;
  }

  const artifact = CampaignArtifact.create({
    campaignId: params.campaignId as never,
    plannedPublicationId: params.plannedPublicationId as never,
    artifactType: 'publication',
    artifactId: params.artifactId,
    role: params.role,
  });

  await campaignArtifactRepository.save(artifact);
}

function ensureAdaptationApproved(adaptation: ChannelAdaptation): void {
  if (adaptation.status !== 'approved' || !adaptation.approvedVersionId) {
    throw new Error(`Adaptation ${adaptation.id} is not approved for publishing`);
  }

  if (!adaptation.adaptedContent) {
    throw new Error(`Adaptation ${adaptation.id} has no approved content`);
  }
}

function ensureTranslationApproved(translation: Translation): void {
  if (translation.status !== 'approved' || !translation.translatedContent) {
    throw new Error(`Translation ${translation.id} is not approved for publishing`);
  }
}

export interface ApproveCampaignForPublishingResult {
  campaignId: string;
  campaignStatus: string;
  scheduledPublicationIds: string[];
  exportPlanIds: string[];
}

@CommandHandler(ApproveCampaignForPublishingCommand)
export class ApproveCampaignForPublishingHandler
  implements
    ICommandHandler<
      ApproveCampaignForPublishingCommand,
      ApproveCampaignForPublishingResult
    >
{
  constructor(
    @Inject(CampaignFlowTransactionPort)
    private readonly transaction: CampaignFlowTransactionPort,
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    command: ApproveCampaignForPublishingCommand,
  ): Promise<ApproveCampaignForPublishingResult> {
    let campaignStatus!: string;
    const scheduledPublicationIds: string[] = [];
    const exportPlanIds: string[] = [];
    const campaignEvents: DomainEvent[] = [];

    await this.transaction.run(
      async ({
        approvalItemRepository,
        articleRepository,
        campaignArtifactRepository,
        campaignRepository,
        campaignPublishingPort,
        channelAdaptationRepository,
        plannedPublicationRepository,
        translationRepository,
        workflowRunRepository,
      }) => {
        const campaign = await campaignRepository.findById(command.campaignId as never);
        if (!campaign) {
          throw new Error(`Campaign ${command.campaignId} not found`);
        }

        if (!APPROVABLE_CAMPAIGN_STATUSES.has(campaign.status)) {
          throw new Error(
            `Campaign ${campaign.id} cannot be approved for publishing from status "${campaign.status}"`,
          );
        }

        const activeRun = await workflowRunRepository.findActiveByCampaignId(campaign.id);
        if (activeRun) {
          throw new Error(`Campaign ${campaign.id} has an active workflow run`);
        }

        if (!campaign.sourceArticleId) {
          throw new Error(`Campaign ${campaign.id} has no attached source article`);
        }

        const article = await articleRepository.findById(campaign.sourceArticleId as never);
        if (!article) {
          throw new Error(`Article ${campaign.sourceArticleId} not found`);
        }

        const pendingApprovalItems = (
          await approvalItemRepository.findByCampaignIdAndStatus(campaign.id, 'pending')
        ).filter((item) => item.type !== 'final_campaign_approval');

        if (pendingApprovalItems.length > 0) {
          throw new Error(
            `Campaign ${campaign.id} still has ${pendingApprovalItems.length} pending approval inbox items`,
          );
        }

        const plannedPublications = (
          await plannedPublicationRepository.findByCampaignId(campaign.id)
        ).sort(
          (left, right) => left.scheduledFor.getTime() - right.scheduledFor.getTime(),
        );

        if (plannedPublications.length === 0) {
          throw new Error(`Campaign ${campaign.id} has no planned publications`);
        }

        const ineligiblePublication = plannedPublications.find(
          (plannedPublication) =>
            !ELIGIBLE_PLANNED_PUBLICATION_STATUSES.has(plannedPublication.status),
        );
        if (ineligiblePublication) {
          throw new Error(
            `Planned publication ${ineligiblePublication.id} is not ready for final approval from status "${ineligiblePublication.status}"`,
          );
        }

        let hasAutoPublishOutput = false;

        for (const plannedPublication of plannedPublications) {
          if (plannedPublication.status !== 'ready') {
            if (
              plannedPublication.status === 'publication_scheduled' ||
              plannedPublication.status === 'published'
            ) {
              hasAutoPublishOutput = true;
            }

            continue;
          }

          const adaptation = await this.resolveApprovedAdaptation(
            campaignArtifactRepository,
            channelAdaptationRepository,
            plannedPublication,
          );

          if (translationRequired(plannedPublication.language, adaptation.sourceLanguage)) {
            const translation = await translationRepository.findByAdaptationIdAndTargetLanguage(
              adaptation.id,
              plannedPublication.language,
            );

            if (!translation) {
              throw new Error(
                `Planned publication ${plannedPublication.id} is missing translation ${plannedPublication.language}`,
              );
            }

            ensureTranslationApproved(translation);
          }

          if (plannedPublication.publishMode === 'manual_export') {
            const exportPlan = await campaignPublishingPort.upsertExportPlan({
              articleId: article.id,
              projectId: article.projectId,
              plannedPublicationId: plannedPublication.id,
              channelId: adaptation.channelId,
              targetLanguage: plannedPublication.language,
              publishAt: plannedPublication.scheduledFor,
            });

            plannedPublication.markExported();
            exportPlanIds.push(exportPlan.id);

            await ensurePublicationArtifact(campaignArtifactRepository, {
              campaignId: campaign.id,
              plannedPublicationId: plannedPublication.id,
              artifactId: exportPlan.id,
              role: MANUAL_EXPORT_PLAN_ROLE,
            });

            continue;
          }

          const scheduledPublication =
            await campaignPublishingPort.upsertScheduledPublication({
              articleId: article.id,
              adaptationId: adaptation.id,
              plannedPublicationId: plannedPublication.id,
              channelId: adaptation.channelId,
              displayName: adaptation.displayName,
              targetLanguage: plannedPublication.language,
              publishAt: plannedPublication.scheduledFor,
            });

          plannedPublication.markPublicationScheduled();
          scheduledPublicationIds.push(scheduledPublication.id);
          hasAutoPublishOutput = true;

          await ensurePublicationArtifact(campaignArtifactRepository, {
            campaignId: campaign.id,
            plannedPublicationId: plannedPublication.id,
            artifactId: scheduledPublication.id,
            role: SCHEDULED_PUBLICATION_ROLE,
          });
        }

        if (campaign.status === 'ready_for_final_approval') {
          campaign.approveForPublishing();
        }

        if (hasAutoPublishOutput) {
          campaign.markPublishing();
        }

        await plannedPublicationRepository.saveMany(plannedPublications);
        await campaignRepository.save(campaign);
        campaignStatus = campaign.status;
        campaignEvents.push(...campaign.pullEvents());
      },
    );

    this.eventBus.publishAll(campaignEvents);

    return {
      campaignId: command.campaignId,
      campaignStatus,
      scheduledPublicationIds,
      exportPlanIds,
    };
  }

  private async resolveApprovedAdaptation(
    campaignArtifactRepository: CampaignArtifactRepository,
    channelAdaptationRepository: ChannelAdaptationRepository,
    plannedPublication: PlannedPublication,
  ): Promise<ChannelAdaptation> {
    const artifacts = await campaignArtifactRepository.findByPlannedPublicationId(
      plannedPublication.id,
    );
    const adaptationArtifact = artifacts.find(
      (artifact) =>
        artifact.artifactType === 'adaptation' &&
        artifact.role === STAGE_1_BASE_ADAPTATION_ROLE,
    );

    if (!adaptationArtifact) {
      throw new Error(
        `Planned publication ${plannedPublication.id} has no approved Stage 1 adaptation artifact`,
      );
    }

    const adaptation = await channelAdaptationRepository.findById(
      adaptationArtifact.artifactId as never,
    );
    if (!adaptation) {
      throw new Error(
        `Adaptation ${adaptationArtifact.artifactId} for planned publication ${plannedPublication.id} not found`,
      );
    }

    ensureAdaptationApproved(adaptation);
    return adaptation;
  }
}
