import { describe, expect, it } from 'vitest';
import { SeoBriefArtifact, SeoBriefRun } from '../../index.js';
import {
  InMemorySeoBriefArtifactRepository,
  InMemorySeoBriefRunRepository,
} from '../../testing/run-test-harness.js';
import { AggregateSerpDomainsCommand } from './aggregate-serp-domains.command.js';
import { AggregateSerpDomainsHandler } from './aggregate-serp-domains.handler.js';

function createRun(): SeoBriefRun {
  return SeoBriefRun.create({
    topicSeed: 'save dollars in Nigeria',
    country: 'Nigeria',
    language: 'English',
    audience: 'USDT holders',
    productName: 'Reinforce',
    productDescription: 'Helps users hold value in digital dollars',
    brandMemorySnapshot: {
      brandName: 'Reinforce',
      productDescription: 'Helps users hold value in digital dollars',
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

describe('AggregateSerpDomainsHandler', () => {
  it('aggregates organic and AI Overview domain evidence from saved SERP snapshots', async () => {
    const runRepository = new InMemorySeoBriefRunRepository();
    const artifactRepository = new InMemorySeoBriefArtifactRepository();
    const run = createRun();
    await runRepository.save(run);
    await artifactRepository.save(
      SeoBriefArtifact.create({
        runId: run.id,
        stage: 'serp_research',
        artifactType: 'keyword_serp_preview_snapshots',
        payload: {
          items: [
            {
              index: 0,
              keyword: 'how to save money in dollars in Nigeria',
              snapshot: {
                serpFeatures: ['organic', 'ai_overview', 'video'],
                organicResults: [
                  {
                    domain: 'www.binance.com',
                    url: 'https://www.binance.com/en-NG/blog/p2p/save-dollars',
                    title: 'Dollar saving with stablecoins',
                    rankAbsolute: 1,
                  },
                  {
                    domain: 'example.com',
                    url: 'https://example.com/too-deep',
                    title: 'Rank 12 should not be treated as ranking evidence',
                    rankAbsolute: 12,
                  },
                ],
                aiOverview: {
                  references: [
                    {
                      domain: 'trustwallet.com',
                      url: 'https://trustwallet.com/blog/usdt',
                      title: 'USDT wallet guide',
                    },
                  ],
                },
                specialBlocks: [
                  {
                    type: 'video',
                    title: 'How to save in dollars',
                    sourceDomain: 'youtube.com',
                  },
                ],
              },
            },
            {
              index: 1,
              keyword: 'how to sell USDT in Nigeria',
              snapshot: {
                serpFeatures: ['organic'],
                organicResults: [
                  {
                    domain: 'binance.com',
                    url: 'https://www.binance.com/en-NG/blog/p2p/sell-usdt',
                    title: 'Sell USDT in Nigeria',
                    rankAbsolute: 3,
                  },
                ],
                aiOverview: null,
                specialBlocks: [],
              },
            },
          ],
        },
      }),
    );
    const handler = new AggregateSerpDomainsHandler(runRepository, artifactRepository);

    const result = await handler.execute(new AggregateSerpDomainsCommand(run.id));
    const artifacts = await artifactRepository.findByRunId(run.id);
    const payload = artifacts.find(
      (artifact) => artifact.artifactType === 'serp_domain_aggregation',
    )?.payload as {
      domains: Array<{
        appearances: number;
        avg_rank: number | null;
        best_rank: number | null;
        domain: string;
        queries: string[];
        ranking_urls: Array<{ type: string; url: string | null }>;
        serp_feature_context: string[];
      }>;
      formatSignals: Array<{ sourceDomain: string | null; type: string }>;
      rankingUrlCount: number;
    };

    expect(result.domainCount).toBe(2);
    expect(result.queryCount).toBe(2);
    expect(result.rankingUrlCount).toBe(3);
    expect(payload.rankingUrlCount).toBe(3);
    expect(payload.domains[0]).toMatchObject({
      domain: 'binance.com',
      appearances: 2,
      best_rank: 1,
      avg_rank: 2,
    });
    expect(payload.domains[0]?.queries).toEqual([
      'how to save money in dollars in Nigeria',
      'how to sell USDT in Nigeria',
    ]);
    expect(payload.domains[0]?.serp_feature_context).toContain('organic');
    expect(payload.domains.find((domain) => domain.domain === 'trustwallet.com')).toMatchObject({
      appearances: 1,
      best_rank: null,
      ranking_urls: [
        {
          type: 'ai_overview_reference',
          url: 'https://trustwallet.com/blog/usdt',
        },
      ],
    });
    expect(payload.domains.some((domain) => domain.domain === 'example.com')).toBe(false);
    expect(payload.formatSignals).toEqual([
      {
        query: 'how to save money in dollars in Nigeria',
        type: 'video',
        title: 'How to save in dollars',
        sourceDomain: 'youtube.com',
      },
    ]);
  });
});
