import {
  ApproveCampaignForPublishingCommand,
  CAMPAIGN_PRODUCTION_QUEUE,
  CAMPAIGN_SOURCE_CHECK_JOB,
  CAMPAIGN_STAGE_1_JOB,
  CAMPAIGN_STAGE_2_JOB,
  type CampaignProductionJobPayload,
  RunCampaignStage1Command,
  RunCampaignStage1Executor,
  RunCampaignStage2Command,
  RunCampaignStage2Executor,
  StartCampaignProductionExecutor,
} from '@marketing-service/project-management';
import {
  Inject,
  Injectable,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandBus } from '@nestjs/cqrs';
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
    @Inject(CommandBus)
    private readonly commandBus: CommandBus,
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
        await this.processSourceCheck(job.data);
        return;
      case CAMPAIGN_STAGE_1_JOB:
        await this.processStage1(job.data);
        return;
      case CAMPAIGN_STAGE_2_JOB:
        await this.processStage2(job.data);
        return;
      default:
        throw new Error(`Unsupported campaign production job: ${job.name}`);
    }
  }

  private async processSourceCheck(payload: CampaignProductionJobPayload): Promise<void> {
    const result = await this.sourceCheckExecutor.execute(
      payload.campaignId,
      payload.workflowRunId,
    );

    if (result.outcome !== 'passed') {
      this.logger.log(
        `Campaign ${payload.campaignId} paused after source check: outcome=${result.outcome}`,
      );
      return;
    }

    await this.commandBus.execute(new RunCampaignStage1Command(payload.campaignId as never));
  }

  private async processStage1(payload: CampaignProductionJobPayload): Promise<void> {
    const result = await this.stage1Executor.execute(
      payload.campaignId,
      payload.workflowRunId,
    );

    if (result.outcome !== 'completed') {
      this.logger.log(
        `Campaign ${payload.campaignId} paused after Stage 1: outcome=${result.outcome}`,
      );
      return;
    }

    const needsStage2 = result.items.some((item) => item.status === 'translating');
    if (needsStage2) {
      await this.commandBus.execute(new RunCampaignStage2Command(payload.campaignId as never));
      return;
    }

    await this.commandBus.execute(
      new ApproveCampaignForPublishingCommand(payload.campaignId as never),
    );
  }

  private async processStage2(payload: CampaignProductionJobPayload): Promise<void> {
    const result = await this.stage2Executor.execute(
      payload.campaignId,
      payload.workflowRunId,
    );

    if (result.outcome !== 'completed') {
      this.logger.log(
        `Campaign ${payload.campaignId} paused after Stage 2: outcome=${result.outcome}`,
      );
      return;
    }

    await this.commandBus.execute(
      new ApproveCampaignForPublishingCommand(payload.campaignId as never),
    );
  }
}
