import {
  PROCESS_SEO_BRIEF_RUN_JOB,
  ProcessSeoBriefRunExecutor,
  SEO_BRIEF_RUN_QUEUE,
  type SeoBriefRunJobPayload,
} from '@marketing-service/seo-briefing';
import { Injectable, type OnApplicationBootstrap, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type Job, type RedisOptions, Worker } from 'bullmq';
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
export class SeoBriefRunWorker implements OnApplicationBootstrap, OnModuleDestroy {
  private worker: Worker<SeoBriefRunJobPayload> | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly logger: Logger,
    private readonly executor: ProcessSeoBriefRunExecutor,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (this.worker) {
      return;
    }

    this.worker = new Worker<SeoBriefRunJobPayload>(
      SEO_BRIEF_RUN_QUEUE,
      async (job) => this.processJob(job),
      {
        connection: buildRedisConnection(this.config.getOrThrow<string>('REDIS_URL')),
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
