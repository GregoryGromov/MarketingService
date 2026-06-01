import { describe, expect, it } from 'vitest';
import {
  type GetDomainMetricsParams,
  type GetKeywordSuggestionsParams,
  type GetOnPageParseParams,
  type GetOrganicSerpParams,
  type GetOrganicSerpSnapshotParams,
  type GetSearchVolumeParams,
  SeoBriefArtifact,
  SeoBriefKeywordHypothesesNotFoundError,
  SeoBriefRun,
  SeoResearchPort,
} from '../../index.js';
import {
  InMemorySeoBriefArtifactRepository,
  InMemorySeoBriefRunRepository,
} from '../../testing/run-test-harness.js';
import { FetchFirstKeywordSerpPreviewCommand } from './fetch-first-keyword-serp-preview.command.js';
import { FetchFirstKeywordSerpPreviewHandler } from './fetch-first-keyword-serp-preview.handler.js';

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
        tasks: [{ id: 'dfs-task-1' }],
      },
      snapshot: {
        keyword: params.keyword,
        locationName: params.market.locationName ?? params.market.country,
        languageName: params.market.language,
        device: 'mobile',
        os: 'android',
        serpFeatures: ['organic', 'people_also_ask'],
        organicResults: [
          {
            position: 1,
            domain: 'example.com',
            url: 'https://example.com/usdt',
            title: 'USDT Yield Guide',
            snippet: 'Learn how USDT yield works.',
          },
        ],
        peopleAlsoAsk: [
          {
            question: 'How much interest is on USDT?',
          },
        ],
        relatedSearches: ['earn usdt daily'],
        aiOverview: {
          text: 'USDT can be earned through stablecoin earn accounts.',
          elements: [
            {
              text: 'Stablecoin earn accounts can generate USDT rewards.',
              title: null,
              links: [],
            },
          ],
          references: [],
        },
        specialBlocks: [],
      },
    };
  }

  getSearchVolume(_params: GetSearchVolumeParams): Promise<never> {
    throw new Error('Not implemented in test');
  }
}

describe('FetchFirstKeywordSerpPreviewHandler', () => {
  it('fetches serp preview for the first keyword and stores raw + normalized artifacts', async () => {
    const runRepository = new InMemorySeoBriefRunRepository();
    const artifactRepository = new InMemorySeoBriefArtifactRepository();
    const seoResearch = new FakeSeoResearchPort();
    const handler = new FetchFirstKeywordSerpPreviewHandler(
      runRepository,
      artifactRepository,
      seoResearch,
    );

    const run = SeoBriefRun.create({
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
    await runRepository.save(run);
    await artifactRepository.save(
      SeoBriefArtifact.create({
        runId: run.id,
        stage: 'keyword_expansion',
        artifactType: 'keyword_hypotheses',
        payload: {
          hypotheses: [
            {
              keyword: 'usdt yield',
              intent: 'informational',
              rationale: 'Broad demand probe',
              audienceFit: 'Good for beginners',
            },
            {
              keyword: 'usdt rewards',
              intent: 'commercial',
              rationale: 'Reward-led demand probe',
              audienceFit: 'Good for users looking for simple earning options',
            },
          ],
        },
      }),
    );

    const result = await handler.execute(new FetchFirstKeywordSerpPreviewCommand(run.id));
    const artifacts = await artifactRepository.findByRunId(run.id);

    expect(result.keyword).toBe('usdt yield');
    expect(seoResearch.organicSerpSnapshotCalls).toHaveLength(1);
    expect(seoResearch.organicSerpSnapshotCalls[0]?.keyword).toBe('usdt yield');
    expect(
      artifacts.find(
        (artifact) => artifact.artifactType === 'first_keyword_serp_preview_raw_response',
      )?.payload,
    ).toEqual({
      keyword: 'usdt yield',
      rawResponse: {
        tasks: [{ id: 'dfs-task-1' }],
      },
    });
    expect(
      artifacts.find((artifact) => artifact.artifactType === 'first_keyword_serp_preview_snapshot')
        ?.payload,
    ).toMatchObject({
      keyword: 'usdt yield',
      snapshot: {
        keyword: 'usdt yield',
        device: 'mobile',
        os: 'android',
        serpFeatures: ['organic', 'people_also_ask'],
      },
    });
    expect(
      artifacts.find((artifact) => artifact.artifactType === 'first_keyword_serp_derived_keywords')
        ?.payload,
    ).toMatchObject({
      keyword: 'usdt yield',
      similarSearchQueries: [
        {
          query: 'How much interest is on USDT',
          source: 'people_also_ask',
          sourceText: 'How much interest is on USDT?',
        },
        {
          query: 'earn usdt daily',
          source: 'related_search',
        },
      ],
      serpThemes: [
        {
          theme: 'Stablecoin earn accounts can generate USDT rewards.',
          source: 'ai_overview',
        },
        {
          theme: 'USDT Yield Guide',
          source: 'organic_title',
        },
        {
          theme: 'Learn how USDT yield works.',
          source: 'organic_snippet',
        },
      ],
    });
  });

  it('fails when keyword hypotheses are missing', async () => {
    const runRepository = new InMemorySeoBriefRunRepository();
    const artifactRepository = new InMemorySeoBriefArtifactRepository();
    const seoResearch = new FakeSeoResearchPort();
    const handler = new FetchFirstKeywordSerpPreviewHandler(
      runRepository,
      artifactRepository,
      seoResearch,
    );

    const run = SeoBriefRun.create({
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
    await runRepository.save(run);

    await expect(
      handler.execute(new FetchFirstKeywordSerpPreviewCommand(run.id)),
    ).rejects.toBeInstanceOf(SeoBriefKeywordHypothesesNotFoundError);
  });
});
