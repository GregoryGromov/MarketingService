import {
  CAMPAIGN_PRODUCTION_QUEUE,
  CAMPAIGN_SOURCE_CHECK_JOB,
  CAMPAIGN_STAGE_1_JOB,
  CAMPAIGN_STAGE_2_JOB,
  type CampaignProductionJobPayload,
  RunCampaignStage1Executor,
  RunCampaignStage2Executor,
  StartCampaignProductionExecutor,
} from '@marketing-service/project-management';
import { Injectable, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Worker, type RedisOptions } from 'bullmq';
import { Logger } from 'nestjs-pino';

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

@Injectable()
export class CampaignProductionWorker
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private worker: Worker<CampaignProductionJobPayload> | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly logger: Logger,
    private readonly sourceCheckExecutor: StartCampaignProductionExecutor,
    private readonly stage1Executor: RunCampaignStage1Executor,
    private readonly stage2Executor: RunCampaignStage2Executor,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (this.worker) {
      return;
    }

    this.worker = new Worker<CampaignProductionJobPayload>(
      CAMPAIGN_PRODUCTION_QUEUE,
      async (job) => this.processJob(job),
      {
        connection: buildRedisConnection(this.config.getOrThrow<string>('REDIS_URL')),
        concurrency: 1,
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.log(
        `Campaign production job ${job.name} completed for campaign ${job.data.campaignId}`,
      );
    });
    this.worker.on('failed', (job, error) => {
      this.logger.error(
        error,
        `Campaign production job ${job?.name ?? 'unknown'} failed for campaign ${job?.data?.campaignId ?? 'unknown'}`,
      );
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
    }
  }

  private async processJob(job: Job<CampaignProductionJobPayload>): Promise<void> {
    switch (job.name) {
      case CAMPAIGN_SOURCE_CHECK_JOB:
        await this.sourceCheckExecutor.execute(job.data.campaignId, job.data.workflowRunId);
        return;
      case CAMPAIGN_STAGE_1_JOB:
        await this.stage1Executor.execute(job.data.campaignId, job.data.workflowRunId);
        return;
      case CAMPAIGN_STAGE_2_JOB:
        await this.stage2Executor.execute(job.data.campaignId, job.data.workflowRunId);
        return;
      default:
        throw new Error(`Unsupported campaign production job: ${job.name}`);
    }
  }
}
