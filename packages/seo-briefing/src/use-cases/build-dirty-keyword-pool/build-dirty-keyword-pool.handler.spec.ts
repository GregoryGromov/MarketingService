import { describe, expect, it } from 'vitest';
import { SeoBriefArtifact, SeoBriefRun } from '../../index.js';
import {
  InMemorySeoBriefArtifactRepository,
  InMemorySeoBriefRunRepository,
} from '../../testing/run-test-harness.js';
import { BuildDirtyKeywordPoolCommand } from './build-dirty-keyword-pool.command.js';
import { BuildDirtyKeywordPoolHandler } from './build-dirty-keyword-pool.handler.js';

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

describe('BuildDirtyKeywordPoolHandler', () => {
  it('merges generated and SERP-derived keyword candidates while ignoring competitor keyword scoring artifacts', async () => {
    const runRepository = new InMemorySeoBriefRunRepository();
    const artifactRepository = new InMemorySeoBriefArtifactRepository();
    const run = createRun();
    await runRepository.save(run);
    await artifactRepository.save(
      SeoBriefArtifact.create({
        runId: run.id,
        stage: 'keyword_expansion',
        artifactType: 'keyword_hypotheses',
        payload: {
          groups: [
            {
              label: 'Pain & JTBD',
              hypotheses: [{ keyword: 'is it safe to earn interest on USDT' }],
            },
          ],
          hypotheses: [
            {
              keyword: 'is it safe to earn interest on USDT?',
              intentHint: 'informational',
              reason: 'Safety concern',
            },
            {
              keyword: 'best way to earn passive income on USDT',
              intentHint: 'commercial',
              reason: 'Beginner query',
            },
          ],
        },
      }),
    );
    await artifactRepository.save(
      SeoBriefArtifact.create({
        runId: run.id,
        stage: 'keyword_expansion',
        artifactType: 'keyword_serp_derived_keywords',
        payload: {
          items: [
            {
              keyword: 'is it safe to earn interest on USDT',
              similarSearchQueries: [
                {
                  query: 'How much interest is on USDT?',
                  source: 'people_also_ask',
                  sourceText: 'How much interest is on USDT?',
                  reason: 'PAA question',
                },
              ],
            },
          ],
        },
      }),
    );
    await artifactRepository.save(
      SeoBriefArtifact.create({
        runId: run.id,
        stage: 'keyword_expansion',
        artifactType: 'keyword_serp_preview_snapshots',
        payload: {
          items: [
            {
              keyword: 'is it safe to earn interest on USDT',
              snapshot: {
                organicResults: [
                  { domain: 'binance.com', url: 'https://binance.com/usdt-earn' },
                  { domain: 'binance.com', url: 'https://binance.com/usdt-savings' },
                  { domain: 'coinbase.com', url: 'https://coinbase.com/learn/usdt' },
                  { domain: 'trustwallet.com', url: 'https://trustwallet.com/usdt' },
                ],
              },
            },
          ],
        },
      }),
    );
    await artifactRepository.save(
      SeoBriefArtifact.create({
        runId: run.id,
        stage: 'keyword_expansion',
        artifactType: 'keyword_related_query_selections',
        payload: {
          items: [
            {
              keyword: 'is it safe to earn interest on USDT',
              selected: [
                {
                  keyword: 'how much interest is on USDT',
                  source: 'people_also_ask',
                  sourceText: 'How much interest is on USDT?',
                  reason: 'Best grounded related query',
                },
              ],
            },
          ],
        },
      }),
    );
    await artifactRepository.save(
      SeoBriefArtifact.create({
        runId: run.id,
        stage: 'keyword_research',
        artifactType: 'competitor_keyword_matches',
        payload: {
          candidates: [
            {
              text: 'is it safe to earn interest on USDT',
              intent: 'informational',
              candidateScore: 72,
              proxyEvaluation: {
                proxyDemandScore: 64,
                competitorMatchScore: 88,
                bestMatchType: 'same_intent',
                matchingDomainCount: 2,
                semanticMatches: [
                  {
                    competitorKeyword: 'earn usdt interest',
                    matchType: 'same_intent',
                    sourceDomain: 'trustwallet.com',
                  },
                ],
              },
            },
            {
              text: 'how much interest is on USDT',
              intent: 'informational',
              candidateScore: 59,
              proxyEvaluation: {
                proxyDemandScore: 41,
                competitorMatchScore: 66,
                bestMatchType: 'semantic_related',
                matchingDomainCount: 1,
                semanticMatches: [
                  {
                    competitorKeyword: 'USDT savings account',
                    matchType: 'semantic_related',
                    sourceDomain: 'trustwallet.com',
                  },
                ],
              },
            },
          ],
        },
      }),
    );
    await artifactRepository.save(
      SeoBriefArtifact.create({
        runId: run.id,
        stage: 'keyword_research',
        artifactType: 'ranked_keywords_universe',
        payload: {
          items: [
            {
              text: 'USDT savings account',
              sourceDomain: 'trustwallet.com',
              metrics: {
                searchVolume: 170,
                keywordDifficulty: 8,
                cpc: 0.4,
                intent: 'commercial',
                competitionLevel: 'LOW',
              },
              competitorEvidence: {
                domain: 'trustwallet.com',
                rankingUrl: 'https://trustwallet.com/stablecoin-earn/usdt',
                rankingTitle: 'Earn USDT Rewards',
                rankAbsolute: 3,
                estimatedTraffic: 51.68,
              },
              serpEvidence: {
                serpFeatures: ['organic', 'people_also_ask'],
              },
            },
          ],
        },
      }),
    );
    const handler = new BuildDirtyKeywordPoolHandler(runRepository, artifactRepository);

    const result = await handler.execute(new BuildDirtyKeywordPoolCommand(run.id));
    const artifacts = await artifactRepository.findByRunId(run.id);
    const payload = artifacts.find((artifact) => artifact.artifactType === 'dirty_keyword_pool')
      ?.payload as {
      candidateCount: number;
      candidates: Array<{
        evidence: Array<{ source: string }>;
        flags: {
          hasCompetitorKeywordMatch: boolean;
          hasRankedKeywordEvidence: boolean;
          hasSearchVolume: boolean;
        };
        metrics: {
          proxyDemandScore: number | null;
          sourceHypothesisSerpDomainConcentrationLabel?: string | null;
          sourceHypothesisSerpDomainHhi?: number | null;
          sourceHypothesisSerpDominantDomain?: string | null;
          sourceHypothesisSerpDominantDomainShare?: number | null;
          sourceHypothesisSerpResultCount?: number | null;
          sourceHypothesisSerpUniqueDomainCount?: number | null;
          searchVolume: number | null;
        };
        normalizedText: string;
        sources: string[];
        text: string;
      }>;
      duplicateEvidenceCount: number;
      sourceCounts: Record<string, number>;
    };

    expect(result.artifactType).toBe('dirty_keyword_pool');
    expect(payload.candidateCount).toBe(3);
    expect(payload.duplicateEvidenceCount).toBe(1);
    expect(payload.sourceCounts).toEqual({
      keyword_hypothesis: 2,
      selected_related_query: 1,
      serp_derived_candidate: 1,
    });
    expect(
      payload.candidates.find(
        (candidate) => candidate.normalizedText === 'how much interest is on usdt',
      ),
    ).toMatchObject({
      text: 'How much interest is on USDT',
      sources: ['serp_derived_candidate', 'selected_related_query'],
      evidence: [{ source: 'serp_derived_candidate' }, { source: 'selected_related_query' }],
      flags: {
        hasCompetitorKeywordMatch: false,
      },
      metrics: {
        proxyDemandScore: null,
        sourceHypothesisSerpDomainConcentrationLabel: 'medium',
        sourceHypothesisSerpDomainHhi: 0.375,
        sourceHypothesisSerpDominantDomain: 'binance.com',
        sourceHypothesisSerpDominantDomainShare: 0.5,
        sourceHypothesisSerpResultCount: 4,
        sourceHypothesisSerpUniqueDomainCount: 3,
      },
    });
    expect(
      payload.candidates.find(
        (candidate) => candidate.normalizedText === 'is it safe to earn interest on usdt',
      ),
    ).toMatchObject({
      metrics: {
        sourceHypothesisSerpDomainConcentrationLabel: 'medium',
        sourceHypothesisSerpDomainHhi: 0.375,
        sourceHypothesisSerpDominantDomain: 'binance.com',
        sourceHypothesisSerpDominantDomainShare: 0.5,
        sourceHypothesisSerpResultCount: 4,
        sourceHypothesisSerpUniqueDomainCount: 3,
      },
    });
    expect(
      payload.candidates.find((candidate) => candidate.normalizedText === 'usdt savings account'),
    ).toBeUndefined();
  });
});
