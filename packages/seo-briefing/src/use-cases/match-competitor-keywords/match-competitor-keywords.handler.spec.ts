import { describe, expect, it } from 'vitest';
import { SeoBriefArtifact, SeoBriefRun } from '../../index.js';
import {
  InMemorySeoBriefArtifactRepository,
  InMemorySeoBriefRunRepository,
} from '../../testing/run-test-harness.js';
import { MatchCompetitorKeywordsCommand } from './match-competitor-keywords.command.js';
import { MatchCompetitorKeywordsHandler } from './match-competitor-keywords.handler.js';

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

describe('MatchCompetitorKeywordsHandler', () => {
  it('matches candidate queries against competitor ranked keywords without copying volume', async () => {
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
          hypotheses: [
            {
              keyword: 'how to earn interest on USDT',
              productFitHypothesis: 'education_bridge',
              intentHint: 'informational',
              reason: 'Beginner earning question',
              riskFlags: [],
            },
            {
              keyword: 'USDT logo download',
              productFitHypothesis: 'weak',
              intentHint: 'navigational',
              reason: 'Noise query',
              riskFlags: [],
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
              keyword: 'how to earn interest on USDT',
              similarSearchQueries: [
                {
                  query: 'Can I earn interest on USDT',
                  source: 'people_also_ask',
                  sourceText: 'Can I earn interest on USDT?',
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
        stage: 'keyword_research',
        artifactType: 'competitor_keyword_map',
        payload: {
          items: [
            {
              text: 'earn usdt interest',
              sourceDomain: 'nexo.com',
              metrics: {
                searchVolume: 500,
                keywordDifficulty: 12,
                cpc: 1.2,
                intent: 'commercial',
                competitionLevel: 'LOW',
              },
              competitorEvidence: {
                domain: 'nexo.com',
                rankingUrl: 'https://nexo.com/earn-crypto/usdt',
                rankingTitle: 'Earn interest on USDT',
                rankAbsolute: 2,
                estimatedTraffic: 120,
              },
              serpEvidence: {
                serpFeatures: ['organic', 'people_also_ask'],
              },
            },
            {
              text: 'trust wallet usdt earn',
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
                rankAbsolute: 4,
                estimatedTraffic: 51.68,
              },
              serpEvidence: {
                serpFeatures: ['organic'],
              },
            },
          ],
        },
      }),
    );
    const handler = new MatchCompetitorKeywordsHandler(runRepository, artifactRepository);

    const result = await handler.execute(new MatchCompetitorKeywordsCommand(run.id));
    const artifacts = await artifactRepository.findByRunId(run.id);
    const payload = artifacts.find((artifact) => artifact.artifactType === 'competitor_keyword_matches')
      ?.payload as {
      candidateCount: number;
      candidates: Array<{
        candidateScore: number;
        metrics?: { searchVolume?: number | null };
        normalizedText: string;
        proxyEvaluation: {
          bestMatchType: string;
          matchingDomainCount: number;
          proxyDemandScore: number;
          semanticMatches: Array<{ competitorKeyword: string; matchType: string }>;
        };
        riskLabel: string;
      }>;
      matchedCandidateCount: number;
    };

    expect(result.artifactType).toBe('competitor_keyword_matches');
    expect(result.candidateCount).toBe(3);
    expect(result.competitorKeywordCount).toBe(2);
    expect(result.matchedCandidateCount).toBeGreaterThanOrEqual(2);
    expect(payload.candidateCount).toBe(3);
    expect(
      payload.candidates.find(
        (candidate) => candidate.normalizedText === 'how to earn interest on usdt',
      ),
    ).toMatchObject({
      proxyEvaluation: {
        bestMatchType: 'near_match',
        matchingDomainCount: 2,
      },
    });
    const matched = payload.candidates.find(
      (candidate) => candidate.normalizedText === 'how to earn interest on usdt',
    );
    expect(matched?.proxyEvaluation.proxyDemandScore).toBeGreaterThan(0);
    expect(matched?.candidateScore).toBeGreaterThan(0);
    expect(matched?.metrics?.searchVolume).toBeUndefined();
    expect(
      payload.candidates.find((candidate) => candidate.normalizedText === 'usdt logo download'),
    ).toMatchObject({
      riskLabel: 'exclude',
    });
  });
});
