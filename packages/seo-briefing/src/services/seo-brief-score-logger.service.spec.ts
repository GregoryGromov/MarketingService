import { describe, expect, it } from 'vitest';
import { SeoBriefRun } from '../domain/seo-brief-run.aggregate.js';
import { InMemorySeoBriefScoreLogRepository } from '../testing/logging-test-harness.js';
import { SeoBriefScoreLoggerService } from './seo-brief-score-logger.service.js';

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

describe('SeoBriefScoreLoggerService', () => {
  it('records a score snapshot', async () => {
    const run = createRun();
    const repository = new InMemorySeoBriefScoreLogRepository();
    const service = new SeoBriefScoreLoggerService(repository);

    const log = await service.record({
      runId: run.id,
      formulaName: 'seo_score',
      inputPayload: { demand: 70, competition: 40 },
      resultPayload: { total: 62 },
    });

    expect(log.formulaName).toBe('seo_score');
    expect(log.inputPayload).toEqual({ demand: 70, competition: 40 });
    expect(log.resultPayload).toEqual({ total: 62 });

    const stored = await repository.findByRunId(run.id);
    expect(stored).toHaveLength(1);
    expect(stored[0]?.formulaName).toBe('seo_score');
  });
});
