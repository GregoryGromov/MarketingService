import type {
  AdaptationVersionId,
  ArticleSourceVersion,
  ChannelId,
} from '@marketing-service/editorial';
import { AdaptationVersion, ChannelAdaptation } from '@marketing-service/editorial';
import type { DomainEvent } from '@marketing-service/shared';
import { EventBus } from '@nestjs/cqrs';
import { Inject, Injectable, Logger } from '@nestjs/common';
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

const MAX_STAGE_1_ATTEMPTS = 5;
const X_PUBLISHING_CHARACTER_TARGET = 260;
const TELEGRAM_IMAGE_CAPTION_CHARACTER_TARGET = 900;
const DISCORD_WEBHOOK_CHARACTER_TARGET = 1800;
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
  return (
    [...versions]
      .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime())
      .at(-1) ?? null
  );
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

function buildDefaultChannelRules(channel: string): string[] {
  switch (channel) {
    case 'channel_telegram':
      return [
        'Keep the tone concise, clear, and strong.',
        'Prefer short paragraphs.',
        'Use Telegram HTML tags for formatting when emphasis is needed, for example <b>important phrase</b>.',
        'Do not use Markdown formatting such as **bold** because Telegram will not render it in HTML parse mode.',
        'Keep the final text under 900 characters so it can be used safely as a Telegram image caption.',
        'Do not use hashtags.',
        'Do not use emojis unless absolutely necessary.',
      ];
    case 'channel_x':
      return [
        'Keep the text sharp, compact, and highly readable.',
        'Keep the final text under 260 characters so it can be published through the standard X API.',
        'Produce one standalone post only; do not create multiple posts unless thread publishing is explicitly implemented.',
        'Do not use hashtags.',
        'Do not use emojis.',
      ];
    case 'channel_discord':
      return [
        'Keep the text simple and immediately understandable.',
        'Prefer plain words and short phrasing.',
        'Keep the final text under 1800 characters so it fits Discord webhook content limits.',
        'Do not use hashtags.',
        'Do not use emojis.',
      ];
    case 'channel_blog':
      return [
        'Keep the tone informative and readable.',
        'Prefer 2 to 4 short paragraphs.',
        'Do not use hashtags.',
        'Do not use emojis.',
      ];
    default:
      return [];
  }
}

function getProjectChannelRule(brandMemory: BrandMemory, channel: string): string | null {
  switch (channel) {
    case 'channel_telegram':
      return brandMemory.adaptationPromptRules.telegram;
    case 'channel_x':
      return brandMemory.adaptationPromptRules.x;
    case 'channel_discord':
      return brandMemory.adaptationPromptRules.discord;
    case 'channel_blog':
      return brandMemory.adaptationPromptRules.blog;
    default:
      return null;
  }
}

function buildPromptInstructions(
  plannedPublication: PlannedPublication,
  brandMemory: BrandMemory,
): string | null {
  const defaultRules = buildDefaultChannelRules(plannedPublication.channel);
  const projectGeneralRules = brandMemory.adaptationPromptRules.generalInstructions?.trim() || null;
  const projectChannelRules =
    getProjectChannelRule(brandMemory, plannedPublication.channel)?.trim() || null;
  const instructions: string[] = [];

  if (defaultRules.length > 0) {
    instructions.push(
      ['Default channel rules:', ...defaultRules.map((rule) => `- ${rule}`)].join('\n'),
    );
  }

  instructions.push(
    [
      'Publication requirements:',
      `- Publication type: ${plannedPublication.publicationType}.`,
      `- Style: ${plannedPublication.style}.`,
    ].join('\n'),
  );

  if (plannedPublication.notes) {
    instructions.push(`Publication notes:\n- ${plannedPublication.notes}`);
  }

  if (projectGeneralRules) {
    instructions.push(`Project-wide adaptation rules:\n${projectGeneralRules}`);
  }

  if (projectChannelRules) {
    instructions.push(
      `Project rules for ${getChannelLabel(plannedPublication.channel)}:\n${projectChannelRules}`,
    );
  }

  return instructions.length > 0 ? instructions.join('\n\n') : null;
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
    summary: `${label} adaptation is too long for publishing (${length} characters).`,
    reasons: [
      {
        code: reasonCode,
        severity: 'high',
        message: `${label} post must be under ${limit} characters, but the generated adaptation is ${length} characters.`,
        excerpt: content,
        suggestion: `Rewrite as one standalone ${label} post under ${limit} characters.`,
      },
    ],
    suggestedFix: {
      summary: `Shorten the ${label} post to under ${limit} characters.`,
      instructions: [
        `Return one standalone ${label} post under ${limit} characters, including spaces.`,
        'Preserve only the central idea and remove secondary details.',
        'Do not create a thread or multiple variants.',
      ],
    },
  };
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

@Injectable()
export class RunCampaignStage1Executor {
  private readonly logger = new Logger(RunCampaignStage1Executor.name);

  constructor(
    @Inject(CampaignFlowTransactionPort)
    private readonly transaction: CampaignFlowTransactionPort,
    @Inject(AiGatewayPort)
    private readonly aiGateway: AiGatewayPort,
    private readonly eventBus: EventBus,
  ) {}

  async execute(campaignId: string, workflowRunId: string): Promise<RunCampaignStage1Result> {
    let snapshot!: Stage1Snapshot;
    let inProgressPlannedPublicationId: string | null = null;

    this.logger.log(`Stage 1 started: campaign=${campaignId} workflowRun=${workflowRunId}`);

    try {
      await this.transaction.run(
        async ({
          campaignRepository,
          plannedPublicationRepository,
          projectRepository,
          articleRepository,
          articleSourceVersionRepository,
          workflowRunRepository,
        }) => {
          const campaign = await campaignRepository.findById(campaignId as never);
          if (!campaign) {
            throw new Error(`Campaign ${campaignId} not found`);
          }

          if (TERMINAL_CAMPAIGN_STATUSES.has(campaign.status)) {
            throw new Error(
              `Campaign ${campaignId} is not ready for Stage 1 from status "${campaign.status}"`,
            );
          }

          if (!campaign.sourceArticleId) {
            throw new Error(`Campaign ${campaignId} has no attached source article`);
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
            throw new Error(`Campaign ${campaignId} has no pending planned publications`);
          }

          snapshot = {
            campaignId: campaign.id,
            articleId: article.id,
            sourceVersionId: sourceVersion.id,
            sourceContent: sourceVersion.content,
            sourceLanguage: sourceVersion.language,
            extraInstructions: campaign.extraInstructions,
            brandMemory: project.brandMemory,
            plannedPublicationIds: pendingPublications.map(
              (plannedPublication) => plannedPublication.id,
            ),
          };
        },
      );

      const items: RunCampaignStage1ItemResult[] = [];

      for (const plannedPublicationId of snapshot.plannedPublicationIds) {
        inProgressPlannedPublicationId = plannedPublicationId;
        const publicationContext = await this.preparePlannedPublication(
          plannedPublicationId,
          snapshot,
        );
        this.logger.log(
          `Stage 1 publication started: campaign=${snapshot.campaignId} workflowRun=${workflowRunId} plannedPublication=${publicationContext.plannedPublicationId} channel=${publicationContext.channel} language=${publicationContext.language} type=${publicationContext.publicationType} style=${publicationContext.style}`,
        );
        const itemResult = await this.runQualityLoop(publicationContext, snapshot);
        items.push(itemResult);
        this.logger.log(
          `Stage 1 publication completed: campaign=${snapshot.campaignId} workflowRun=${workflowRunId} plannedPublication=${itemResult.plannedPublicationId} status=${itemResult.status} attempts=${itemResult.attempts} approvalItem=${itemResult.approvalItemId ?? 'none'}`,
        );
        inProgressPlannedPublicationId = null;
      }

      let outcome: RunCampaignStage1Result['outcome'] = 'completed';

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

      this.logger.log(
        `Stage 1 completed: campaign=${snapshot.campaignId} workflowRun=${workflowRunId} outcome=${outcome} publications=${items.length} ready=${items.filter((item) => item.status === 'ready').length} translating=${items.filter((item) => item.status === 'translating').length} failed=${items.filter((item) => item.status === 'stage_1_failed').length}`,
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

      this.logger.error(
        error instanceof Error ? error.message : String(error),
        `Stage 1 failed: campaign=${campaignId} workflowRun=${workflowRunId} plannedPublication=${inProgressPlannedPublicationId ?? 'none'}`,
      );
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
            artifact.artifactType === 'adaptation' &&
            artifact.role === STAGE_1_BASE_ADAPTATION_ROLE,
        );
        let adaptation: ChannelAdaptation | null = null;

        if (adaptationArtifact) {
          adaptation = await channelAdaptationRepository.findById(
            adaptationArtifact.artifactId as never,
          );
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
            promptInstructions: buildPromptInstructions(plannedPublication, snapshot.brandMemory),
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
      let aiResult: { content: string };

      if (attempt === 1) {
        aiResult = await this.aiGateway.generateAdaptation({
          sourceContent: snapshot.sourceContent,
          sourceLanguage: snapshot.sourceLanguage,
          channel: publicationContext.channel,
          displayName: publicationContext.displayName,
          publicationType: publicationContext.publicationType,
          style: publicationContext.style,
          promptInstructions: publicationContext.promptInstructions,
          brandMemory: snapshot.brandMemory,
          extraInstructions: snapshot.extraInstructions,
        });
      } else {
        const previousQualityResult = lastQualityResult;
        if (!previousQualityResult) {
          throw new Error('Cannot revise adaptation without a previous quality result');
        }

        aiResult = await this.aiGateway.reviseAdaptation({
          currentContent: currentContent ?? '',
          sourceLanguage: snapshot.sourceLanguage,
          channel: publicationContext.channel,
          displayName: publicationContext.displayName,
          publicationType: publicationContext.publicationType,
          style: publicationContext.style,
          promptInstructions: publicationContext.promptInstructions,
          instruction: buildRevisionInstruction(publicationContext, previousQualityResult),
          sourceContent: snapshot.sourceContent,
          brandMemory: snapshot.brandMemory,
          qualityReasons: previousQualityResult.reasons,
          suggestedFix: previousQualityResult.suggestedFix,
        });
      }

      const persistedVersion = await this.persistAdaptationAttempt(
        publicationContext,
        aiResult.content,
        attempt,
        currentSelectedVersionId,
        snapshot.sourceVersionId,
      );

      currentContent = aiResult.content;
      currentSelectedVersionId = persistedVersion.id as AdaptationVersionId;

      const lengthQualityResult = buildPublicationLengthQualityResult(
        publicationContext.channel,
        aiResult.content,
      );
      const qualityResult: AiQualityCheckResult =
        lengthQualityResult ??
        (await this.aiGateway.checkAdaptationQuality({
          sourceContent: snapshot.sourceContent,
          adaptationContent: aiResult.content,
          sourceLanguage: snapshot.sourceLanguage,
          channel: publicationContext.channel,
          displayName: publicationContext.displayName,
          publicationType: publicationContext.publicationType,
          style: publicationContext.style,
          promptInstructions: publicationContext.promptInstructions,
          brandMemory: snapshot.brandMemory,
        }));

      lastQualityResult = qualityResult;

      this.logger.log(
        `Stage 1 attempt result: campaign=${snapshot.campaignId} plannedPublication=${publicationContext.plannedPublicationId} attempt=${attempt}/${MAX_STAGE_1_ATTEMPTS} quality=${qualityResult.outcome} reasons=${qualityResult.reasons.length}`,
      );

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
