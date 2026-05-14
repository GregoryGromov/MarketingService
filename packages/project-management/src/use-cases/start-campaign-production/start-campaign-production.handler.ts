import { Inject } from '@nestjs/common';
import type { BrandMemory } from '../../domain/project.aggregate.js';
import type { ArticleSourceVersion } from '@marketing-service/editorial';
import { CommandHandler, EventBus, type ICommandHandler } from '@nestjs/cqrs';
import {
  AiGatewayPort,
  type AiGatewayReason,
  type AiGatewaySeverity,
  type ValidateSourceLongreadResult,
} from '../../ports/ai-gateway.port.js';
import { ApprovalItem } from '../../domain/approval-item.aggregate.js';
import { Campaign } from '../../domain/campaign.aggregate.js';
import { QualityCheckResult } from '../../domain/quality-check-result.entity.js';
import { WorkflowRun } from '../../domain/workflow-run.aggregate.js';
import { CampaignFlowTransactionPort } from '../../ports/campaign-flow-transaction.port.js';
import { StartCampaignProductionCommand } from './start-campaign-production.command.js';

export interface StartCampaignProductionResult {
  workflowRunId: string;
  qualityCheckResultId: string;
  outcome: 'passed' | 'needs_review' | 'blocked';
  approvalItemId: string | null;
}

const SEVERITY_RANK: Record<AiGatewaySeverity, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

function getLatestSourceVersion(versions: ArticleSourceVersion[]): ArticleSourceVersion | null {
  return [...versions].sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime()).at(-1) ?? null;
}

function mapSourceOutcomeToQualityResult(
  outcome: ValidateSourceLongreadResult['outcome'],
): 'passed' | 'failed' | 'blocked' {
  switch (outcome) {
    case 'passed':
      return 'passed';
    case 'blocked':
      return 'blocked';
    case 'needs_review':
    default:
      return 'failed';
  }
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

function buildSuggestedFixPayload(result: ValidateSourceLongreadResult): Record<string, unknown> | null {
  if (!result.suggestedFix) {
    return null;
  }

  return {
    summary: result.suggestedFix.summary,
    instructions: result.suggestedFix.instructions,
  };
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

interface SourceValidationSnapshot {
  campaignId: string;
  articleId: string;
  sourceVersionId: string;
  sourceContent: string;
  sourceLanguage: string;
  extraInstructions: string | null;
  brandMemory: BrandMemory;
}

@CommandHandler(StartCampaignProductionCommand)
export class StartCampaignProductionHandler
  implements ICommandHandler<StartCampaignProductionCommand, StartCampaignProductionResult>
{
  constructor(
    @Inject(CampaignFlowTransactionPort)
    private readonly transaction: CampaignFlowTransactionPort,
    @Inject(AiGatewayPort)
    private readonly aiGateway: AiGatewayPort,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: StartCampaignProductionCommand): Promise<StartCampaignProductionResult> {
    let workflowRun!: WorkflowRun;
    let snapshot!: SourceValidationSnapshot;

    await this.transaction.run(
      async ({
        campaignRepository,
        projectRepository,
        articleRepository,
        articleSourceVersionRepository,
        workflowRunRepository,
      }) => {
        const campaign = await campaignRepository.findById(command.campaignId as never);
        if (!campaign) {
          throw new Error(`Campaign ${command.campaignId} not found`);
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

        workflowRun = WorkflowRun.create({
          campaignId: campaign.id,
          currentStep: 'source_check',
        });

        campaign.markSourceChecking();
        await campaignRepository.save(campaign);
        await workflowRunRepository.save(workflowRun);

        snapshot = {
          campaignId: campaign.id,
          articleId: article.id,
          sourceVersionId: sourceVersion.id,
          sourceContent: sourceVersion.content,
          sourceLanguage: sourceVersion.language,
          extraInstructions: campaign.extraInstructions,
          brandMemory: project.brandMemory,
        };
      },
    );

    this.eventBus.publishAll(workflowRun.pullEvents());

    try {
      const validationResult = await this.aiGateway.validateSourceLongread({
        sourceContent: snapshot.sourceContent,
        sourceLanguage: snapshot.sourceLanguage,
        brandMemory: snapshot.brandMemory,
        extraInstructions: snapshot.extraInstructions,
      });

      let campaignAfterCheck: Campaign | null = null;
      let qualityCheckResult: QualityCheckResult | null = null;
      let approvalItem: ApprovalItem | null = null;

      await this.transaction.run(
        async ({
          campaignRepository,
          plannedPublicationRepository,
          workflowRunRepository,
          qualityCheckResultRepository,
          approvalItemRepository,
        }) => {
          const campaign = await campaignRepository.findById(snapshot.campaignId as never);
          if (!campaign) {
            throw new Error(`Campaign ${snapshot.campaignId} not found`);
          }

          const persistedWorkflowRun = await workflowRunRepository.findById(workflowRun.id);
          if (!persistedWorkflowRun) {
            throw new Error(`Workflow run ${workflowRun.id} not found`);
          }

          qualityCheckResult = QualityCheckResult.create({
            campaignId: campaign.id,
            artifactType: 'article',
            artifactId: snapshot.articleId,
            artifactVersionId: snapshot.sourceVersionId,
            checkType: 'source_guideline_check',
            result: mapSourceOutcomeToQualityResult(validationResult.outcome),
            reasons: serializeReasons(validationResult.reasons),
            suggestedFix: buildSuggestedFixPayload(validationResult),
            rawAiResult: validationResult as unknown as Record<string, unknown>,
          });

          await qualityCheckResultRepository.save(qualityCheckResult);

          if (validationResult.outcome === 'passed') {
            campaign.markProducing();
            persistedWorkflowRun.complete();
            await campaignRepository.save(campaign);
            await workflowRunRepository.save(persistedWorkflowRun);
            campaignAfterCheck = campaign;
            return;
          }

          const plannedPublications = await plannedPublicationRepository.findByCampaignId(campaign.id);
          plannedPublications.forEach((plannedPublication) => plannedPublication.markSourceBlocked());

          approvalItem = ApprovalItem.create({
            projectId: campaign.projectId,
            campaignId: campaign.id,
            artifactType: 'article',
            artifactId: snapshot.articleId,
            type: 'source_issue',
            severity: getHighestSeverity(validationResult.reasons),
            title:
              validationResult.outcome === 'blocked'
                ? 'Source blocked before production'
                : 'Source needs review before production',
            details: {
              summary: validationResult.summary,
              reasons: validationResult.reasons,
              sourceVersionId: snapshot.sourceVersionId,
              sourceLanguage: snapshot.sourceLanguage,
            },
            suggestedFix: buildSuggestedFixPayload(validationResult),
          });

          if (validationResult.outcome === 'blocked') {
            campaign.markNeedsAttention();
            persistedWorkflowRun.fail('Source blocked');
          } else {
            campaign.markSourceNeedsReview();
            persistedWorkflowRun.fail('Source review required');
          }

          await plannedPublicationRepository.saveMany(plannedPublications);
          await approvalItemRepository.save(approvalItem);
          await campaignRepository.save(campaign);
          await workflowRunRepository.save(persistedWorkflowRun);
          campaignAfterCheck = campaign;
        },
      );

      if (!qualityCheckResult || !campaignAfterCheck) {
        throw new Error('Source validation result was not persisted');
      }
      const persistedQualityCheckResult = qualityCheckResult as QualityCheckResult;
      const finalizedCampaign = campaignAfterCheck as Campaign;
      const persistedApprovalItem = approvalItem as ApprovalItem | null;

      if (persistedApprovalItem) {
        this.eventBus.publishAll(persistedApprovalItem.pullEvents());
      }
      this.eventBus.publishAll(finalizedCampaign.pullEvents());

      return {
        workflowRunId: workflowRun.id,
        qualityCheckResultId: persistedQualityCheckResult.id,
        outcome: validationResult.outcome,
        approvalItemId: persistedApprovalItem?.id ?? null,
      };
    } catch (error) {
      await this.transaction.run(async ({ campaignRepository, workflowRunRepository }) => {
        const campaign = await campaignRepository.findById(command.campaignId as never);
        const persistedWorkflowRun = await workflowRunRepository.findById(workflowRun.id);

        if (campaign) {
          campaign.markNeedsAttention();
          await campaignRepository.save(campaign);
        }

        if (persistedWorkflowRun) {
          persistedWorkflowRun.fail(
            error instanceof Error ? error.message : 'Source validation failed',
          );
          await workflowRunRepository.save(persistedWorkflowRun);
        }
      });

      throw error;
    }
  }
}
