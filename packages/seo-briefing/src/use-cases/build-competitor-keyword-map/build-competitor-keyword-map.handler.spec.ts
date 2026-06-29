import { describe, expect, it } from 'vitest';
import { SeoBriefRun } from '../../index.js';
import {
  InMemorySeoBriefArtifactRepository,
  InMemorySeoBriefRunRepository,
} from '../../testing/run-test-harness.js';
import { BuildCompetitorKeywordMapCommand } from './build-competitor-keyword-map.command.js';
import { BuildCompetitorKeywordMapHandler } from './build-competitor-keyword-map.handler.js';

function createRunWithBrandMemoryKeywordMap(): SeoBriefRun {
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
      seoCompetitors: {
        mustInclude: ['binance.com'],
        optional: ['trustwallet.com'],
        exclude: ['youtube.com'],
      },
      seoCompetitorKeywordMap: {
        generatedAt: '2026-06-09T10:00:00.000Z',
        competitorKeywordsJsonId: 'nigeria_usdt_competitors',
        market: {
          country: 'Nigeria',
          language: 'English',
          locationName: 'Nigeria',
        },
        targets: ['binance.com', 'trustwallet.com'],
        targetCount: 2,
        itemCount: 2,
        deduplicatedKeywordCount: 2,
        targetResults: [
          {
            target: 'binance.com',
            itemsCount: 1,
          },
          {
            target: 'trustwallet.com',
            itemsCount: 1,
          },
        ],
        items: [
          {
            text: 'binance earn usdt',
            type: 'keyword',
            source: 'ranked_keywords',
            sourceDomain: 'binance.com',
            metrics: {
              searchVolume: 500,
              searchVolumeSource: 'ranked_keywords',
              keywordDifficulty: 12,
              cpc: 1.2,
              competitionLevel: 'LOW',
              intent: 'commercial',
              monthlySearches: [],
            },
            competitorEvidence: {
              domain: 'binance.com',
              rankingUrl: 'https://binance.com/earn',
              rankingTitle: 'Binance Earn',
              rankAbsolute: 2,
              estimatedTraffic: 33.1,
            },
            serpEvidence: {
              serpFeatures: ['organic'],
            },
          },
          {
            text: 'trust wallet usdt earn',
            type: 'keyword',
            source: 'ranked_keywords',
            sourceDomain: 'trustwallet.com',
            metrics: {
              searchVolume: 180,
              searchVolumeSource: 'ranked_keywords',
              keywordDifficulty: 18,
              cpc: 0.9,
              competitionLevel: 'LOW',
              intent: 'informational',
              monthlySearches: [],
            },
            competitorEvidence: {
              domain: 'trustwallet.com',
              rankingUrl: 'https://trustwallet.com/stablecoin-earn/usdt',
              rankingTitle: 'Earn USDT Rewards',
              rankAbsolute: 4,
              estimatedTraffic: 18.5,
            },
            serpEvidence: {
              serpFeatures: ['organic', 'people_also_ask'],
            },
          },
        ],
        allKeywordsFlat: [
          {
            keyword: 'binance earn usdt',
            source: 'ranked_keywords',
            searchVolume: 500,
            keywordDifficulty: 12,
            intent: 'commercial',
            bestRankAbsolute: 2,
            estimatedTrafficMax: 33.1,
            evidenceCount: 1,
            competitorDomains: ['binance.com'],
          },
          {
            keyword: 'trust wallet usdt earn',
            source: 'ranked_keywords',
            searchVolume: 180,
            keywordDifficulty: 18,
            intent: 'informational',
            bestRankAbsolute: 4,
            estimatedTrafficMax: 18.5,
            evidenceCount: 1,
            competitorDomains: ['trustwallet.com'],
          },
        ],
      },
    },
  });
}

function createRunWithoutBrandMemoryKeywordMap(): SeoBriefRun {
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
      seoCompetitors: {
        mustInclude: ['binance.com'],
        optional: [],
        exclude: [],
      },
      seoCompetitorKeywordMap: null,
    },
  });
}

describe('BuildCompetitorKeywordMapHandler', () => {
  it('builds SEO brief competitor artifacts from Brand Memory ranked keywords', async () => {
    const runRepository = new InMemorySeoBriefRunRepository();
    const artifactRepository = new InMemorySeoBriefArtifactRepository();
    const run = createRunWithBrandMemoryKeywordMap();
    await runRepository.save(run);

    const handler = new BuildCompetitorKeywordMapHandler(runRepository, artifactRepository);

    const result = await handler.execute(new BuildCompetitorKeywordMapCommand(run.id));
    const artifacts = await artifactRepository.findByRunId(run.id);
    const competitorMap = artifacts.find((item) => item.artifactType === 'competitor_keyword_map');
    const rankedUniverse = artifacts.find(
      (item) => item.artifactType === 'ranked_keywords_universe',
    );
    const competitorPayload = competitorMap?.payload as {
      competitorKeywordsJsonId: string;
      itemCount: number;
      sourceArtifactType: string;
      targetCount: number;
      targets: string[];
    };
    const rankedPayload = rankedUniverse?.payload as {
      itemCount: number;
      sourceArtifactId: string;
      sourceArtifactType: string;
      targets: string[];
    };

    expect(result).toMatchObject({
      artifactType: 'competitor_keyword_map',
      competitorKeywordsJsonId: 'nigeria_usdt_competitors',
      targetCount: 2,
      targets: ['binance.com', 'trustwallet.com'],
      itemCount: 2,
      skippedCompetitorCount: 0,
    });
    expect(competitorPayload.sourceArtifactType).toBe('brand_memory_snapshot');
    expect(competitorPayload.competitorKeywordsJsonId).toBe('nigeria_usdt_competitors');
    expect(competitorPayload.targets).toEqual(['binance.com', 'trustwallet.com']);
    expect(competitorPayload.targetCount).toBe(2);
    expect(competitorPayload.itemCount).toBe(2);
    expect(rankedPayload.sourceArtifactType).toBe('competitor_keyword_map');
    expect(rankedPayload.sourceArtifactId).toBe(competitorMap?.id);
    expect(rankedPayload.targets).toEqual(['binance.com', 'trustwallet.com']);
    expect(rankedPayload.itemCount).toBe(2);
  });

  it('fails clearly when Brand Memory competitor ranked keywords are missing', async () => {
    const runRepository = new InMemorySeoBriefRunRepository();
    const artifactRepository = new InMemorySeoBriefArtifactRepository();
    const run = createRunWithoutBrandMemoryKeywordMap();
    await runRepository.save(run);

    const handler = new BuildCompetitorKeywordMapHandler(runRepository, artifactRepository);

    await expect(handler.execute(new BuildCompetitorKeywordMapCommand(run.id))).rejects.toThrow(
      'No Brand Memory competitor keyword map found',
    );
  });
});
