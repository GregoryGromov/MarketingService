import type { CampaignId } from './campaign.aggregate.js';
import type { WorkflowRun, WorkflowRunId } from './workflow-run.aggregate.js';

export abstract class WorkflowRunRepository {
  abstract findById(id: WorkflowRunId): Promise<WorkflowRun | null>;
  abstract findByCampaignId(campaignId: CampaignId): Promise<WorkflowRun[]>;
  abstract findActiveByCampaignId(campaignId: CampaignId): Promise<WorkflowRun | null>;
  abstract save(workflowRun: WorkflowRun): Promise<void>;
}
