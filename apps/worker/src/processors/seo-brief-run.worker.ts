import {
  PROCESS_SEO_BRIEF_RUN_JOB,
  ProcessSeoBriefRunExecutor,
  SEO_BRIEF_RUN_QUEUE,
  SeoBriefArticleAutoFlowRunner,
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
    @Inject(SeoBriefArticleAutoFlowRunner)
    private readonly articleAutoFlow: SeoBriefArticleAutoFlowRunner,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (this.worker) {
      return;
    }

    const redisUrl = this.config.getOrThrow<string>('REDIS_URL');
    const connection = await waitForRedisReady(redisUrl, SEO_BRIEF_RUN_QUEUE, this.logger);
    const concurrency = this.resolveConcurrency();
    this.worker = new Worker<SeoBriefRunJobPayload>(
      SEO_BRIEF_RUN_QUEUE,
      async (job) => this.processJob(job),
      {
        connection,
        concurrency,
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

  private resolveConcurrency(): number {
    const raw = this.config.get<string>('SEO_BRIEF_WORKER_CONCURRENCY');
    const parsed = Number.parseInt(raw ?? '', 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
      return 1;
    }
    return parsed;
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
        if (job.data.fullAutoFlow) {
          // Headless variant B: run keyword research -> packaged article via the
          // CQRS command chain instead of the SEO-only executor pipeline.
          await this.articleAutoFlow.run(job.data.runId);
          return;
        }
        await this.executor.execute(job.data.runId, {
          startStage: job.data.startStage,
          stopAfterStage: job.data.stopAfterStage,
          skipManualReview: job.data.skipManualReview,
        });
        return;
      default:
        throw new Error(`Unsupported SEO brief job: ${job.name}`);
    }
  }
}
