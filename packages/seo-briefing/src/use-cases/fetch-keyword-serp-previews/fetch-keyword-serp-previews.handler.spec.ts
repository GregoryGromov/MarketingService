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
import { FetchKeywordSerpPreviewsCommand } from './fetch-keyword-serp-previews.command.js';
import { FetchKeywordSerpPreviewsHandler } from './fetch-keyword-serp-previews.handler.js';

class FakeSeoResearchPort extends SeoResearchPort {
  organicSerpSnapshotCalls: GetOrganicSerpSnapshotParams[] = [];

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

  async getOrganicSerpSnapshot(params: GetOrganicSerpSnapshotParams) {
    this.organicSerpSnapshotCalls.push(params);

    return {
      provider: 'dataforseo' as const,
      rawResponse: {
        keyword: params.keyword,
      },
      snapshot: {
        keyword: params.keyword,
        serpFeatures: ['organic', 'people_also_ask'],
        organicResults: [
          {
            position: 1,
            domain: 'example.com',
            url: 'https://example.com',
            title: `${params.keyword} guide`,
            snippet: `Snippet for ${params.keyword}`,
          },
        ],
        peopleAlsoAsk: [
          {
            question: `How does ${params.keyword} work?`,
          },
        ],
        relatedSearches: [`${params.keyword} basics`],
        specialBlocks: [],
      },
    };
  }

  getSearchVolume(_params: GetSearchVolumeParams): Promise<never> {
    throw new Error('Not implemented in test');
  }

  getRankedKeywords(_params: GetRankedKeywordsParams): Promise<never> {
    throw new Error('Not implemented in test');
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

describe('FetchKeywordSerpPreviewsHandler', () => {
  it('selects hypotheses for SERP enrichment and stores preview artifacts', async () => {
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
          serpEnrichmentCount: 3,
        },
      }),
    );
    await artifactRepository.save(
      SeoBriefArtifact.create({
        runId: run.id,
        stage: 'keyword_expansion',
        artifactType: 'keyword_hypotheses',
        payload: {
          hypotheses: [
            {
              keyword: 'earn usdt',
              hypothesisType: 'pain',
              productFitHypothesis: 'education_bridge',
              riskFlags: [],
            },
            {
              keyword: 'usdt savings',
              hypothesisType: 'action',
              productFitHypothesis: 'workflow_bridge',
              riskFlags: [],
            },
            {
              keyword: 'binance earn usdt',
              hypothesisType: 'ecosystem',
              productFitHypothesis: 'workflow_bridge',
              riskFlags: [],
            },
            {
              keyword: 'usdt guaranteed profit',
              hypothesisType: 'risk',
              productFitHypothesis: 'weak',
              riskFlags: ['guaranteed_return'],
            },
          ],
        },
      }),
    );
    const handler = new FetchKeywordSerpPreviewsHandler(
      runRepository,
      artifactRepository,
      seoResearch,
    );

    const result = await handler.execute(new FetchKeywordSerpPreviewsCommand(run.id));
    const artifacts = await artifactRepository.findByRunId(run.id);
    const raw = artifacts.find(
      (artifact) => artifact.artifactType === 'keyword_serp_preview_raw_responses',
    )?.payload as { items?: Array<{ keyword: string }> } | undefined;
    const snapshots = artifacts.find(
      (artifact) => artifact.artifactType === 'keyword_serp_preview_snapshots',
    )?.payload as { items?: Array<{ keyword: string }> } | undefined;

    expect(result.keywordCount).toBe(3);
    expect(seoResearch.organicSerpSnapshotCalls.map((call) => call.keyword)).toEqual([
      'earn usdt',
      'usdt savings',
      'binance earn usdt',
    ]);
    expect(raw?.items?.map((item) => item.keyword)).toEqual([
      'earn usdt',
      'usdt savings',
      'binance earn usdt',
    ]);
    expect(snapshots?.items?.map((item) => item.keyword)).toEqual([
      'earn usdt',
      'usdt savings',
      'binance earn usdt',
    ]);
    expect(snapshots?.items?.map((item) => item.keyword)).not.toContain('usdt guaranteed profit');
    expect(
      (
        snapshots as
          | { selectedHypotheses?: Array<{ keyword: string; selectionReason: string }> }
          | undefined
      )?.selectedHypotheses?.map((item) => item.keyword),
    ).toEqual(['earn usdt', 'usdt savings', 'binance earn usdt']);
    expect(
      artifacts.find((artifact) => artifact.artifactType === 'keyword_serp_derived_keywords'),
    ).toBeUndefined();
  });
});
