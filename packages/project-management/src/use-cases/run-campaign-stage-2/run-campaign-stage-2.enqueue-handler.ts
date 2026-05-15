import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, type ICommandHandler } from '@nestjs/cqrs';
import { WorkflowRun } from '../../domain/workflow-run.aggregate.js';
import { CampaignFlowTransactionPort } from '../../ports/campaign-flow-transaction.port.js';
import { CampaignProductionJobPort } from '../../ports/campaign-production-job.port.js';
import { RunCampaignStage2Command } from './run-campaign-stage-2.command.js';

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

export interface RunCampaignStage2QueuedResult {
  workflowRunId: string;
  jobId: string;
  campaignId: string;
  translatingPublicationCount: number;
  status: 'queued';
}

@CommandHandler(RunCampaignStage2Command)
export class RunCampaignStage2Handler
  implements ICommandHandler<RunCampaignStage2Command, RunCampaignStage2QueuedResult>
{
  constructor(
    @Inject(CampaignFlowTransactionPort)
    private readonly transaction: CampaignFlowTransactionPort,
    @Inject(CampaignProductionJobPort)
    private readonly jobs: CampaignProductionJobPort,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: RunCampaignStage2Command): Promise<RunCampaignStage2QueuedResult> {
    let workflowRun!: WorkflowRun;
    let translatingPublicationCount = 0;

    await this.transaction.run(
      async ({
        campaignRepository,
        plannedPublicationRepository,
        workflowRunRepository,
      }) => {
        const campaign = await campaignRepository.findById(command.campaignId as never);
        if (!campaign) {
          throw new Error(`Campaign ${command.campaignId} not found`);
        }

        if (TERMINAL_CAMPAIGN_STATUSES.has(campaign.status)) {
          throw new Error(
            `Campaign ${command.campaignId} is not ready for Stage 2 from status "${campaign.status}"`,
          );
        }

        const activeRun = await workflowRunRepository.findActiveByCampaignId(campaign.id);
        if (activeRun) {
          throw new Error(`Campaign ${command.campaignId} already has an active workflow run`);
        }

        const translatingPublications = (
          await plannedPublicationRepository.findByCampaignIdAndStatus(campaign.id, 'translating')
        ).sort((left, right) => left.scheduledFor.getTime() - right.scheduledFor.getTime());

        if (translatingPublications.length === 0) {
          throw new Error(`Campaign ${command.campaignId} has no planned publications waiting for Stage 2`);
        }

        translatingPublicationCount = translatingPublications.length;
        workflowRun = WorkflowRun.create({
          campaignId: campaign.id,
          currentStep: 'stage_2_translation',
        });

        await workflowRunRepository.save(workflowRun);
      },
    );

    this.eventBus.publishAll(workflowRun.pullEvents());

    try {
      const job = await this.jobs.enqueueStage2({
        campaignId: command.campaignId,
        workflowRunId: workflowRun.id,
      });

      return {
        workflowRunId: workflowRun.id,
        jobId: job.jobId,
        campaignId: command.campaignId,
        translatingPublicationCount,
        status: 'queued',
      };
    } catch (error) {
      await this.transaction.run(async ({ workflowRunRepository }) => {
        const persistedWorkflowRun = await workflowRunRepository.findById(workflowRun.id);
        if (persistedWorkflowRun && persistedWorkflowRun.status === 'running') {
          persistedWorkflowRun.fail(
            error instanceof Error
              ? error.message
              : 'Campaign Stage 2 could not be enqueued',
          );
          await workflowRunRepository.save(persistedWorkflowRun);
        }
      });

      throw error;
    }
  }
}
