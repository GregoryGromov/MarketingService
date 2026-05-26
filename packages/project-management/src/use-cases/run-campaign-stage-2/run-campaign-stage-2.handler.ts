import type { AdaptationVersionId, TranslationVersionId } from '@marketing-service/editorial';
import { Translation, TranslationVersion } from '@marketing-service/editorial';
import type { DomainEvent } from '@marketing-service/shared';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { ApprovalItem } from '../../domain/approval-item.aggregate.js';
import { CampaignArtifact } from '../../domain/campaign-artifact.entity.js';
import type { PlannedPublication } from '../../domain/planned-publication.entity.js';
import { QualityCheckResult } from '../../domain/quality-check-result.entity.js';
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

const MAX_STAGE_2_ATTEMPTS = 5;
const X_PUBLISHING_CHARACTER_TARGET = 260;
const TELEGRAM_IMAGE_CAPTION_CHARACTER_TARGET = 900;
const DISCORD_WEBHOOK_CHARACTER_TARGET = 1800;
const STAGE_1_BASE_ADAPTATION_ROLE = 'stage_1_base_adaptation';
const STAGE_2_TRANSLATION_ROLE = 'stage_2_translation';
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

interface Stage2Snapshot {
  campaignId: string;
  brandMemory: BrandMemory;
  translatingPlannedPublicationIds: string[];
}

interface TranslationPublicationContext {
  plannedPublicationId: string;
  targetLanguage: string;
  channel: string;
  publicationType: string;
  style: string;
  displayName: string;
  promptInstructions: string | null;
  adaptationId: string;
  adaptationContent: string;
  adaptationSourceLanguage: string;
  adaptationVersionId: AdaptationVersionId | null;
  translationId: string | null;
  currentTranslationContent: string | null;
  currentTranslationVersionId: TranslationVersionId | null;
}

export interface RunCampaignStage2ItemResult {
  plannedPublicationId: string;
  translationId: string | null;
  translationVersionId: string | null;
  attempts: number;
  status: 'ready' | 'stage_2_failed';
  approvalItemId: string | null;
}

export interface RunCampaignStage2Result {
  workflowRunId: string;
  campaignId: string;
  outcome: 'completed' | 'needs_attention';
  items: RunCampaignStage2ItemResult[];
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

function getHighestSeverity(reasons: AiGatewayReason[]): 'low' | 'medium' | 'high' | 'critical' {
  let highest: AiGatewaySeverity = 'medium';

  for (const reason of reasons) {
    if (SEVERITY_RANK[reason.severity] > SEVERITY_RANK[highest]) {
      highest = reason.severity;
    }
  }

  return highest;
}

function isSuccessfulQualityOutcome(outcome: AiGatewayQualityOutcome): boolean {
  return outcome === 'passed' || outcome === 'warning';
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

function buildPublicationLengthQualityResult(
  channel: string,
  content: string,
): AiQualityCheckResult | null {
  const limit =
    channel === 'channel_x'
      ? X_PUBLISHING_CHARACTER_TARGET
      : channel === 'channel_telegram'
        ? TELEGRAM_IMAGE_CAPTION_CHARACTER_TARGET
        : channel === 'channel_discord'
          ? DISCORD_WEBHOOK_CHARACTER_TARGET
          : null;

  if (limit == null) {
    return null;
  }

  const length = Array.from(content).length;

  if (length <= limit) {
    return null;
  }

  const label = getChannelLabel(channel);
  const reasonCode =
    channel === 'channel_x'
      ? 'x_post_too_long'
      : channel === 'channel_telegram'
        ? 'telegram_caption_too_long'
        : 'discord_post_too_long';

  return {
    outcome: 'failed',
    summary: `${label} translation is too long for publishing (${length} characters).`,
    reasons: [
      {
        code: reasonCode,
        severity: 'high',
        message: `${label} post must be under ${limit} characters, but the generated translation is ${length} characters.`,
        excerpt: content,
        suggestion: `Rewrite as one standalone ${label} post under ${limit} characters.`,
      },
    ],
    suggestedFix: {
      summary: `Shorten the ${label} translation to under ${limit} characters.`,
      instructions: [
        `Return one standalone ${label} post under ${limit} characters, including spaces.`,
        'Preserve only the central idea and remove secondary details.',
        'Do not create a thread or multiple variants.',
      ],
    },
  };
}

function translationNotRequired(targetLanguage: string, sourceLanguage: string): boolean {
  return targetLanguage === sourceLanguage;
}

function getRecoveryVersionKind(currentStatus: string): 'generated' | 'manual_edit' {
  return currentStatus === 'edited' ? 'manual_edit' : 'generated';
}

function ensureTranslationApproved(translation: Translation): void {
  if (translation.status === 'approved') {
    return;
  }

  if (translation.status === 'pending' || translation.status === 'outdated') {
    if (!translation.translatedContent) {
      throw new Error(`Translation ${translation.id} has no content to approve`);
    }

    translation.markGenerated(translation.translatedContent);
  }

  translation.approve();
}

@Injectable()
export class RunCampaignStage2Executor {
  private readonly logger = new Logger(RunCampaignStage2Executor.name);

  constructor(
    @Inject(CampaignFlowTransactionPort)
    private readonly transaction: CampaignFlowTransactionPort,
    @Inject(AiGatewayPort)
    private readonly aiGateway: AiGatewayPort,
    private readonly eventBus: EventBus,
  ) {}

  async execute(campaignId: string, workflowRunId: string): Promise<RunCampaignStage2Result> {
    let snapshot!: Stage2Snapshot;
    let inProgressPlannedPublicationId: string | null = null;

    this.logger.log(`Stage 2 started: campaign=${campaignId} workflowRun=${workflowRunId}`);

    try {
      await this.transaction.run(
        async ({
          campaignRepository,
          plannedPublicationRepository,
          projectRepository,
          workflowRunRepository,
        }) => {
          const campaign = await campaignRepository.findById(campaignId as never);
          if (!campaign) {
            throw new Error(`Campaign ${campaignId} not found`);
          }

          if (TERMINAL_CAMPAIGN_STATUSES.has(campaign.status)) {
            throw new Error(
              `Campaign ${campaignId} is not ready for Stage 2 from status "${campaign.status}"`,
            );
          }

          const workflowRun = await workflowRunRepository.findById(workflowRunId as never);
          if (!workflowRun) {
            throw new Error(`Workflow run ${workflowRunId} not found`);
          }

          if (workflowRun.campaignId !== campaign.id) {
            throw new Error(
              `Workflow run ${workflowRunId} does not belong to campaign ${campaignId}`,
            );
          }

          if (workflowRun.status !== 'running') {
            throw new Error(`Workflow run ${workflowRunId} is not running`);
          }

          const project = await projectRepository.findById(campaign.projectId);
          if (!project) {
            throw new Error(`Project ${campaign.projectId} not found`);
          }

          const translatingPublications = (
            await plannedPublicationRepository.findByCampaignIdAndStatus(campaign.id, 'translating')
          ).sort((left, right) => left.scheduledFor.getTime() - right.scheduledFor.getTime());

          if (translatingPublications.length === 0) {
            throw new Error(
              `Campaign ${campaignId} has no planned publications waiting for Stage 2`,
            );
          }

          snapshot = {
            campaignId: campaign.id,
            brandMemory: project.brandMemory,
            translatingPlannedPublicationIds: translatingPublications.map(
              (plannedPublication) => plannedPublication.id,
            ),
          };
        },
      );

      const items: RunCampaignStage2ItemResult[] = [];

      for (const plannedPublicationId of snapshot.translatingPlannedPublicationIds) {
        inProgressPlannedPublicationId = plannedPublicationId;
        const publicationContext = await this.preparePlannedPublication(
          plannedPublicationId,
          snapshot,
        );
        this.logger.log(
          `Stage 2 publication started: campaign=${snapshot.campaignId} workflowRun=${workflowRunId} plannedPublication=${publicationContext.plannedPublicationId} channel=${publicationContext.channel} language=${publicationContext.targetLanguage} type=${publicationContext.publicationType} style=${publicationContext.style}`,
        );
        const itemResult = await this.runTranslationLoop(publicationContext, snapshot);
        items.push(itemResult);
        this.logger.log(
          `Stage 2 publication completed: campaign=${snapshot.campaignId} workflowRun=${workflowRunId} plannedPublication=${itemResult.plannedPublicationId} status=${itemResult.status} attempts=${itemResult.attempts} approvalItem=${itemResult.approvalItemId ?? 'none'}`,
        );
        inProgressPlannedPublicationId = null;
      }

      let outcome: RunCampaignStage2Result['outcome'] = 'completed';

      await this.transaction.run(
        async ({ campaignRepository, plannedPublicationRepository, workflowRunRepository }) => {
          const campaign = await campaignRepository.findById(snapshot.campaignId as never);
          if (!campaign) {
            throw new Error(`Campaign ${snapshot.campaignId} not found`);
          }

          const persistedWorkflowRun = await workflowRunRepository.findById(workflowRunId as never);
          if (!persistedWorkflowRun) {
            throw new Error(`Workflow run ${workflowRunId} not found`);
          }

          const plannedPublications = await plannedPublicationRepository.findByCampaignId(
            campaign.id,
          );
          const hasUnresolvedPublicationIssues = plannedPublications.some((plannedPublication) =>
            ['source_blocked', 'stage_1_failed', 'stage_2_failed', 'blocked', 'failed'].includes(
              plannedPublication.status,
            ),
          );
          const allReady = plannedPublications.every(
            (plannedPublication) => plannedPublication.status === 'ready',
          );

          if (hasUnresolvedPublicationIssues) {
            campaign.markNeedsAttention();
            persistedWorkflowRun.fail('Campaign still has unresolved publication issues');
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

      this.logger.log(
        `Stage 2 completed: campaign=${snapshot.campaignId} workflowRun=${workflowRunId} outcome=${outcome} publications=${items.length} ready=${items.filter((item) => item.status === 'ready').length} failed=${items.filter((item) => item.status === 'stage_2_failed').length}`,
      );

      return {
        workflowRunId,
        campaignId: snapshot.campaignId,
        outcome,
        items,
      };
    } catch (error) {
      if (snapshot) {
        await this.transaction.run(
          async ({ campaignRepository, plannedPublicationRepository, workflowRunRepository }) => {
            const campaign = await campaignRepository.findById(snapshot.campaignId as never);
            const persistedWorkflowRun = await workflowRunRepository.findById(
              workflowRunId as never,
            );

            if (inProgressPlannedPublicationId) {
              const plannedPublication = await plannedPublicationRepository.findById(
                inProgressPlannedPublicationId as never,
              );

              if (plannedPublication && plannedPublication.status === 'translating') {
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
                error instanceof Error ? error.message : 'Stage 2 translation failed unexpectedly',
              );
              await workflowRunRepository.save(persistedWorkflowRun);
            }
          },
        );
      }

      this.logger.error(
        error instanceof Error ? error.message : String(error),
        `Stage 2 failed: campaign=${campaignId} workflowRun=${workflowRunId} plannedPublication=${inProgressPlannedPublicationId ?? 'none'}`,
      );
      throw error;
    }
  }

  private async preparePlannedPublication(
    plannedPublicationId: string,
    snapshot: Stage2Snapshot,
  ): Promise<TranslationPublicationContext> {
    let result!: TranslationPublicationContext;
    const events: DomainEvent[] = [];

    await this.transaction.run(
      async ({
        plannedPublicationRepository,
        campaignArtifactRepository,
        channelAdaptationRepository,
        translationRepository,
        translationVersionRepository,
      }) => {
        const plannedPublication = await plannedPublicationRepository.findById(
          plannedPublicationId as never,
        );
        if (!plannedPublication || plannedPublication.campaignId !== snapshot.campaignId) {
          throw new Error(`Planned publication ${plannedPublicationId} not found`);
        }

        if (plannedPublication.status !== 'translating') {
          throw new Error(
            `Planned publication ${plannedPublicationId} is not eligible for Stage 2 from status "${plannedPublication.status}"`,
          );
        }

        const adaptationArtifact = (
          await campaignArtifactRepository.findByPlannedPublicationId(plannedPublication.id)
        ).find(
          (artifact) =>
            artifact.artifactType === 'adaptation' &&
            artifact.role === STAGE_1_BASE_ADAPTATION_ROLE,
        );
        if (!adaptationArtifact) {
          throw new Error(
            `Planned publication ${plannedPublication.id} has no Stage 1 adaptation artifact`,
          );
        }

        const adaptation = await channelAdaptationRepository.findById(
          adaptationArtifact.artifactId as never,
        );
        if (!adaptation || !adaptation.adaptedContent) {
          throw new Error(
            `Adaptation ${adaptationArtifact.artifactId} for planned publication ${plannedPublication.id} is missing content`,
          );
        }

        let translationArtifact = (
          await campaignArtifactRepository.findByPlannedPublicationId(plannedPublication.id)
        ).find(
          (artifact) =>
            artifact.artifactType === 'translation' && artifact.role === STAGE_2_TRANSLATION_ROLE,
        );
        let translation: Translation | null = null;
        let currentTranslationVersionId: TranslationVersionId | null = null;

        if (translationArtifact) {
          translation = await translationRepository.findById(
            translationArtifact.artifactId as never,
          );
          if (!translation) {
            throw new Error(
              `Translation ${translationArtifact.artifactId} linked to planned publication ${plannedPublication.id} not found`,
            );
          }
        } else if (
          !translationNotRequired(plannedPublication.language, adaptation.sourceLanguage)
        ) {
          translation = await translationRepository.findByAdaptationIdAndTargetLanguage(
            adaptation.id,
            plannedPublication.language,
          );

          if (!translation) {
            translation = Translation.create({
              adaptationId: adaptation.id,
              sourceLanguage: adaptation.sourceLanguage,
              targetLanguage: plannedPublication.language,
            });
            await translationRepository.save(translation);
            events.push(...translation.pullEvents());
          }

          translationArtifact = CampaignArtifact.create({
            campaignId: snapshot.campaignId as never,
            plannedPublicationId: plannedPublication.id,
            artifactType: 'translation',
            artifactId: translation.id,
            role: STAGE_2_TRANSLATION_ROLE,
          });

          await campaignArtifactRepository.save(translationArtifact);
        }

        if (translation) {
          const versions = await translationVersionRepository.findByTranslationId(translation.id);
          currentTranslationVersionId =
            [...versions]
              .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime())
              .at(-1)?.id ?? null;
        }

        result = {
          plannedPublicationId: plannedPublication.id,
          targetLanguage: plannedPublication.language,
          channel: plannedPublication.channel,
          publicationType: plannedPublication.publicationType,
          style: plannedPublication.style,
          displayName: adaptation.displayName,
          promptInstructions: adaptation.promptInstructions,
          adaptationId: adaptation.id,
          adaptationContent: adaptation.adaptedContent,
          adaptationSourceLanguage: adaptation.sourceLanguage,
          adaptationVersionId: adaptation.selectedVersionId,
          translationId: translation?.id ?? null,
          currentTranslationContent: translation?.translatedContent ?? null,
          currentTranslationVersionId,
        };
      },
    );

    this.eventBus.publishAll(events);
    return result;
  }

  private async runTranslationLoop(
    publicationContext: TranslationPublicationContext,
    snapshot: Stage2Snapshot,
  ): Promise<RunCampaignStage2ItemResult> {
    if (
      translationNotRequired(
        publicationContext.targetLanguage,
        publicationContext.adaptationSourceLanguage,
      )
    ) {
      await this.transaction.run(async ({ plannedPublicationRepository }) => {
        const plannedPublication = await plannedPublicationRepository.findById(
          publicationContext.plannedPublicationId as never,
        );
        if (!plannedPublication) {
          throw new Error(
            `Planned publication ${publicationContext.plannedPublicationId} not found`,
          );
        }

        plannedPublication.markReady();
        await plannedPublicationRepository.save(plannedPublication);
      });

      this.logger.log(
        `Stage 2 skipped: campaign=${snapshot.campaignId} plannedPublication=${publicationContext.plannedPublicationId} reason=same_language language=${publicationContext.targetLanguage}`,
      );

      return {
        plannedPublicationId: publicationContext.plannedPublicationId,
        translationId: publicationContext.translationId,
        translationVersionId: publicationContext.currentTranslationVersionId,
        attempts: 0,
        status: 'ready',
        approvalItemId: null,
      };
    }

    if (!publicationContext.translationId) {
      throw new Error(
        `Planned publication ${publicationContext.plannedPublicationId} has no translation aggregate`,
      );
    }

    let currentContent = publicationContext.currentTranslationContent;
    let currentVersionId = publicationContext.currentTranslationVersionId;
    let lastQualityResult: AiQualityCheckResult | null = null;

    for (let attempt = 1; attempt <= MAX_STAGE_2_ATTEMPTS; attempt += 1) {
      if (attempt === 1) {
        if (!currentContent) {
          const aiResult: { content: string } = await this.aiGateway.generateTranslation({
            sourceContent: publicationContext.adaptationContent,
            sourceLanguage: publicationContext.adaptationSourceLanguage,
            targetLanguage: publicationContext.targetLanguage,
            channel: publicationContext.channel,
            displayName: publicationContext.displayName,
            publicationType: publicationContext.publicationType,
            style: publicationContext.style,
            promptInstructions: publicationContext.promptInstructions,
            brandMemory: snapshot.brandMemory,
          });

          const version = await this.persistTranslationAttempt(
            publicationContext,
            aiResult.content,
            'generated',
            currentVersionId,
          );

          currentContent = aiResult.content;
          currentVersionId = version.id;
        } else if (!currentVersionId) {
          const version = await this.persistRecoveredTranslationVersion(
            publicationContext,
            currentContent,
          );
          currentVersionId = version.id;
        }
      } else {
        const aiResult: { content: string } = await this.aiGateway.reviseTranslation({
          currentContent: currentContent ?? '',
          sourceContent: publicationContext.adaptationContent,
          sourceLanguage: publicationContext.adaptationSourceLanguage,
          targetLanguage: publicationContext.targetLanguage,
          channel: publicationContext.channel,
          displayName: publicationContext.displayName,
          publicationType: publicationContext.publicationType,
          style: publicationContext.style,
          promptInstructions: publicationContext.promptInstructions,
          brandMemory: snapshot.brandMemory,
          qualityReasons: lastQualityResult?.reasons ?? [],
          suggestedFix: lastQualityResult?.suggestedFix ?? null,
        });

        const version = await this.persistTranslationAttempt(
          publicationContext,
          aiResult.content,
          'ai_revision',
          currentVersionId,
        );

        currentContent = aiResult.content;
        currentVersionId = version.id;
      }

      const lengthQualityResult = buildPublicationLengthQualityResult(
        publicationContext.channel,
        currentContent ?? '',
      );
      const qualityResult: AiQualityCheckResult =
        lengthQualityResult ??
        (await this.aiGateway.checkTranslationFidelity({
          sourceContent: publicationContext.adaptationContent,
          translatedContent: currentContent ?? '',
          sourceLanguage: publicationContext.adaptationSourceLanguage,
          targetLanguage: publicationContext.targetLanguage,
          channel: publicationContext.channel,
          displayName: publicationContext.displayName,
          publicationType: publicationContext.publicationType,
          style: publicationContext.style,
          promptInstructions: publicationContext.promptInstructions,
          brandMemory: snapshot.brandMemory,
        }));

      lastQualityResult = qualityResult;

      this.logger.log(
        `Stage 2 attempt result: campaign=${snapshot.campaignId} plannedPublication=${publicationContext.plannedPublicationId} attempt=${attempt}/${MAX_STAGE_2_ATTEMPTS} quality=${qualityResult.outcome} reasons=${qualityResult.reasons.length}`,
      );

      const finalStatus = await this.persistQualityCheckOutcome(
        publicationContext,
        snapshot,
        currentVersionId,
        qualityResult,
        attempt,
      );

      if (finalStatus.status === 'ready') {
        return {
          plannedPublicationId: publicationContext.plannedPublicationId,
          translationId: publicationContext.translationId,
          translationVersionId: currentVersionId,
          attempts: attempt,
          status: 'ready',
          approvalItemId: null,
        };
      }

      if (finalStatus.status === 'stage_2_failed') {
        return {
          plannedPublicationId: publicationContext.plannedPublicationId,
          translationId: publicationContext.translationId,
          translationVersionId: currentVersionId,
          attempts: attempt,
          status: 'stage_2_failed',
          approvalItemId: finalStatus.approvalItemId,
        };
      }
    }

    throw new Error(
      `Stage 2 translation loop exceeded ${MAX_STAGE_2_ATTEMPTS} attempts for planned publication ${publicationContext.plannedPublicationId}`,
    );
  }

  private async persistRecoveredTranslationVersion(
    publicationContext: TranslationPublicationContext,
    content: string,
  ): Promise<TranslationVersion> {
    let version!: TranslationVersion;

    await this.transaction.run(async ({ translationRepository, translationVersionRepository }) => {
      const translation = await translationRepository.findById(
        publicationContext.translationId as never,
      );
      if (!translation) {
        throw new Error(`Translation ${publicationContext.translationId} not found`);
      }

      version = TranslationVersion.create({
        translationId: translation.id,
        content,
        kind: getRecoveryVersionKind(translation.status),
        meta: {
          recoveredFromExistingContent: true,
          plannedPublicationId: publicationContext.plannedPublicationId,
          sourceAdaptationVersionId: publicationContext.adaptationVersionId,
        },
      });

      await translationVersionRepository.save(version);
    });

    return version;
  }

  private async persistTranslationAttempt(
    publicationContext: TranslationPublicationContext,
    content: string,
    kind: 'generated' | 'ai_revision',
    previousVersionId: TranslationVersionId | null,
  ): Promise<TranslationVersion> {
    let version!: TranslationVersion;
    const events: DomainEvent[] = [];

    await this.transaction.run(async ({ translationRepository, translationVersionRepository }) => {
      const translation = await translationRepository.findById(
        publicationContext.translationId as never,
      );
      if (!translation) {
        throw new Error(`Translation ${publicationContext.translationId} not found`);
      }

      version = TranslationVersion.create({
        translationId: translation.id,
        content,
        kind,
        sourceVersionId: previousVersionId,
        meta: {
          plannedPublicationId: publicationContext.plannedPublicationId,
          sourceAdaptationVersionId: publicationContext.adaptationVersionId,
          channel: publicationContext.channel,
          publicationType: publicationContext.publicationType,
          style: publicationContext.style,
          targetLanguage: publicationContext.targetLanguage,
        },
      });

      await translationVersionRepository.save(version);

      if (kind === 'generated') {
        translation.markGenerated(content);
      } else {
        translation.edit(content);
      }

      await translationRepository.save(translation);
      events.push(...translation.pullEvents());
    });

    this.eventBus.publishAll(events);
    return version;
  }

  private async persistQualityCheckOutcome(
    publicationContext: TranslationPublicationContext,
    snapshot: Stage2Snapshot,
    translationVersionId: string | null,
    qualityResult: AiQualityCheckResult,
    attempt: number,
  ): Promise<
    | { status: 'retrying'; approvalItemId: null }
    | { status: 'ready'; approvalItemId: null }
    | { status: 'stage_2_failed'; approvalItemId: string }
  > {
    let outcome:
      | { status: 'retrying'; approvalItemId: null }
      | { status: 'ready'; approvalItemId: null }
      | { status: 'stage_2_failed'; approvalItemId: string } = {
      status: 'retrying',
      approvalItemId: null,
    };
    const events: DomainEvent[] = [];

    await this.transaction.run(
      async ({
        campaignRepository,
        plannedPublicationRepository,
        translationRepository,
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

        const translation = await translationRepository.findById(
          publicationContext.translationId as never,
        );
        if (!translation) {
          throw new Error(`Translation ${publicationContext.translationId} not found`);
        }

        const qualityCheckResult = QualityCheckResult.create({
          campaignId: campaign.id,
          plannedPublicationId: plannedPublication.id,
          artifactType: 'translation',
          artifactId: translation.id,
          artifactVersionId: translationVersionId,
          checkType: 'stage_2_translation_fidelity',
          result: qualityResult.outcome,
          attemptNumber: attempt,
          reasons: serializeReasons(qualityResult.reasons),
          suggestedFix: buildSuggestedFixPayload(qualityResult.suggestedFix),
          rawAiResult: qualityResult as unknown as Record<string, unknown>,
        });

        await qualityCheckResultRepository.save(qualityCheckResult);

        if (isSuccessfulQualityOutcome(qualityResult.outcome)) {
          ensureTranslationApproved(translation);
          plannedPublication.markReady();

          await translationRepository.save(translation);
          await plannedPublicationRepository.save(plannedPublication);
          events.push(...translation.pullEvents());
          outcome = {
            status: 'ready',
            approvalItemId: null,
          };
          return;
        }

        if (attempt < MAX_STAGE_2_ATTEMPTS) {
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
          artifactType: 'translation',
          artifactId: translation.id,
          type: 'translation_fidelity_exception',
          severity: getHighestSeverity(qualityResult.reasons),
          title: 'Stage 2 translation needs human review',
          details: {
            summary: qualityResult.summary,
            reasons: qualityResult.reasons,
            translationVersionId,
            attemptCount: attempt,
            targetLanguage: publicationContext.targetLanguage,
            channel: publicationContext.channel,
            publicationType: publicationContext.publicationType,
            style: publicationContext.style,
          },
          suggestedFix: buildSuggestedFixPayload(qualityResult.suggestedFix),
        });

        plannedPublication.markStage2Failed();
        campaign.markNeedsAttention();

        await approvalItemRepository.save(approvalItem);
        await plannedPublicationRepository.save(plannedPublication);
        await campaignRepository.save(campaign);
        events.push(...approvalItem.pullEvents());

        outcome = {
          status: 'stage_2_failed',
          approvalItemId: approvalItem.id,
        };
      },
    );

    this.eventBus.publishAll(events);
    return outcome;
  }
}
