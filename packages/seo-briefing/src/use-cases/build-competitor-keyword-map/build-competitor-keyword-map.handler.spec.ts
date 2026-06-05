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
import { BuildCompetitorKeywordMapCommand } from './build-competitor-keyword-map.command.js';
import { BuildCompetitorKeywordMapHandler } from './build-competitor-keyword-map.handler.js';

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
      totalCount: 100,
      itemsCount: 1,
      metrics: {
        organicPos1: 1,
        organicPos2To3: 4,
        organicPos4To10: 9,
        organicEtv: 42,
      },
      rawResponse: {
        target: params.target,
      },
      items: [
        {
          text: `earn usdt with ${params.target}`,
          type: 'keyword' as const,
          source: 'ranked_keywords' as const,
          sourceDomain: params.target,
          metrics: {
            searchVolume: params.target === 'binance.com' ? 500 : 180,
            searchVolumeSource: 'ranked_keywords' as const,
            keywordDifficulty: 12,
            cpc: 1.2,
            competitionLevel: 'LOW',
            intent: 'commercial',
            monthlySearches: [],
          },
          competitorEvidence: {
            domain: params.target,
            rankingUrl: `https://${params.target}/earn`,
            rankingTitle: `${params.target} earn`,
            rankAbsolute: params.target === 'binance.com' ? 2 : 5,
            estimatedTraffic: 33.1,
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

describe('BuildCompetitorKeywordMapHandler', () => {
  it('builds a competitor keyword map from manual competitor domains', async () => {
    const runRepository = new InMemorySeoBriefRunRepository();
    const artifactRepository = new InMemorySeoBriefArtifactRepository();
    const seoResearch = new FakeSeoResearchPort();
    const run = createRun();
    await runRepository.save(run);
    await artifactRepository.save(
      SeoBriefArtifact.create({
        runId: run.id,
        stage: 'created',
        artifactType: 'normalized_input',
        payload: {
          competitorKeywordsJsonId: 'Nigeria USDT Competitors V1',
          knownCompetitors: {
            mustInclude: ['https://www.binance.com/en/earn/USDT', 'nexo.com'],
            optional: ['trustwallet.com', 'youtube'],
            exclude: ['nexo.com'],
          },
        },
      }),
    );

    const handler = new BuildCompetitorKeywordMapHandler(
      runRepository,
      artifactRepository,
      seoResearch,
    );

    const result = await handler.execute(new BuildCompetitorKeywordMapCommand(run.id));
    const artifacts = await artifactRepository.findByRunId(run.id);
    const competitorMap = artifacts.find((item) => item.artifactType === 'competitor_keyword_map');
    const rankedUniverse = artifacts.find((item) => item.artifactType === 'ranked_keywords_universe');
    const competitorPayload = competitorMap?.payload as {
      allKeywordsFlat: Array<{ sourceDomains: string[]; text: string }>;
      competitorKeywordsJsonId: string;
      itemCount: number;
      manualCompetitors: { skipped: Array<{ raw: string }> };
      targetCount: number;
      targets: string[];
    };
    const rankedPayload = rankedUniverse?.payload as {
      competitorKeywordsJsonId: string;
      itemCount: number;
      items: Array<{ sourceDomain: string; text: string }>;
      sourceArtifactId: string;
      sourceArtifactType: string;
      targets: string[];
    };

    expect(result).toMatchObject({
      artifactType: 'competitor_keyword_map',
      competitorKeywordsJsonId: 'nigeria_usdt_competitors_v1',
      targetCount: 2,
      targets: ['binance.com', 'trustwallet.com'],
      itemCount: 2,
      skippedCompetitorCount: 2,
    });
    expect(seoResearch.rankedKeywordCalls.map((call) => call.target)).toEqual([
      'binance.com',
      'trustwallet.com',
    ]);
    expect(seoResearch.rankedKeywordCalls.map((call) => call.limit)).toEqual([100, 100]);
    expect(competitorPayload.targets).toEqual(['binance.com', 'trustwallet.com']);
    expect(competitorPayload.targetCount).toBe(2);
    expect(competitorPayload.itemCount).toBe(2);
    expect(competitorPayload.manualCompetitors.skipped.map((item) => item.raw)).toEqual([
      'nexo.com',
      'youtube',
    ]);
    expect(competitorPayload.allKeywordsFlat).toHaveLength(2);
    expect(rankedPayload.sourceArtifactType).toBe('competitor_keyword_map');
    expect(rankedPayload.sourceArtifactId).toBe(competitorMap?.id);
    expect(rankedPayload.competitorKeywordsJsonId).toBe('nigeria_usdt_competitors_v1');
    expect(rankedPayload.targets).toEqual(['binance.com', 'trustwallet.com']);
    expect(rankedPayload.items.map((item) => item.sourceDomain)).toEqual([
      'binance.com',
      'trustwallet.com',
    ]);
  });
});
