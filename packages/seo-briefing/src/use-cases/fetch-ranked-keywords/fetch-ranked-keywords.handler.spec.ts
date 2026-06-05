import { describe, expect, it } from 'vitest';
import {
  type GetDomainMetricsParams,
  type GetKeywordSuggestionsParams,
  type GetOnPageParseParams,
  type GetOrganicSerpParams,
  type GetOrganicSerpSnapshotParams,
  type GetRankedKeywordsParams,
  type GetSearchVolumeParams,
  SeoBriefArtifact,
  SeoBriefRun,
  SeoResearchPort,
} from '../../index.js';
import {
  InMemorySeoBriefArtifactRepository,
  InMemorySeoBriefRunRepository,
} from '../../testing/run-test-harness.js';
import { FetchRankedKeywordsCommand } from './fetch-ranked-keywords.command.js';
import { FetchRankedKeywordsHandler } from './fetch-ranked-keywords.handler.js';

class FakeSeoResearchPort extends SeoResearchPort {
  rankedKeywordCalls: GetRankedKeywordsParams[] = [];

  getDomainMetrics(_params: GetDomainMetricsParams): Promise<never> {
    throw new Error('Not implemented in test');
  }

  getKeywordSuggestions(_params: GetKeywordSuggestionsParams): Promise<never> {
    throw new Error('Not implemented in test');
  }

  getOnPageParse(_params: GetOnPageParseParams): Promise<never> {
    throw new Error('Not implemented in test');
  }

  getOrganicSerp(_params: GetOrganicSerpParams): Promise<never> {
    throw new Error('Not implemented in test');
  }

  getOrganicSerpSnapshot(_params: GetOrganicSerpSnapshotParams): Promise<never> {
    throw new Error('Not implemented in test');
  }

  async getRankedKeywords(params: GetRankedKeywordsParams) {
    this.rankedKeywordCalls.push(params);

    return {
      provider: 'dataforseo' as const,
      target: params.target,
      market: params.market,
      totalCount: 1000,
      itemsCount: 1,
      metrics: {
        organicPos1: 3,
        organicPos2To3: 7,
        organicPos4To10: 20,
        organicEtv: 123.4,
      },
      rawResponse: {
        target: params.target,
      },
      items: [
        {
          text: `how to use ${params.target}`,
          type: 'keyword' as const,
          source: 'ranked_keywords' as const,
          sourceDomain: params.target,
          metrics: {
            searchVolume: 170,
            searchVolumeSource: 'ranked_keywords' as const,
            keywordDifficulty: 8,
            cpc: null,
            competitionLevel: 'LOW',
            intent: 'informational',
            monthlySearches: [],
          },
          competitorEvidence: {
            domain: params.target,
            rankingUrl: `https://${params.target}/guide`,
            rankingTitle: `${params.target} guide`,
            rankAbsolute: 3,
            estimatedTraffic: 51.68,
          },
          serpEvidence: {
            serpFeatures: ['organic', 'people_also_ask'],
          },
        },
      ],
    };
  }

  getSearchVolume(_params: GetSearchVolumeParams): Promise<never> {
    throw new Error('Not implemented in test');
  }
}

function createRun(): SeoBriefRun {
  return SeoBriefRun.create({
    topicSeed: 'idle USDT yield',
    country: 'Nigeria',
    language: 'English',
    audience: 'USDT holders',
    productName: 'Reinforce',
    productDescription: 'Helps users make idle USDT productive',
    brandMemorySnapshot: {
      brandName: 'Reinforce',
      productDescription: 'Helps users make idle USDT productive',
      targetAudience: 'USDT holders',
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

describe('FetchRankedKeywordsHandler', () => {
  it('fetches ranked keywords only for domains selected as Ranked Keywords targets', async () => {
    const runRepository = new InMemorySeoBriefRunRepository();
    const artifactRepository = new InMemorySeoBriefArtifactRepository();
    const seoResearch = new FakeSeoResearchPort();
    const run = createRun();
    await runRepository.save(run);
    await artifactRepository.save(
      SeoBriefArtifact.create({
        runId: run.id,
        stage: 'serp_research',
        artifactType: 'serp_domain_classification',
        payload: {
          rankedKeywordsTargets: [
            {
              domain: 'binance.com',
              reason: 'CEX product universe',
            },
            {
              domain: 'trustwallet.com',
              reason: 'Wallet and stablecoin earn universe',
            },
          ],
          ignoredTargets: [
            {
              domain: 'youtube.com',
              reason: 'Video format signal only',
            },
          ],
        },
      }),
    );
    const handler = new FetchRankedKeywordsHandler(
      runRepository,
      artifactRepository,
      seoResearch,
    );

    const result = await handler.execute(new FetchRankedKeywordsCommand(run.id));
    const artifacts = await artifactRepository.findByRunId(run.id);
    const artifact = artifacts.find(
      (item) => item.artifactType === 'ranked_keywords_universe',
    );
    const payload = artifact?.payload as {
      itemCount: number;
      items: Array<{ sourceDomain: string; text: string }>;
      rawResponses: Array<{ target: string }>;
      targets: string[];
    };

    expect(result).toMatchObject({
      artifactType: 'ranked_keywords_universe',
      targetCount: 2,
      itemCount: 2,
      targets: ['binance.com', 'trustwallet.com'],
    });
    expect(seoResearch.rankedKeywordCalls.map((call) => call.target)).toEqual([
      'binance.com',
      'trustwallet.com',
    ]);
    expect(seoResearch.rankedKeywordCalls.some((call) => call.target === 'youtube.com')).toBe(false);
    expect(payload.targets).toEqual(['binance.com', 'trustwallet.com']);
    expect(payload.itemCount).toBe(2);
    expect(payload.items.map((item) => item.sourceDomain)).toEqual([
      'binance.com',
      'trustwallet.com',
    ]);
    expect(payload.rawResponses).toHaveLength(2);
  });
});
