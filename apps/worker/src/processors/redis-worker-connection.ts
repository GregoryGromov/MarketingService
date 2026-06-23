import type { RedisOptions } from 'bullmq';
import Redis from 'ioredis';
import type { Logger } from 'nestjs-pino';

export function buildRedisConnection(redisUrl: string): RedisOptions {
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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForRedisReady(
  redisUrl: string,
  queueName: string,
  logger: Logger,
  timeoutMs = 60_000,
): Promise<RedisOptions> {
  const connection = buildRedisConnection(redisUrl);
  const startedAt = Date.now();
  let attempt = 0;
  let lastError: unknown = null;

  while (Date.now() - startedAt < timeoutMs) {
    attempt += 1;
    const client = new Redis({
      ...connection,
      connectTimeout: 2000,
      enableOfflineQueue: false,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
    });
    client.on('error', () => {
      // The surrounding connect/ping await handles readiness failures.
    });

    try {
      await client.connect();
      await client.ping();
      await client.quit();
      if (attempt > 1) {
        logger.log(`Redis is ready for BullMQ worker ${queueName} after ${attempt} attempts`);
      }
      return connection;
    } catch (error) {
      lastError = error;
      client.disconnect();
      if (attempt === 1 || attempt % 5 === 0) {
        logger.warn(
          `Waiting for Redis before starting BullMQ worker ${queueName}; attempt ${attempt}`,
        );
      }
      await delay(1000);
    }
  }

  logger.error(lastError, `Redis was not ready for BullMQ worker ${queueName}`);
  throw lastError instanceof Error
    ? lastError
    : new Error(`Redis was not ready for BullMQ worker ${queueName}`);
}

export function createThrottledConnectionErrorLogger(
  queueName: string,
  logger: Logger,
  intervalMs = 15_000,
): (error: Error) => void {
  let lastLoggedAt = 0;
  let suppressed = 0;

  return (error: Error) => {
    const now = Date.now();
    if (now - lastLoggedAt < intervalMs) {
      suppressed += 1;
      return;
    }

    const suffix = suppressed > 0 ? ` (${suppressed} similar errors suppressed)` : '';
    suppressed = 0;
    lastLoggedAt = now;
    logger.error(error, `BullMQ worker ${queueName} connection error${suffix}`);
  };
}
