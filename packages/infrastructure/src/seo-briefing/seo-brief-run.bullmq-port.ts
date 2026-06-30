import {
  type EnqueuedSeoBriefRunJob,
  PROCESS_SEO_BRIEF_RUN_JOB,
  SEO_BRIEF_RUN_QUEUE,
  type SeoBriefRunJobPayload,
} from '@marketing-service/seo-briefing';
import { Inject, Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type JobsOptions, Queue, type RedisOptions } from 'bullmq';

const DEFAULT_JOB_OPTIONS: JobsOptions = {
  removeOnComplete: 100,
  removeOnFail: 500,
  attempts: 1,
};

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
export class SeoBriefRunBullMqPort implements OnModuleDestroy {
  private readonly logger = new Logger(SeoBriefRunBullMqPort.name);
  private queue: Queue<SeoBriefRunJobPayload> | null = null;
  private readonly redisUrl: string;

  constructor(@Inject(ConfigService) config: ConfigService) {
    this.redisUrl = config.getOrThrow<string>('REDIS_URL');
  }

  async onModuleDestroy(): Promise<void> {
    if (this.queue) {
      await this.queue.close();
      this.queue = null;
    }
  }

  async enqueueRun(payload: SeoBriefRunJobPayload): Promise<EnqueuedSeoBriefRunJob> {
    const jobId = [
      payload.runId,
      payload.startStage ?? 'full',
      payload.stopAfterStage ?? 'full',
      String(Date.now()),
    ].join('__');
    const job = await this.getQueue().add(PROCESS_SEO_BRIEF_RUN_JOB, payload, {
      jobId,
    });

    return {
      jobId: String(job.id),
    };
  }

  private getQueue(): Queue<SeoBriefRunJobPayload> {
    if (!this.queue) {
      this.queue = new Queue<SeoBriefRunJobPayload>(SEO_BRIEF_RUN_QUEUE, {
        connection: buildRedisConnection(this.redisUrl),
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      });
      this.queue.on('error', (error) => {
        this.logger.error(error, `BullMQ queue ${SEO_BRIEF_RUN_QUEUE} connection error`);
      });
    }

    return this.queue;
  }
}
