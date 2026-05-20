import {
  AdaptationVersion,
  type AdaptationVersionId,
  TranslationVersion,
} from '@marketing-service/editorial';
import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, type ICommandHandler } from '@nestjs/cqrs';
import type { ApprovalItem } from '../../domain/approval-item.aggregate.js';
import type { Campaign } from '../../domain/campaign.aggregate.js';
import type { PlannedPublication } from '../../domain/planned-publication.entity.js';
import { CampaignFlowTransactionPort } from '../../ports/campaign-flow-transaction.port.js';
import { ReviewGeneratedArtifactIssueCommand } from './review-generated-artifact-issue.command.js';

export interface ReviewGeneratedArtifactIssueResult {
  campaignStatus: string;
  approvalItemStatus: string;
  plannedPublicationStatus: string;
  artifactType: 'adaptation' | 'translation';
  resumeStage: 'stage_1' | 'stage_2' | null;
}

function requireContent(command: ReviewGeneratedArtifactIssueCommand): string {
  const content = command.content?.trim();
  if (!content) {
    throw new Error(`Action ${command.action} requires edited content`);
  }

  return content;
}

function nextStage1Status(
  plannedPublication: PlannedPublication,
  sourceLanguage: string,
): 'ready' | 'translating' {
  return plannedPublication.language === sourceLanguage ? 'ready' : 'translating';
}

function markCampaignAfterResolution(
  campaign: Campaign,
  plannedPublications: PlannedPublication[],
  remainingPendingApprovalCount: number,
): 'stage_1' | 'stage_2' | null {
  if (remainingPendingApprovalCount > 0) {
    campaign.markNeedsAttention();
    return null;
  }

  const hasPendingStage1 = plannedPublications.some((item) => item.status === 'pending');
  if (hasPendingStage1) {
    campaign.markProducing();
    return 'stage_1';
  }

  const hasPendingStage2 = plannedPublications.some((item) => item.status === 'translating');
  if (hasPendingStage2) {
    campaign.markProducing();
    return 'stage_2';
  }

  const allReady = plannedPublications.every((item) => item.status === 'ready');
  if (allReady) {
    campaign.markReadyForFinalApproval();
    return null;
  }

  campaign.markProducing();
  return null;
}

function isGeneratedArtifactIssue(item: ApprovalItem): boolean {
  return item.type === 'adaptation_quality_exception' ||
    item.type === 'translation_fidelity_exception';
}

@CommandHandler(ReviewGeneratedArtifactIssueCommand)
export class ReviewGeneratedArtifactIssueHandler
  implements ICommandHandler<ReviewGeneratedArtifactIssueCommand, ReviewGeneratedArtifactIssueResult>
{
  constructor(
    @Inject(CampaignFlowTransactionPort)
    private readonly transaction: CampaignFlowTransactionPort,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ReviewGeneratedArtifactIssueCommand): Promise<ReviewGeneratedArtifactIssueResult> {
    const events: Parameters<EventBus['publishAll']>[0] = [];
    let result!: ReviewGeneratedArtifactIssueResult;

    await this.transaction.run(
      async ({
        approvalItemRepository,
        campaignRepository,
        plannedPublicationRepository,
        channelAdaptationRepository,
        adaptationVersionRepository,
        translationRepository,
        translationVersionRepository,
      }) => {
        const approvalItem = await approvalItemRepository.findById(command.approvalItemId as never);
        if (!approvalItem) {
          throw new Error(`Approval item ${command.approvalItemId} not found`);
        }

        if (approvalItem.campaignId !== command.campaignId) {
          throw new Error(
            `Approval item ${command.approvalItemId} does not belong to campaign ${command.campaignId}`,
          );
        }

        if (!isGeneratedArtifactIssue(approvalItem)) {
          throw new Error(`Approval item ${command.approvalItemId} is not a generated artifact issue`);
        }

        if (approvalItem.status !== 'pending') {
          throw new Error(`Approval item ${command.approvalItemId} is already resolved`);
        }

        const campaign = await campaignRepository.findById(command.campaignId as never);
        if (!campaign) {
          throw new Error(`Campaign ${command.campaignId} not found`);
        }

        if (!approvalItem.plannedPublicationId) {
          throw new Error(`Approval item ${command.approvalItemId} has no planned publication`);
        }

        const plannedPublication = await plannedPublicationRepository.findById(
          approvalItem.plannedPublicationId,
        );
        if (!plannedPublication) {
          throw new Error(`Planned publication ${approvalItem.plannedPublicationId} not found`);
        }

        let artifactType: 'adaptation' | 'translation';

        if (approvalItem.type === 'adaptation_quality_exception') {
          artifactType = 'adaptation';
          const adaptation = await channelAdaptationRepository.findById(
            approvalItem.artifactId as never,
          );
          if (!adaptation) {
            throw new Error(`Adaptation ${approvalItem.artifactId} not found`);
          }

          if (command.action === 'fix_ai') {
            adaptation.resetToPending();
            plannedPublication.markPending();
          } else {
            if (command.action === 'manual_edit') {
              const content = requireContent(command);
              const version = AdaptationVersion.create({
                adaptationId: adaptation.id,
                content,
                kind: 'manual_edit',
                sourceVersionId: adaptation.selectedVersionId as AdaptationVersionId | null,
                meta: {
                  approvalItemId: approvalItem.id,
                  note: command.note ?? null,
                  action: command.action,
                },
              });
              await adaptationVersionRepository.save(version);
              adaptation.edit(version.id, version.content);
            }

            if (adaptation.status !== 'approved') {
              adaptation.approve();
            }

            const nextStatus = nextStage1Status(plannedPublication, adaptation.sourceLanguage);
            if (nextStatus === 'ready') {
              plannedPublication.markReady();
            } else {
              plannedPublication.markTranslating();
            }
          }

          await channelAdaptationRepository.save(adaptation);
          events.push(...adaptation.pullEvents());
        } else {
          artifactType = 'translation';
          const translation = await translationRepository.findById(approvalItem.artifactId as never);
          if (!translation) {
            throw new Error(`Translation ${approvalItem.artifactId} not found`);
          }

          if (command.action === 'fix_ai') {
            translation.resetToPending();
            plannedPublication.markTranslating();
          } else {
            if (command.action === 'manual_edit') {
              const content = requireContent(command);
              const version = TranslationVersion.create({
                translationId: translation.id,
                content,
                kind: 'manual_edit',
                meta: {
                  approvalItemId: approvalItem.id,
                  note: command.note ?? null,
                  action: command.action,
                },
              });
              await translationVersionRepository.save(version);
              translation.edit(version.content);
            }

            if (translation.status === 'pending' && translation.translatedContent) {
              translation.markGenerated(translation.translatedContent);
            }

            if (translation.status !== 'approved') {
              translation.approve();
            }

            plannedPublication.markReady();
          }

          await translationRepository.save(translation);
          events.push(...translation.pullEvents());
        }

        approvalItem.resolve();
        await approvalItemRepository.save(approvalItem);

        const pendingApprovals = await approvalItemRepository.findByCampaignIdAndStatus(
          campaign.id,
          'pending',
        );
        const plannedPublications = await plannedPublicationRepository.findByCampaignId(campaign.id);
        const nextResumeStage = markCampaignAfterResolution(
          campaign,
          plannedPublications.map((item) =>
            item.id === plannedPublication.id ? plannedPublication : item,
          ),
          pendingApprovals.length,
        );

        await plannedPublicationRepository.save(plannedPublication);
        await campaignRepository.save(campaign);

        events.push(...approvalItem.pullEvents());
        events.push(...campaign.pullEvents());

        result = {
          campaignStatus: campaign.status,
          approvalItemStatus: approvalItem.status,
          plannedPublicationStatus: plannedPublication.status,
          artifactType,
          resumeStage: nextResumeStage,
        };
      },
    );

    this.eventBus.publishAll(events);
    return result;
  }
}
