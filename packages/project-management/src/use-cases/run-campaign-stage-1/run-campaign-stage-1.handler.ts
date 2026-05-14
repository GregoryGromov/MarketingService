import type {
  AdaptationVersionId,
  ArticleSourceVersion,
  ChannelId,
} from '@marketing-service/editorial';
import { AdaptationVersion, ChannelAdaptation } from '@marketing-service/editorial';
import type { DomainEvent } from '@marketing-service/shared';
import { CommandHandler, EventBus, type ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ApprovalItem } from '../../domain/approval-item.aggregate.js';
import { CampaignArtifact } from '../../domain/campaign-artifact.entity.js';
import type { PlannedPublication } from '../../domain/planned-publication.entity.js';
import { QualityCheckResult } from '../../domain/quality-check-result.entity.js';
import { WorkflowRun } from '../../domain/workflow-run.aggregate.js';
import type { BrandMemory } from '../../domain/project.aggregate.js';
import {
  AiGatewayPort,
  type AiGatewayQualityOutcome,
  type AiGatewayReason,
  type AiGatewaySeverity,
  type AiGatewaySuggestedFix,
  type AiQualityCheckResult,
} from '../../ports/ai-gateway.port.js';
import { CampaignFlowTransactionPort } from '../../ports/campaign-flow-transaction.port.js';
import { RunCampaignStage1Command } from './run-campaign-stage-1.command.js';

const MAX_STAGE_1_ATTEMPTS = 5;
const STAGE_1_BASE_ADAPTATION_ROLE = 'stage_1_base_adaptation';
const TERMINAL_CAMPAIGN_STATUSES = new Set([
  'draft',
  'source_checking',
  'source_needs_review',
  'approved_for_publishing',
  'publishing',
  'completed',
  'failed',
  'cancelled',
]);
const SEVERITY_RANK: Record<AiGatewaySeverity, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

interface Stage1Snapshot {
  campaignId: string;
  articleId: string;
  sourceVersionId: string;
  sourceContent: string;
  sourceLanguage: string;
  extraInstructions: string | null;
  brandMemory: BrandMemory;
  plannedPublicationIds: string[];
}

interface PlannedPublicationContext {
  plannedPublicationId: string;
  channel: string;
  language: string;
  publicationType: string;
  style: string;
  displayName: string;
  promptInstructions: string | null;
  adaptationId: string;
  currentContent: string | null;
  selectedVersionId: AdaptationVersionId | null;
}

export interface RunCampaignStage1ItemResult {
  plannedPublicationId: string;
  adaptationId: string;
  adaptationVersionId: string;
  attempts: number;
  status: 'ready' | 'translating' | 'stage_1_failed';
  approvalItemId: string | null;
}

export interface RunCampaignStage1Result {
  workflowRunId: string;
  campaignId: string;
  outcome: 'completed' | 'needs_attention';
  items: RunCampaignStage1ItemResult[];
}

function getLatestSourceVersion(versions: ArticleSourceVersion[]): ArticleSourceVersion | null {
  return [...versions].sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime()).at(-1) ?? null;
}

function getChannelLabel(channel: string): string {
  switch (channel) {
    case 'channel_telegram':
      return 'Telegram';
    case 'channel_x':
      return 'X';
    case 'channel_discord':
      return 'Discord';
    default:
      return channel;
  }
}

function toTitleCase(token: string): string {
  return token
    .split(/[_\s-]+/)
    .filter((part) => part.length > 0)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

function buildDisplayName(plannedPublication: PlannedPublication): string {
  return [
    getChannelLabel(plannedPublication.channel),
    toTitleCase(plannedPublication.publicationType),
    toTitleCase(plannedPublication.style),
    `Target ${plannedPublication.language.toUpperCase()}`,
  ].join(' - ');
}

function buildPromptInstructions(plannedPublication: PlannedPublication): string | null {
  const instructions = [
    `Publication type: ${plannedPublication.publicationType}.`,
    `Style: ${plannedPublication.style}.`,
  ];

  if (plannedPublication.notes) {
    instructions.push(`Notes: ${plannedPublication.notes}`);
  }

  return instructions.join(' ');
}

function getHighestSeverity(reasons: AiGatewayReason[]): 'low' | 'medium' | 'high' | 'critical' {
  let highest: AiGatewaySeverity = 'medium';

  for (const reason of reasons) {
    if (SEVERITY_RANK[reason.severity] > SEVERITY_RANK[highest]) {
      highest = reason.severity;
    }
  }

  return highest;
}

function serializeReasons(reasons: AiGatewayReason[]): Record<string, unknown>[] {
  return reasons.map((reason) => ({
    code: reason.code,
    severity: reason.severity,
    message: reason.message,
    excerpt: reason.excerpt,
    suggestion: reason.suggestion,
  }));
}

function buildSuggestedFixPayload(
  suggestedFix: AiGatewaySuggestedFix | null,
): Record<string, unknown> | null {
  if (!suggestedFix) {
    return null;
  }

  return {
    summary: suggestedFix.summary,
    instructions: suggestedFix.instructions,
  };
}

function isSuccessfulQualityOutcome(outcome: AiGatewayQualityOutcome): boolean {
  return outcome === 'passed' || outcome === 'warning';
}

function buildRevisionInstruction(
  plannedPublication: PlannedPublicationContext,
  qualityResult: AiQualityCheckResult,
): string {
  const instructions = [
    `Revise the adaptation for ${getChannelLabel(plannedPublication.channel)} so it passes the Stage 1 quality check.`,
    `Publication type: ${plannedPublication.publicationType}.`,
    `Style: ${plannedPublication.style}.`,
  ];

  if (qualityResult.suggestedFix?.summary) {
    instructions.push(`Fix summary: ${qualityResult.suggestedFix.summary}`);
  }

  if (qualityResult.suggestedFix?.instructions.length) {
    instructions.push(`Suggested changes: ${qualityResult.suggestedFix.instructions.join('; ')}`);
  }

  if (qualityResult.reasons.length > 0) {
    instructions.push(
      `Problems to resolve: ${qualityResult.reasons
        .map((reason) => `${reason.code}: ${reason.message}`)
        .join('; ')}`,
    );
  }

  return instructions.join('\n');
}

function collectStatusAfterStage1(
  plannedPublication: PlannedPublication,
  sourceLanguage: string,
): 'ready' | 'translating' {
  return plannedPublication.language === sourceLanguage ? 'ready' : 'translating';
}

@CommandHandler(RunCampaignStage1Command)
export class RunCampaignStage1Handler
  implements ICommandHandler<RunCampaignStage1Command, RunCampaignStage1Result>
{
  constructor(
    @Inject(CampaignFlowTransactionPort)
    private readonly transaction: CampaignFlowTransactionPort,
    @Inject(AiGatewayPort)
    private readonly aiGateway: AiGatewayPort,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: RunCampaignStage1Command): Promise<RunCampaignStage1Result> {
    let workflowRun!: WorkflowRun;
    let snapshot!: Stage1Snapshot;
    let inProgressPlannedPublicationId: string | null = null;

    try {
      const initialEvents: DomainEvent[] = [];

      await this.transaction.run(
        async ({
          campaignRepository,
          plannedPublicationRepository,
          projectRepository,
          articleRepository,
          articleSourceVersionRepository,
          workflowRunRepository,
        }) => {
          const campaign = await campaignRepository.findById(command.campaignId as never);
          if (!campaign) {
            throw new Error(`Campaign ${command.campaignId} not found`);
          }

          if (TERMINAL_CAMPAIGN_STATUSES.has(campaign.status)) {
            throw new Error(
              `Campaign ${command.campaignId} is not ready for Stage 1 from status "${campaign.status}"`,
            );
          }

          if (!campaign.sourceArticleId) {
            throw new Error(`Campaign ${command.campaignId} has no attached source article`);
          }

          const activeRun = await workflowRunRepository.findActiveByCampaignId(campaign.id);
          if (activeRun) {
            throw new Error(`Campaign ${command.campaignId} already has an active workflow run`);
          }

          const project = await projectRepository.findById(campaign.projectId);
          if (!project) {
            throw new Error(`Project ${campaign.projectId} not found`);
          }

          const article = await articleRepository.findById(campaign.sourceArticleId as never);
          if (!article) {
            throw new Error(`Article ${campaign.sourceArticleId} not found`);
          }

          const sourceVersions = await articleSourceVersionRepository.findByArticleId(article.id);
          const sourceVersion = getLatestSourceVersion(sourceVersions);
          if (!sourceVersion) {
            throw new Error(`Article ${article.id} has no source versions`);
          }

          const pendingPublications = (
            await plannedPublicationRepository.findByCampaignIdAndStatus(campaign.id, 'pending')
          ).sort((left, right) => left.scheduledFor.getTime() - right.scheduledFor.getTime());

          if (pendingPublications.length === 0) {
            throw new Error(`Campaign ${command.campaignId} has no pending planned publications`);
          }

          workflowRun = WorkflowRun.create({
            campaignId: campaign.id,
            currentStep: 'stage_1_adaptation',
          });

          await workflowRunRepository.save(workflowRun);
          initialEvents.push(...workflowRun.pullEvents());

          snapshot = {
            campaignId: campaign.id,
            articleId: article.id,
            sourceVersionId: sourceVersion.id,
            sourceContent: sourceVersion.content,
            sourceLanguage: sourceVersion.language,
            extraInstructions: campaign.extraInstructions,
            brandMemory: project.brandMemory,
            plannedPublicationIds: pendingPublications.map((plannedPublication) => plannedPublication.id),
          };
        },
      );

      this.eventBus.publishAll(initialEvents);

      const items: RunCampaignStage1ItemResult[] = [];

      for (const plannedPublicationId of snapshot.plannedPublicationIds) {
        inProgressPlannedPublicationId = plannedPublicationId;
        const publicationContext = await this.preparePlannedPublication(plannedPublicationId, snapshot);
        const itemResult = await this.runQualityLoop(publicationContext, snapshot);
        items.push(itemResult);
        inProgressPlannedPublicationId = null;
      }

      let outcome: RunCampaignStage1Result['outcome'] = 'completed';

      await this.transaction.run(
        async ({ campaignRepository, plannedPublicationRepository, workflowRunRepository }) => {
          const campaign = await campaignRepository.findById(snapshot.campaignId as never);
          if (!campaign) {
            throw new Error(`Campaign ${snapshot.campaignId} not found`);
          }

          const persistedWorkflowRun = await workflowRunRepository.findById(workflowRun.id);
          if (!persistedWorkflowRun) {
            throw new Error(`Workflow run ${workflowRun.id} not found`);
          }

          const plannedPublications = await plannedPublicationRepository.findByCampaignId(campaign.id);
          const hasStage1Failures = plannedPublications.some(
            (plannedPublication) => plannedPublication.status === 'stage_1_failed',
          );
          const allReady = plannedPublications.every(
            (plannedPublication) => plannedPublication.status === 'ready',
          );

          if (hasStage1Failures) {
            campaign.markNeedsAttention();
            persistedWorkflowRun.fail('Stage 1 adaptation quality review required');
            outcome = 'needs_attention';
          } else {
            if (allReady) {
              campaign.markReadyForFinalApproval();
            } else {
              campaign.markProducing();
            }

            persistedWorkflowRun.complete();
          }

          await campaignRepository.save(campaign);
          await workflowRunRepository.save(persistedWorkflowRun);
        },
      );

      return {
        workflowRunId: workflowRun.id,
        campaignId: snapshot.campaignId,
        outcome,
        items,
      };
    } catch (error) {
      if (workflowRun && snapshot) {
        await this.transaction.run(
          async ({ campaignRepository, plannedPublicationRepository, workflowRunRepository }) => {
            const campaign = await campaignRepository.findById(snapshot.campaignId as never);
            const persistedWorkflowRun = await workflowRunRepository.findById(workflowRun.id);

            if (inProgressPlannedPublicationId) {
              const plannedPublication = await plannedPublicationRepository.findById(
                inProgressPlannedPublicationId as never,
              );

              if (plannedPublication && plannedPublication.status === 'adapting') {
                plannedPublication.markFailed();
                await plannedPublicationRepository.save(plannedPublication);
              }
            }

            if (campaign) {
              campaign.fail();
              await campaignRepository.save(campaign);
            }

            if (persistedWorkflowRun) {
              persistedWorkflowRun.fail(
                error instanceof Error ? error.message : 'Stage 1 adaptation failed unexpectedly',
              );
              await workflowRunRepository.save(persistedWorkflowRun);
            }
          },
        );
      }

      throw error;
    }
  }

  private async preparePlannedPublication(
    plannedPublicationId: string,
    snapshot: Stage1Snapshot,
  ): Promise<PlannedPublicationContext> {
    let result!: PlannedPublicationContext;
    const events: DomainEvent[] = [];

    await this.transaction.run(
      async ({
        plannedPublicationRepository,
        campaignArtifactRepository,
        channelAdaptationRepository,
      }) => {
        const plannedPublication = await plannedPublicationRepository.findById(
          plannedPublicationId as never,
        );
        if (!plannedPublication || plannedPublication.campaignId !== snapshot.campaignId) {
          throw new Error(`Planned publication ${plannedPublicationId} not found`);
        }

        if (plannedPublication.status !== 'pending' && plannedPublication.status !== 'adapting') {
          throw new Error(
            `Planned publication ${plannedPublicationId} is not eligible for Stage 1 from status "${plannedPublication.status}"`,
          );
        }

        let adaptationArtifact = (
          await campaignArtifactRepository.findByPlannedPublicationId(plannedPublication.id)
        ).find(
          (artifact) =>
            artifact.artifactType === 'adaptation' && artifact.role === STAGE_1_BASE_ADAPTATION_ROLE,
        );
        let adaptation: ChannelAdaptation | null = null;

        if (adaptationArtifact) {
          adaptation = await channelAdaptationRepository.findById(adaptationArtifact.artifactId as never);
          if (!adaptation) {
            throw new Error(
              `Adaptation ${adaptationArtifact.artifactId} linked to planned publication ${plannedPublication.id} not found`,
            );
          }
        } else {
          adaptation = ChannelAdaptation.create({
            articleId: snapshot.articleId as never,
            channelId: plannedPublication.channel as ChannelId,
            displayName: buildDisplayName(plannedPublication),
            promptInstructions: buildPromptInstructions(plannedPublication),
            sourceLanguage: snapshot.sourceLanguage,
          });

          adaptationArtifact = CampaignArtifact.create({
            campaignId: snapshot.campaignId as never,
            plannedPublicationId: plannedPublication.id,
            artifactType: 'adaptation',
            artifactId: adaptation.id,
            role: STAGE_1_BASE_ADAPTATION_ROLE,
          });

          await channelAdaptationRepository.save(adaptation);
          await campaignArtifactRepository.save(adaptationArtifact);
          events.push(...adaptation.pullEvents());
        }

        if (plannedPublication.status === 'pending') {
          plannedPublication.markAdapting();
          await plannedPublicationRepository.save(plannedPublication);
        }

        result = {
          plannedPublicationId: plannedPublication.id,
          channel: plannedPublication.channel,
          language: plannedPublication.language,
          publicationType: plannedPublication.publicationType,
          style: plannedPublication.style,
          displayName: adaptation.displayName,
          promptInstructions: adaptation.promptInstructions,
          adaptationId: adaptation.id,
          currentContent: adaptation.adaptedContent,
          selectedVersionId: adaptation.selectedVersionId,
        };
      },
    );

    this.eventBus.publishAll(events);
    return result;
  }

  private async runQualityLoop(
    publicationContext: PlannedPublicationContext,
    snapshot: Stage1Snapshot,
  ): Promise<RunCampaignStage1ItemResult> {
    let currentContent = publicationContext.currentContent;
    let currentSelectedVersionId = publicationContext.selectedVersionId;
    let lastQualityResult: AiQualityCheckResult | null = null;

    for (let attempt = 1; attempt <= MAX_STAGE_1_ATTEMPTS; attempt += 1) {
      const aiResult =
        attempt === 1
          ? await this.aiGateway.generateAdaptation({
              sourceContent: snapshot.sourceContent,
              sourceLanguage: snapshot.sourceLanguage,
              channel: publicationContext.channel,
              displayName: publicationContext.displayName,
              publicationType: publicationContext.publicationType,
              style: publicationContext.style,
              promptInstructions: publicationContext.promptInstructions,
              brandMemory: snapshot.brandMemory,
              extraInstructions: snapshot.extraInstructions,
            })
          : await this.aiGateway.reviseAdaptation({
              currentContent: currentContent ?? '',
              sourceLanguage: snapshot.sourceLanguage,
              channel: publicationContext.channel,
              displayName: publicationContext.displayName,
              publicationType: publicationContext.publicationType,
              style: publicationContext.style,
              promptInstructions: publicationContext.promptInstructions,
              instruction: buildRevisionInstruction(publicationContext, lastQualityResult!),
              sourceContent: snapshot.sourceContent,
              brandMemory: snapshot.brandMemory,
              qualityReasons: lastQualityResult?.reasons ?? [],
              suggestedFix: lastQualityResult?.suggestedFix ?? null,
            });

      const persistedVersion = await this.persistAdaptationAttempt(
        publicationContext,
        aiResult.content,
        attempt,
        currentSelectedVersionId,
        snapshot.sourceVersionId,
      );

      currentContent = aiResult.content;
      currentSelectedVersionId = persistedVersion.id as AdaptationVersionId;

      const qualityResult = await this.aiGateway.checkAdaptationQuality({
        sourceContent: snapshot.sourceContent,
        adaptationContent: aiResult.content,
        sourceLanguage: snapshot.sourceLanguage,
        channel: publicationContext.channel,
        displayName: publicationContext.displayName,
        publicationType: publicationContext.publicationType,
        style: publicationContext.style,
        promptInstructions: publicationContext.promptInstructions,
        brandMemory: snapshot.brandMemory,
      });

      lastQualityResult = qualityResult;

      const finalStatus = await this.persistQualityCheckOutcome(
        publicationContext,
        snapshot,
        persistedVersion.id,
        qualityResult,
        attempt,
      );

      if (finalStatus.status === 'ready' || finalStatus.status === 'translating') {
        return {
          plannedPublicationId: publicationContext.plannedPublicationId,
          adaptationId: publicationContext.adaptationId,
          adaptationVersionId: persistedVersion.id,
          attempts: attempt,
          status: finalStatus.status,
          approvalItemId: null,
        };
      }

      if (finalStatus.status === 'stage_1_failed') {
        return {
          plannedPublicationId: publicationContext.plannedPublicationId,
          adaptationId: publicationContext.adaptationId,
          adaptationVersionId: persistedVersion.id,
          attempts: attempt,
          status: 'stage_1_failed',
          approvalItemId: finalStatus.approvalItemId,
        };
      }
    }

    throw new Error(
      `Stage 1 adaptation loop exceeded ${MAX_STAGE_1_ATTEMPTS} attempts for planned publication ${publicationContext.plannedPublicationId}`,
    );
  }

  private async persistAdaptationAttempt(
    publicationContext: PlannedPublicationContext,
    content: string,
    attempt: number,
    previousVersionId: AdaptationVersionId | null,
    sourceVersionId: string,
  ): Promise<AdaptationVersion> {
    let version!: AdaptationVersion;
    const events: DomainEvent[] = [];

    await this.transaction.run(
      async ({ channelAdaptationRepository, adaptationVersionRepository }) => {
        const adaptation = await channelAdaptationRepository.findById(
          publicationContext.adaptationId as never,
        );
        if (!adaptation) {
          throw new Error(`Adaptation ${publicationContext.adaptationId} not found`);
        }

        version = AdaptationVersion.create({
          adaptationId: adaptation.id,
          content,
          kind: attempt === 1 ? 'generated' : 'ai_revision',
          sourceVersionId: previousVersionId,
          meta: {
            attemptNumber: attempt,
            plannedPublicationId: publicationContext.plannedPublicationId,
            publicationType: publicationContext.publicationType,
            style: publicationContext.style,
            sourceArticleVersionId: sourceVersionId,
          },
        });

        await adaptationVersionRepository.save(version);

        if (attempt === 1) {
          adaptation.markGenerated(version.id, content);
        } else {
          adaptation.edit(version.id, content);
        }

        await channelAdaptationRepository.save(adaptation);
        events.push(...adaptation.pullEvents());
      },
    );

    this.eventBus.publishAll(events);
    return version;
  }

  private async persistQualityCheckOutcome(
    publicationContext: PlannedPublicationContext,
    snapshot: Stage1Snapshot,
    adaptationVersionId: string,
    qualityResult: AiQualityCheckResult,
    attempt: number,
  ): Promise<
    | { status: 'retrying'; approvalItemId: null }
    | { status: 'ready' | 'translating'; approvalItemId: null }
    | { status: 'stage_1_failed'; approvalItemId: string }
  > {
    let outcome:
      | { status: 'retrying'; approvalItemId: null }
      | { status: 'ready' | 'translating'; approvalItemId: null }
      | { status: 'stage_1_failed'; approvalItemId: string } = {
      status: 'retrying',
      approvalItemId: null,
    };
    const events: DomainEvent[] = [];

    await this.transaction.run(
      async ({
        campaignRepository,
        plannedPublicationRepository,
        channelAdaptationRepository,
        qualityCheckResultRepository,
        approvalItemRepository,
      }) => {
        const campaign = await campaignRepository.findById(snapshot.campaignId as never);
        if (!campaign) {
          throw new Error(`Campaign ${snapshot.campaignId} not found`);
        }

        const plannedPublication = await plannedPublicationRepository.findById(
          publicationContext.plannedPublicationId as never,
        );
        if (!plannedPublication) {
          throw new Error(
            `Planned publication ${publicationContext.plannedPublicationId} not found`,
          );
        }

        const adaptation = await channelAdaptationRepository.findById(
          publicationContext.adaptationId as never,
        );
        if (!adaptation) {
          throw new Error(`Adaptation ${publicationContext.adaptationId} not found`);
        }

        const qualityCheckResult = QualityCheckResult.create({
          campaignId: campaign.id,
          plannedPublicationId: plannedPublication.id,
          artifactType: 'adaptation',
          artifactId: adaptation.id,
          artifactVersionId: adaptationVersionId,
          checkType: 'stage_1_adaptation_quality',
          result: qualityResult.outcome,
          attemptNumber: attempt,
          reasons: serializeReasons(qualityResult.reasons),
          suggestedFix: buildSuggestedFixPayload(qualityResult.suggestedFix),
          rawAiResult: qualityResult as unknown as Record<string, unknown>,
        });

        await qualityCheckResultRepository.save(qualityCheckResult);

        if (isSuccessfulQualityOutcome(qualityResult.outcome)) {
          adaptation.approve();
          const nextStatus = collectStatusAfterStage1(plannedPublication, snapshot.sourceLanguage);

          if (nextStatus === 'ready') {
            plannedPublication.markReady();
          } else {
            plannedPublication.markTranslating();
          }

          await channelAdaptationRepository.save(adaptation);
          await plannedPublicationRepository.save(plannedPublication);
          events.push(...adaptation.pullEvents());
          outcome = {
            status: nextStatus,
            approvalItemId: null,
          };
          return;
        }

        if (attempt < MAX_STAGE_1_ATTEMPTS) {
          outcome = {
            status: 'retrying',
            approvalItemId: null,
          };
          return;
        }

        const approvalItem = ApprovalItem.create({
          projectId: campaign.projectId,
          campaignId: campaign.id,
          plannedPublicationId: plannedPublication.id,
          artifactType: 'adaptation',
          artifactId: adaptation.id,
          type: 'adaptation_quality_exception',
          severity: getHighestSeverity(qualityResult.reasons),
          title: 'Stage 1 adaptation needs human review',
          details: {
            summary: qualityResult.summary,
            reasons: qualityResult.reasons,
            adaptationVersionId,
            attemptCount: attempt,
            channel: publicationContext.channel,
            publicationType: publicationContext.publicationType,
            style: publicationContext.style,
          },
          suggestedFix: buildSuggestedFixPayload(qualityResult.suggestedFix),
        });

        plannedPublication.markStage1Failed();
        campaign.markNeedsAttention();

        await approvalItemRepository.save(approvalItem);
        await plannedPublicationRepository.save(plannedPublication);
        await campaignRepository.save(campaign);
        events.push(...approvalItem.pullEvents());

        outcome = {
          status: 'stage_1_failed',
          approvalItemId: approvalItem.id,
        };
      },
    );

    this.eventBus.publishAll(events);
    return outcome;
  }
}
