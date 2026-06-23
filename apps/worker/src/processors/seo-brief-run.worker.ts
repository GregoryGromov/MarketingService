import {
  PROCESS_SEO_BRIEF_RUN_JOB,
  ProcessSeoBriefRunExecutor,
  SEO_BRIEF_RUN_QUEUE,
  type SeoBriefRunJobPayload,
} from '@marketing-service/seo-briefing';
import {
  Inject,
  Injectable,
  type OnApplicationBootstrap,
  type OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type Job, Worker } from 'bullmq';
import { Logger } from 'nestjs-pino';
import {
  createThrottledConnectionErrorLogger,
  waitForRedisReady,
} from './redis-worker-connection.js';

@Injectable()
export class SeoBriefRunWorker implements OnApplicationBootstrap, OnModuleDestroy {
  private worker: Worker<SeoBriefRunJobPayload> | null = null;

  constructor(
    @Inject(ConfigService)
    private readonly config: ConfigService,
    @Inject(Logger)
    private readonly logger: Logger,
    @Inject(ProcessSeoBriefRunExecutor)
    private readonly executor: ProcessSeoBriefRunExecutor,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (this.worker) {
      return;
    }

    const redisUrl = this.config.getOrThrow<string>('REDIS_URL');
    const connection = await waitForRedisReady(redisUrl, SEO_BRIEF_RUN_QUEUE, this.logger);
    this.worker = new Worker<SeoBriefRunJobPayload>(
      SEO_BRIEF_RUN_QUEUE,
      async (job) => this.processJob(job),
      {
        connection,
        concurrency: 1,
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.log(`SEO brief job ${job.name} completed for run ${job.data.runId}`);
    });
    this.worker.on('failed', (job, error) => {
      this.logger.error(
        error,
        `SEO brief job ${job?.name ?? 'unknown'} failed for run ${job?.data?.runId ?? 'unknown'}`,
      );
    });
    this.worker.on('error', createThrottledConnectionErrorLogger(SEO_BRIEF_RUN_QUEUE, this.logger));
  }

  async onModuleDestroy(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
    }
  }

  private async processJob(job: Job<SeoBriefRunJobPayload>): Promise<void> {
    switch (job.name) {
      case PROCESS_SEO_BRIEF_RUN_JOB:
        await this.executor.execute(job.data.runId, {
          startStage: job.data.startStage,
          stopAfterStage: job.data.stopAfterStage,
        });
        return;
      default:
        throw new Error(`Unsupported SEO brief job: ${job.name}`);
    }
  }
}
