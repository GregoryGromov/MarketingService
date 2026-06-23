import {
  CAMPAIGN_PRODUCTION_QUEUE,
  CAMPAIGN_SOURCE_CHECK_JOB,
  CAMPAIGN_STAGE_1_JOB,
  CAMPAIGN_STAGE_2_JOB,
  type CampaignProductionJobPayload,
  CampaignProductionJobPort,
  type EnqueuedCampaignProductionJob,
} from '@marketing-service/project-management';
import { Inject, Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type JobsOptions, Queue, type RedisOptions } from 'bullmq';

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
  private readonly logger = new Logger(CampaignProductionJobBullMqPort.name);
  private queue: Queue<CampaignProductionJobPayload> | null = null;
  private readonly redisUrl: string;

  constructor(@Inject(ConfigService) config: ConfigService) {
    super();
    this.redisUrl = config.getOrThrow<string>('REDIS_URL');
  }

  async onModuleDestroy(): Promise<void> {
    if (this.queue) {
      await this.queue.close();
      this.queue = null;
    }
  }

  async enqueueSourceCheck(
    payload: CampaignProductionJobPayload,
  ): Promise<EnqueuedCampaignProductionJob> {
    const job = await this.getQueue().add(CAMPAIGN_SOURCE_CHECK_JOB, payload, {
      jobId: payload.workflowRunId,
    });

    return { jobId: String(job.id) };
  }

  async enqueueStage1(
    payload: CampaignProductionJobPayload,
  ): Promise<EnqueuedCampaignProductionJob> {
    const job = await this.getQueue().add(CAMPAIGN_STAGE_1_JOB, payload, {
      jobId: payload.workflowRunId,
    });

    return { jobId: String(job.id) };
  }

  async enqueueStage2(
    payload: CampaignProductionJobPayload,
  ): Promise<EnqueuedCampaignProductionJob> {
    const job = await this.getQueue().add(CAMPAIGN_STAGE_2_JOB, payload, {
      jobId: payload.workflowRunId,
    });

    return { jobId: String(job.id) };
  }

  private getQueue(): Queue<CampaignProductionJobPayload> {
    if (!this.queue) {
      this.queue = new Queue<CampaignProductionJobPayload>(CAMPAIGN_PRODUCTION_QUEUE, {
        connection: buildRedisConnection(this.redisUrl),
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      });
      this.queue.on('error', (error) => {
        this.logger.error(error, `BullMQ queue ${CAMPAIGN_PRODUCTION_QUEUE} connection error`);
      });
    }

    return this.queue;
  }
}
