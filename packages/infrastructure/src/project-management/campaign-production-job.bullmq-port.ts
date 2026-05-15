import {
  CAMPAIGN_PRODUCTION_QUEUE,
  CAMPAIGN_SOURCE_CHECK_JOB,
  CAMPAIGN_STAGE_1_JOB,
  CAMPAIGN_STAGE_2_JOB,
  CampaignProductionJobPort,
  type CampaignProductionJobPayload,
  type EnqueuedCampaignProductionJob,
} from '@marketing-service/project-management';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, type JobsOptions, type RedisOptions } from 'bullmq';

function buildRedisConnection(redisUrl: string): RedisOptions {
  const parsed = new URL(redisUrl);
  const database = parsed.pathname ? Number.parseInt(parsed.pathname.slice(1) || '0', 10) : 0;

  return {
    host: parsed.hostname,
    port: parsed.port ? Number.parseInt(parsed.port, 10) : 6379,
    username: parsed.username || undefined,
    password: parsed.password || undefined,
    db: Number.isNaN(database) ? 0 : database,
    tls: parsed.protocol === 'rediss:' ? {} : undefined,
    maxRetriesPerRequest: null,
  };
}

const DEFAULT_JOB_OPTIONS: JobsOptions = {
  removeOnComplete: 100,
  removeOnFail: 500,
  attempts: 1,
};

@Injectable()
export class CampaignProductionJobBullMqPort
  extends CampaignProductionJobPort
  implements OnModuleDestroy
{
  private readonly queue: Queue<CampaignProductionJobPayload>;

  constructor(config: ConfigService) {
    super();

    this.queue = new Queue<CampaignProductionJobPayload>(CAMPAIGN_PRODUCTION_QUEUE, {
      connection: buildRedisConnection(config.getOrThrow<string>('REDIS_URL')),
      defaultJobOptions: DEFAULT_JOB_OPTIONS,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue.close();
  }

  async enqueueSourceCheck(
    payload: CampaignProductionJobPayload,
  ): Promise<EnqueuedCampaignProductionJob> {
    const job = await this.queue.add(CAMPAIGN_SOURCE_CHECK_JOB, payload, {
      jobId: payload.workflowRunId,
    });

    return { jobId: String(job.id) };
  }

  async enqueueStage1(
    payload: CampaignProductionJobPayload,
  ): Promise<EnqueuedCampaignProductionJob> {
    const job = await this.queue.add(CAMPAIGN_STAGE_1_JOB, payload, {
      jobId: payload.workflowRunId,
    });

    return { jobId: String(job.id) };
  }

  async enqueueStage2(
    payload: CampaignProductionJobPayload,
  ): Promise<EnqueuedCampaignProductionJob> {
    const job = await this.queue.add(CAMPAIGN_STAGE_2_JOB, payload, {
      jobId: payload.workflowRunId,
    });

    return { jobId: String(job.id) };
  }
}
