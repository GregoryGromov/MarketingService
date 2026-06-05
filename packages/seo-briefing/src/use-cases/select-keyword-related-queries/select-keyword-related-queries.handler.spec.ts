import { describe, expect, it } from 'vitest';
import {
  type SelectRelatedKeywordsParams,
  type SelectRelatedKeywordsResult,
  SeoBriefAiPort,
  SeoBriefArtifact,
  SeoBriefRun,
} from '../../index.js';
import {
  InMemorySeoBriefArtifactRepository,
  InMemorySeoBriefRunRepository,
} from '../../testing/run-test-harness.js';
import { SelectKeywordRelatedQueriesCommand } from './select-keyword-related-queries.command.js';
import { SelectKeywordRelatedQueriesHandler } from './select-keyword-related-queries.handler.js';

class FakeSeoBriefAiPort extends SeoBriefAiPort {
  selectRelatedKeywordsCalls: SelectRelatedKeywordsParams[] = [];

  extractContext(): Promise<never> {
    throw new Error('Not implemented in test');
  }

  expandKeywords(): Promise<never> {
    throw new Error('Not implemented in test');
  }

  extractUserPainScenarios(): Promise<never> {
    throw new Error('Not implemented in test');
  }

  triageKeywords(): Promise<never> {
    throw new Error('Not implemented in test');
  }

  clusterKeywords(): Promise<never> {
    throw new Error('Not implemented in test');
  }

  classifySerpDomains(): Promise<never> {
    throw new Error('Not implemented in test');
  }

  scoreDirtyKeywordCandidates(): Promise<never> {
    throw new Error('Not implemented in test');
  }

  buildProductBridge(): Promise<never> {
    throw new Error('Not implemented in test');
  }

  explainClusterSelection(): Promise<never> {
    throw new Error('Not implemented in test');
  }

  generateSeoBrief(): Promise<never> {
    throw new Error('Not implemented in test');
  }

  selectRelatedKeywords(params: SelectRelatedKeywordsParams): Promise<SelectRelatedKeywordsResult> {
    this.selectRelatedKeywordsCalls.push(params);

    return Promise.resolve({
      selected: [
        {
          keyword: params.candidates[0]?.query ?? 'missing',
          source: params.candidates[0]?.source ?? 'related_search',
          sourceText: params.candidates[0]?.sourceText ?? 'missing',
          reason: 'Best grounded candidate.',
        },
        {
          keyword: 'invented query',
          source: 'related_search',
          sourceText: 'invented query',
          reason: 'Must be filtered out.',
        },
      ],
      rejected: [],
    });
  }
}

function createRun(): SeoBriefRun {
  return SeoBriefRun.create({
    topicSeed: 'usdt earn',
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

describe('SelectKeywordRelatedQueriesHandler', () => {
  it('selects grounded related queries for every SERP-derived keyword item', async () => {
    const runRepository = new InMemorySeoBriefRunRepository();
    const artifactRepository = new InMemorySeoBriefArtifactRepository();
    const ai = new FakeSeoBriefAiPort();
    const run = createRun();
    await runRepository.save(run);
    await artifactRepository.save(
      SeoBriefArtifact.create({
        runId: run.id,
        stage: 'keyword_expansion',
        artifactType: 'keyword_serp_derived_keywords',
        payload: {
          items: [
            {
              index: 0,
              keyword: 'earn usdt',
              similarSearchQueries: [
                {
                  query: 'How to earn USDT daily?',
                  source: 'people_also_ask',
                  sourceText: 'How to earn USDT daily?',
                  reason: 'PAA question.',
                },
              ],
            },
            {
              index: 1,
              keyword: 'usdt savings',
              similarSearchQueries: [
                {
                  query: 'best usdt savings account',
                  source: 'related_search',
                  sourceText: 'best usdt savings account',
                  reason: 'Related search.',
                },
              ],
            },
          ],
        },
      }),
    );
    const handler = new SelectKeywordRelatedQueriesHandler(runRepository, artifactRepository, ai);

    const result = await handler.execute(new SelectKeywordRelatedQueriesCommand(run.id));
    const artifacts = await artifactRepository.findByRunId(run.id);
    const selection = artifacts.find(
      (artifact) => artifact.artifactType === 'keyword_related_query_selections',
    )?.payload as { items?: Array<{ keyword: string; selected: Array<{ keyword: string }> }> };

    expect(result.keywordCount).toBe(2);
    expect(result.selectedCount).toBe(2);
    expect(ai.selectRelatedKeywordsCalls.map((call) => call.seedKeyword)).toEqual([
      'earn usdt',
      'usdt savings',
    ]);
    expect(selection?.items?.map((item) => [item.keyword, item.selected[0]?.keyword])).toEqual([
      ['earn usdt', 'How to earn USDT daily'],
      ['usdt savings', 'best usdt savings account'],
    ]);
    expect(JSON.stringify(selection)).not.toContain('invented query');
  });
});
