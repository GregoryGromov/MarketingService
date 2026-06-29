import { describe, expect, it } from 'vitest';
import {
  type GetOnPageContentParsingParams,
  type GetOnPageInstantPagesParams,
  SeoBriefArtifact,
  SeoBriefRun,
  type SeoOnPageContentParsingResult,
  type SeoOnPageInstantPagesResult,
  SeoResearchPort,
} from '../../index.js';
import {
  InMemorySeoBriefArtifactRepository,
  InMemorySeoBriefRunRepository,
  InMemorySeoBriefRunStepRepository,
} from '../../testing/run-test-harness.js';
import { FetchSelectedClusterOnPageCommand } from './fetch-selected-cluster-onpage.command.js';
import { FetchSelectedClusterOnPageHandler } from './fetch-selected-cluster-onpage.handler.js';

class FakeSeoResearchPort extends SeoResearchPort {
  contentCalls: GetOnPageContentParsingParams[] = [];
  instantCalls: GetOnPageInstantPagesParams[] = [];

  getDomainMetrics(): Promise<never> {
    throw new Error('Not implemented in test');
  }

  getKeywordSuggestions(): Promise<never> {
    throw new Error('Not implemented in test');
  }

  getOnPageContentParsing(
    params: GetOnPageContentParsingParams,
  ): Promise<SeoOnPageContentParsingResult> {
    this.contentCalls.push(params);
    return Promise.resolve({
      provider: 'dataforseo',
      rawResponse: {
        endpoint: 'content_parsing',
        url: params.url,
      },
      url: params.url,
      title: params.url.includes('binance') ? 'How To Earn With USDT' : 'Earn USDT Rewards',
      h1: ['Earn USDT Rewards'],
      h2: ['How it works', 'Risks to know'],
      h3: ['Flexible access'],
      markdown: '# Earn USDT Rewards',
      textBlocks: ['Earn rewards on USDT.', 'Understand risk before using any platform.'],
      tables: [],
      links: [
        {
          url: 'https://example.com/risk',
          anchor: 'Risk disclosure',
        },
      ],
    });
  }

  getOnPageInstantPages(params: GetOnPageInstantPagesParams): Promise<SeoOnPageInstantPagesResult> {
    this.instantCalls.push(params);
    return Promise.resolve({
      provider: 'dataforseo',
      rawResponse: {
        endpoint: 'instant_pages',
        url: params.url,
      },
      url: params.url,
      title: params.url.includes('binance') ? 'How To Earn With USDT' : 'Earn USDT Rewards',
      metaDescription: 'A practical USDT earning page with risk context.',
      canonical: params.url,
      statusCode: 200,
      technicalChecks: {
        is_https: true,
      },
    });
  }

  getOnPageParse(): Promise<never> {
    throw new Error('Not implemented in test');
  }

  getOrganicSerp(): Promise<never> {
    throw new Error('Not implemented in test');
  }

  getOrganicSerpSnapshot(): Promise<never> {
    throw new Error('Not implemented in test');
  }

  getRankedKeywords(): Promise<never> {
    throw new Error('Not implemented in test');
  }

  getSearchVolume(): Promise<never> {
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
      approvedFacts: ['Reinforce helps users make idle USDT productive.'],
      forbiddenClaims: ['guaranteed returns'],
      glossary: {},
      bannedPhrases: [],
      requiredPhrases: [],
      brandDocs: [],
      adaptationPromptRules: null,
    },
  });
}

describe('FetchSelectedClusterOnPageHandler', () => {
  it('fetches content parsing and instant page evidence for selected cluster URLs', async () => {
    const runRepository = new InMemorySeoBriefRunRepository();
    const stepRepository = new InMemorySeoBriefRunStepRepository();
    const artifactRepository = new InMemorySeoBriefArtifactRepository();
    const seoResearch = new FakeSeoResearchPort();
    const run = createRun();
    await runRepository.save(run);
    await artifactRepository.save(
      SeoBriefArtifact.create({
        runId: run.id,
        stage: 'cluster_selection',
        artifactType: 'cluster_selection_snapshot',
        payload: {
          artifactVersion: 'cluster_selection_v2',
          mainCluster: {
            clusterName: 'Safe USDT earning options',
            primaryKeyword: 'is it safe to earn interest on USDT',
            sourceCluster: {
              clusterName: 'Safe USDT earning options',
              primaryKeywordCandidate: 'is it safe to earn interest on USDT',
              keywords: ['is it safe to earn interest on USDT', 'USDT savings account'],
              competitorUrls: [
                {
                  domain: 'trustwallet.com',
                  url: 'https://trustwallet.com/stablecoin-earn/usdt',
                  title: 'Earn USDT Rewards',
                  rankAbsolute: 2,
                },
                {
                  domain: 'youtube.com',
                  url: 'https://www.youtube.com/watch?v=abc',
                  title: 'USDT video',
                  rankAbsolute: 1,
                },
              ],
            },
          },
          supportingClusters: [
            {
              clusterName: 'Platform comparisons',
              primaryKeyword: 'Binance Earn vs Nexo for USDT',
              sourceCluster: {
                clusterName: 'Platform comparisons',
                primaryKeywordCandidate: 'Binance Earn vs Nexo for USDT',
                competitorUrls: [
                  {
                    domain: 'binance.com',
                    url: 'https://www.binance.com/en-NG/earn/USDT',
                    title: 'How To Earn With USDT',
                    rankAbsolute: 3,
                  },
                ],
              },
            },
          ],
          rejectedClusters: [],
        },
      }),
    );
    await artifactRepository.save(
      SeoBriefArtifact.create({
        runId: run.id,
        stage: 'serp_research',
        artifactType: 'serp_domain_aggregation',
        payload: {
          artifactVersion: 'serp_domain_aggregation_v1',
          domains: [
            {
              domain: 'nexo.com',
              ranking_urls: [
                {
                  query: 'is it safe to earn interest on USDT',
                  url: 'https://nexo.com/earn-crypto/usdt',
                  title: 'Earn interest on USDT',
                  rank_absolute: 1,
                  type: 'organic',
                },
              ],
            },
            {
              domain: 'youtube.com',
              ranking_urls: [
                {
                  query: 'is it safe to earn interest on USDT',
                  url: 'https://youtube.com/watch?v=bad',
                  title: 'Video should be ignored',
                  rank_absolute: 1,
                  type: 'organic',
                },
              ],
            },
          ],
        },
      }),
    );
    const handler = new FetchSelectedClusterOnPageHandler(
      runRepository,
      stepRepository,
      artifactRepository,
      seoResearch,
    );

    const result = await handler.execute(new FetchSelectedClusterOnPageCommand(run.id));
    const artifacts = await artifactRepository.findByRunId(run.id);
    const saved = artifacts.find((artifact) => artifact.artifactType === 'onpage_research_snapshot')
      ?.payload as {
      artifactVersion: string;
      failedPageCount: number;
      pages: Array<{
        domain: string;
        h1: string[];
        metaDescription: string;
        rawResponses: { contentParsing: unknown; instantPages: unknown };
        role: string;
        status: string;
        url: string;
      }>;
      successfulPageCount: number;
      targetCount: number;
      targets: Array<{ domain: string; url: string }>;
    };
    const steps = await stepRepository.findByRunId(run.id);

    expect(result).toMatchObject({
      artifactType: 'onpage_research_snapshot',
      targetCount: 3,
      successfulPageCount: 3,
      failedPageCount: 0,
    });
    expect(seoResearch.contentCalls.map((call) => call.url)).toEqual([
      'https://trustwallet.com/stablecoin-earn/usdt',
      'https://nexo.com/earn-crypto/usdt',
      'https://www.binance.com/en-NG/earn/USDT',
    ]);
    expect(seoResearch.instantCalls).toHaveLength(3);
    expect(saved).toMatchObject({
      artifactVersion: 'selected_cluster_onpage_v1',
      targetCount: 3,
      successfulPageCount: 3,
      failedPageCount: 0,
    });
    expect(saved.targets.some((target) => target.domain === 'youtube.com')).toBe(false);
    expect(saved.pages[0]).toMatchObject({
      status: 'completed',
      role: 'closest_intent_match',
      domain: 'trustwallet.com',
      h1: ['Earn USDT Rewards'],
      metaDescription: 'A practical USDT earning page with risk context.',
    });
    expect(saved.pages[0]?.rawResponses.contentParsing).toMatchObject({
      endpoint: 'content_parsing',
    });
    expect(steps[0]).toMatchObject({
      stage: 'onpage_research',
      status: 'completed',
    });
    expect((await runRepository.findById(run.id))?.status).toBe('awaiting_confirmation');
  });

  it('requires manual main cluster selection before fetching OnPage evidence', async () => {
    const runRepository = new InMemorySeoBriefRunRepository();
    const stepRepository = new InMemorySeoBriefRunStepRepository();
    const artifactRepository = new InMemorySeoBriefArtifactRepository();
    const seoResearch = new FakeSeoResearchPort();
    const run = createRun();
    await runRepository.save(run);
    await artifactRepository.save(
      SeoBriefArtifact.create({
        runId: run.id,
        stage: 'cluster_selection',
        artifactType: 'cluster_selection_snapshot',
        payload: {
          artifactVersion: 'cluster_selection_v2',
          mainCluster: null,
          supportingClusters: [
            {
              clusterName: 'Platform comparisons',
              primaryKeyword: 'Binance Earn vs Nexo for USDT',
              productFitDecision: 'supporting_only',
              sourceCluster: {
                clusterName: 'Platform comparisons',
                primaryKeywordCandidate: 'Binance Earn vs Nexo for USDT',
                competitorUrls: [
                  {
                    domain: 'binance.com',
                    url: 'https://www.binance.com/en-NG/earn/USDT',
                    title: 'How To Earn With USDT',
                    rankAbsolute: 3,
                  },
                ],
              },
            },
          ],
          rejectedClusters: [],
        },
      }),
    );
    const handler = new FetchSelectedClusterOnPageHandler(
      runRepository,
      stepRepository,
      artifactRepository,
      seoResearch,
    );

    await expect(handler.execute(new FetchSelectedClusterOnPageCommand(run.id))).rejects.toThrow(
      'Select a main SEO brief cluster manually before fetching on-page evidence',
    );
    expect(seoResearch.contentCalls).toHaveLength(0);
    expect(seoResearch.instantCalls).toHaveLength(0);
  });

  it('falls back to saved SERP snapshot organic URLs when selected clusters have no usable URLs', async () => {
    const runRepository = new InMemorySeoBriefRunRepository();
    const stepRepository = new InMemorySeoBriefRunStepRepository();
    const artifactRepository = new InMemorySeoBriefArtifactRepository();
    const seoResearch = new FakeSeoResearchPort();
    const run = createRun();
    await runRepository.save(run);
    await artifactRepository.save(
      SeoBriefArtifact.create({
        runId: run.id,
        stage: 'cluster_selection',
        artifactType: 'cluster_selection_snapshot',
        payload: {
          artifactVersion: 'cluster_selection_v2',
          mainCluster: {
            clusterName: 'Platform comparisons',
            primaryKeyword: 'Binance Earn vs Nexo for USDT',
            productFitDecision: 'approve',
            sourceCluster: {
              clusterName: 'Platform comparisons',
              primaryKeywordCandidate: 'Binance Earn vs Nexo for USDT',
              competitorUrls: [],
            },
          },
          supportingClusters: [
            {
              clusterName: 'Platform comparisons',
              primaryKeyword: 'Binance Earn vs Nexo for USDT',
              productFitDecision: 'supporting_only',
              sourceCluster: {
                clusterName: 'Platform comparisons',
                primaryKeywordCandidate: 'Binance Earn vs Nexo for USDT',
                competitorUrls: [],
              },
            },
          ],
          rejectedClusters: [],
        },
      }),
    );
    await artifactRepository.save(
      SeoBriefArtifact.create({
        runId: run.id,
        stage: 'serp_research',
        artifactType: 'keyword_serp_preview_snapshots',
        payload: {
          artifactVersion: 'keyword_serp_preview_snapshots_v2',
          items: [
            {
              keyword: 'Binance Earn vs Nexo for USDT',
              snapshot: {
                organicResults: [
                  {
                    domain: 'nexo.com',
                    url: 'https://nexo.com/earn-crypto/usdt',
                    title: 'Earn interest on USDT',
                    rankAbsolute: 1,
                  },
                  {
                    domain: 'youtube.com',
                    url: 'https://youtube.com/watch?v=bad',
                    title: 'Video should be ignored',
                    rankAbsolute: 1,
                  },
                ],
              },
            },
          ],
        },
      }),
    );
    const handler = new FetchSelectedClusterOnPageHandler(
      runRepository,
      stepRepository,
      artifactRepository,
      seoResearch,
    );

    const result = await handler.execute(new FetchSelectedClusterOnPageCommand(run.id));
    const artifacts = await artifactRepository.findByRunId(run.id);
    const saved = artifacts.find((artifact) => artifact.artifactType === 'onpage_research_snapshot')
      ?.payload as {
      pages: Array<{ domain: string; role: string; url: string }>;
      targets: Array<{ domain: string; role: string; sourceType: string; url: string }>;
    };

    expect(result).toMatchObject({
      artifactType: 'onpage_research_snapshot',
      targetCount: 1,
      successfulPageCount: 1,
      failedPageCount: 0,
    });
    expect(saved.targets).toMatchObject([
      {
        domain: 'nexo.com',
        role: 'closest_intent_match',
        sourceType: 'keyword_serp_snapshot',
        url: 'https://nexo.com/earn-crypto/usdt',
      },
    ]);
    expect(saved.targets.some((target) => target.domain === 'youtube.com')).toBe(false);
    expect(saved.pages[0]).toMatchObject({
      domain: 'nexo.com',
      role: 'closest_intent_match',
      url: 'https://nexo.com/earn-crypto/usdt',
    });
  });
});
