import type { ArticleSourceVersion } from '@marketing-service/editorial';
import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, type ICommandHandler } from '@nestjs/cqrs';
import { WorkflowRun } from '../../domain/workflow-run.aggregate.js';
import { CampaignFlowTransactionPort } from '../../ports/campaign-flow-transaction.port.js';
import { CampaignProductionJobPort } from '../../ports/campaign-production-job.port.js';
import { RunCampaignStage1Command } from './run-campaign-stage-1.command.js';

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

function getLatestSourceVersion(versions: ArticleSourceVersion[]): ArticleSourceVersion | null {
  return [...versions].sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime()).at(-1) ?? null;
}

export interface RunCampaignStage1QueuedResult {
  workflowRunId: string;
  jobId: string;
  campaignId: string;
  pendingPublicationCount: number;
  status: 'queued';
}

@CommandHandler(RunCampaignStage1Command)
export class RunCampaignStage1Handler
  implements ICommandHandler<RunCampaignStage1Command, RunCampaignStage1QueuedResult>
{
  constructor(
    @Inject(CampaignFlowTransactionPort)
    private readonly transaction: CampaignFlowTransactionPort,
    @Inject(CampaignProductionJobPort)
    private readonly jobs: CampaignProductionJobPort,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: RunCampaignStage1Command): Promise<RunCampaignStage1QueuedResult> {
    let workflowRun!: WorkflowRun;
    let pendingPublicationCount = 0;

    await this.transaction.run(
      async ({
        campaignRepository,
        plannedPublicationRepository,
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

        pendingPublicationCount = pendingPublications.length;
        workflowRun = WorkflowRun.create({
          campaignId: campaign.id,
          currentStep: 'stage_1_adaptation',
        });

        await workflowRunRepository.save(workflowRun);
      },
    );

    this.eventBus.publishAll(workflowRun.pullEvents());

    try {
      const job = await this.jobs.enqueueStage1({
        campaignId: command.campaignId,
        workflowRunId: workflowRun.id,
      });

      return {
        workflowRunId: workflowRun.id,
        jobId: job.jobId,
        campaignId: command.campaignId,
        pendingPublicationCount,
        status: 'queued',
      };
    } catch (error) {
      await this.transaction.run(async ({ workflowRunRepository }) => {
        const persistedWorkflowRun = await workflowRunRepository.findById(workflowRun.id);
        if (persistedWorkflowRun && persistedWorkflowRun.status === 'running') {
          persistedWorkflowRun.fail(
            error instanceof Error
              ? error.message
              : 'Campaign Stage 1 could not be enqueued',
          );
          await workflowRunRepository.save(persistedWorkflowRun);
        }
      });

      throw error;
    }
  }
}
