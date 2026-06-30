import { describe, expect, it } from 'vitest';
import { SeoBriefRun } from '../domain/seo-brief-run.aggregate.js';
import { InMemorySeoBriefLlmLogRepository } from '../testing/logging-test-harness.js';
import { SeoBriefLlmLoggerService } from './seo-brief-llm-logger.service.js';

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

describe('SeoBriefLlmLoggerService', () => {
  it('starts and completes an llm call log', async () => {
    const run = createRun();
    const repository = new InMemorySeoBriefLlmLogRepository();
    const service = new SeoBriefLlmLoggerService(repository);

    const started = await service.startCall({
      runId: run.id,
      operation: 'keyword_expansion',
      model: 'gpt-5',
      promptVersion: 'v1',
      requestPayload: { topic: run.topicSeed },
    });

    expect(started.status).toBe('running');
    expect(started.finishedAt).toBeNull();

    const completed = await service.completeCall(started.id, {
      responsePayload: { keywords: ['how to earn with USDT'] },
      tokenUsageInput: 120,
      tokenUsageOutput: 80,
      estimatedCost: 0.12,
    });

    expect(completed.status).toBe('completed');
    expect(completed.responsePayload).toEqual({
      keywords: ['how to earn with USDT'],
    });
    expect(completed.tokenUsageInput).toBe(120);
    expect(completed.tokenUsageOutput).toBe(80);
    expect(completed.estimatedCost).toBe(0.12);
    expect(completed.finishedAt).not.toBeNull();

    const stored = await repository.findByRunId(run.id);
    expect(stored).toHaveLength(1);
    expect(stored[0]?.status).toBe('completed');
  });

  it('marks an llm call log as failed', async () => {
    const run = createRun();
    const repository = new InMemorySeoBriefLlmLogRepository();
    const service = new SeoBriefLlmLoggerService(repository);

    const started = await service.startCall({
      runId: run.id,
      operation: 'clustering',
      model: 'gpt-5',
      promptVersion: 'v1',
      requestPayload: { keywords: ['usdt yield'] },
    });

    const failed = await service.failCall(started.id, {
      errorMessage: 'invalid structured output',
      responsePayload: { raw: 'oops' },
      estimatedCost: 0.05,
    });

    expect(failed.status).toBe('failed');
    expect(failed.errorMessage).toBe('invalid structured output');
    expect(failed.responsePayload).toEqual({ raw: 'oops' });
    expect(failed.estimatedCost).toBe(0.05);
    expect(failed.finishedAt).not.toBeNull();
  });
});
