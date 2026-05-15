export const CAMPAIGN_PRODUCTION_QUEUE = 'campaign-production';
export const CAMPAIGN_SOURCE_CHECK_JOB = 'campaign.source-check';
export const CAMPAIGN_STAGE_1_JOB = 'campaign.stage-1';
export const CAMPAIGN_STAGE_2_JOB = 'campaign.stage-2';

export interface CampaignProductionJobPayload {
  campaignId: string;
  workflowRunId: string;
}

export interface EnqueuedCampaignProductionJob {
  jobId: string;
}

export abstract class CampaignProductionJobPort {
  abstract enqueueSourceCheck(
    payload: CampaignProductionJobPayload,
  ): Promise<EnqueuedCampaignProductionJob>;

  abstract enqueueStage1(
    payload: CampaignProductionJobPayload,
  ): Promise<EnqueuedCampaignProductionJob>;

  abstract enqueueStage2(
    payload: CampaignProductionJobPayload,
  ): Promise<EnqueuedCampaignProductionJob>;
}
