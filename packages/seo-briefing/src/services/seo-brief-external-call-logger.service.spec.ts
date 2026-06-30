import { describe, expect, it } from 'vitest';
import { SeoBriefRun } from '../domain/seo-brief-run.aggregate.js';
import { InMemorySeoBriefExternalCallLogRepository } from '../testing/logging-test-harness.js';
import { SeoBriefExternalCallLoggerService } from './seo-brief-external-call-logger.service.js';

function createRun() {
  return SeoBriefRun.create({
    topicSeed: 'how to earn with USDT',
    country: 'Nigeria',
    language: 'English',
    audience: 'Beginners',
    productName: 'Reinforce',
    productDescription: 'Helps users make idle USDT productive',
    brandMemorySnapshot: {
      brandName: 'Reinforce',
      productDescription: 'Helps users make idle USDT productive',
      targetAudience: 'Beginners',
      approvedFacts: [],
      forbiddenClaims: [],
      glossary: {},
      bannedPhrases: [],
      requiredPhrases: [],
      brandDocs: [],
      adaptationPromptRules: null,
    },
  });
}

describe('SeoBriefExternalCallLoggerService', () => {
  it('starts and completes an external call log', async () => {
    const run = createRun();
    const repository = new InMemorySeoBriefExternalCallLogRepository();
    const service = new SeoBriefExternalCallLoggerService(repository);

    const started = await service.startCall({
      runId: run.id,
      provider: 'dataforseo',
      endpoint: 'search_volume',
      requestPayload: { keyword: 'usdt yield' },
    });

    expect(started.status).toBe('running');
    expect(started.cacheHit).toBe(false);

    const completed = await service.completeCall(started.id, {
      responsePayload: { volume: 1200 },
      estimatedCost: 0.01,
      cacheHit: true,
    });

    expect(completed.status).toBe('completed');
    expect(completed.responsePayload).toEqual({ volume: 1200 });
    expect(completed.estimatedCost).toBe(0.01);
    expect(completed.cacheHit).toBe(true);
  });

  it('marks an external call log as failed', async () => {
    const run = createRun();
    const repository = new InMemorySeoBriefExternalCallLogRepository();
    const service = new SeoBriefExternalCallLoggerService(repository);

    const started = await service.startCall({
      runId: run.id,
      provider: 'dataforseo',
      endpoint: 'serp',
      requestPayload: { keyword: 'usdt yield' },
    });

    const failed = await service.failCall(started.id, {
      errorMessage: 'provider timeout',
      estimatedCost: 0.02,
      cacheHit: false,
    });

    expect(failed.status).toBe('failed');
    expect(failed.errorMessage).toBe('provider timeout');
    expect(failed.estimatedCost).toBe(0.02);
    expect(failed.cacheHit).toBe(false);
  });
});
