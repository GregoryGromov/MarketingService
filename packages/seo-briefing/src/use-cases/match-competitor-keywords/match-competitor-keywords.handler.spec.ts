import { describe, expect, it } from 'vitest';
import { SeoBriefArtifact, SeoBriefRun } from '../../index.js';
import type {
  AiCompetitorKeywordCandidateInput,
  GroupCandidateKeywordsParams,
  SeoBriefAiPort,
} from '../../ports/seo-brief-ai.port.js';
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

function createAiStub(result?: unknown): SeoBriefAiPort {
  const record = (result ?? {
    buckets: [],
    candidates: [],
    summary: { notes: [] },
  }) as {
    buckets?: Array<{
      bucketId?: string;
      description?: string;
      evidenceIds?: string[];
      name?: string;
      representativeKeywords?: string[];
    }>;
    candidates?: Array<{
      candidateId: string;
      keyword: string;
    }>;
    summary?: { notes?: string[] };
  };
  const candidateBucket = {
    bucketId: 'candidate_bucket_01',
    name: 'Candidate bucket',
    description: 'Candidate keyword group.',
    candidateIds: (record.candidates ?? []).map((candidate) => candidate.candidateId),
    representativeKeywords: (record.candidates ?? []).map((candidate) => candidate.keyword),
  };

  return {
    evaluateCompetitorKeywordMatches: async () => record,
    groupCompetitorKeywordEvidence: async () => ({
      buckets: record.buckets ?? [],
      summary: record.summary ?? { notes: [] },
    }),
    groupCandidateKeywords: async (params: GroupCandidateKeywordsParams) => ({
      buckets: [
        {
          ...candidateBucket,
          candidateIds: params.candidates.map(
            (candidate: AiCompetitorKeywordCandidateInput) => candidate.candidateId,
          ),
          representativeKeywords: params.candidates.map(
            (candidate: AiCompetitorKeywordCandidateInput) => candidate.keyword,
          ),
        },
      ],
      summary: { notes: ['Candidates grouped.'] },
    }),
    matchKeywordGroups: async () => ({
      matches: [
        {
          candidateBucketId: 'candidate_bucket_01',
          competitorBucketIds: (record.buckets ?? []).map(
            (bucket) => bucket.bucketId ?? 'bucket_01',
          ),
          matchType: 'direct',
          matchStrength: 90,
          reason: 'Candidate bucket maps to competitor evidence bucket.',
        },
      ],
      summary: { notes: ['Groups matched.'] },
    }),
    scoreCompetitorKeywordCandidateGroup: async () => ({
      candidates: record.candidates ?? [],
      summary: record.summary ?? { notes: [] },
    }),
  } as unknown as SeoBriefAiPort;
}

function createFailingAiStub(error: Error): SeoBriefAiPort {
  return {
    evaluateCompetitorKeywordMatches: async () => {
      throw error;
    },
    groupCompetitorKeywordEvidence: async () => {
      throw error;
    },
  } as unknown as SeoBriefAiPort;
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
    const handler = new MatchCompetitorKeywordsHandler(
      runRepository,
      artifactRepository,
      createAiStub(),
    );

    const result = await handler.execute(new MatchCompetitorKeywordsCommand(run.id));
    const artifacts = await artifactRepository.findByRunId(run.id);
    const payload = artifacts.find(
      (artifact) => artifact.artifactType === 'competitor_keyword_matches',
    )?.payload as {
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

  it('can evaluate competitor keyword matches through AI mode', async () => {
    const runRepository = new InMemorySeoBriefRunRepository();
    const artifactRepository = new InMemorySeoBriefArtifactRepository();
    const run = createRun();
    await runRepository.save(run);
    await artifactRepository.save(
      SeoBriefArtifact.create({
        runId: run.id,
        stage: 'created',
        artifactType: 'normalized_input',
        payload: {
          aiModelMode: 'pro',
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
              keyword: 'how to earn interest on USDT safely',
              productFitHypothesis: 'education_bridge',
              intentHint: 'informational',
              reason: 'Safety-first earning query',
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
          items: [],
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
              text: 'earn interest on usdt',
              sourceDomain: 'nexo.com',
              metrics: {
                searchVolume: 500,
                keywordDifficulty: 12,
              },
              competitorEvidence: {
                domain: 'nexo.com',
                rankingUrl: 'https://nexo.com/earn-crypto/usdt',
                rankAbsolute: 2,
                estimatedTraffic: 120,
              },
              serpEvidence: {
                serpFeatures: ['organic'],
              },
            },
          ],
        },
      }),
    );
    const ai = createAiStub({
      buckets: [
        {
          bucketId: 'bucket_01',
          name: 'USDT yield',
          description: 'USDT interest and yield queries.',
          evidenceIds: ['rk_0001'],
          representativeKeywords: ['earn interest on usdt'],
        },
      ],
      candidates: [
        {
          candidateId: 'cand_001',
          keyword: 'how to earn interest on USDT safely',
          bucketId: 'bucket_01',
          proxyDemandScore: 82,
          candidateScore: 76,
          bestMatchType: 'same_intent',
          matchingDomains: ['nexo.com'],
          matchedEvidenceIds: ['rk_0001'],
          riskLabel: 'safe',
          reason: 'Grounded in competitor yield evidence.',
          semanticMatches: [
            {
              evidenceId: 'rk_0001',
              competitorKeyword: 'earn interest on usdt',
              sourceDomain: 'nexo.com',
              matchType: 'same_intent',
              matchConfidence: 0.86,
              matchScore: 82,
              evidenceStrength: 80,
              why: 'Both queries ask about earning interest on USDT.',
            },
          ],
        },
      ],
      summary: { notes: ['AI grounded candidates in competitor evidence.'] },
    });
    const handler = new MatchCompetitorKeywordsHandler(runRepository, artifactRepository, ai);

    const result = await handler.execute(new MatchCompetitorKeywordsCommand(run.id, 'ai'));
    const artifacts = await artifactRepository.findByRunId(run.id);
    const payload = artifacts.find(
      (artifact) => artifact.artifactType === 'competitor_keyword_matches',
    )?.payload as {
      candidates: Array<{
        candidateScore: number;
        proxyEvaluation: {
          bestMatchType: string;
          matchingDomains: string[];
          proxyDemandScore: number;
        };
      }>;
      matchingMode: string;
    };

    expect(result.matchedCandidateCount).toBe(1);
    expect(payload.matchingMode).toBe('ai');
    expect(payload.candidates[0]).toMatchObject({
      candidateScore: 76,
      proxyEvaluation: {
        bestMatchType: 'same_intent',
        proxyDemandScore: 82,
        matchingDomains: ['nexo.com'],
      },
    });
  });

  it('falls back to deterministic matching when AI competitor matching fails', async () => {
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
              keyword: 'how to earn interest on USDT safely',
              productFitHypothesis: 'education_bridge',
              intentHint: 'informational',
              reason: 'Safety-first earning query',
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
          items: [],
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
              text: 'earn interest on usdt',
              sourceDomain: 'nexo.com',
              metrics: {
                searchVolume: 500,
              },
              competitorEvidence: {
                rankAbsolute: 2,
                estimatedTraffic: 120,
              },
              serpEvidence: {
                serpFeatures: ['organic'],
              },
            },
          ],
        },
      }),
    );
    const handler = new MatchCompetitorKeywordsHandler(
      runRepository,
      artifactRepository,
      createFailingAiStub(new Error('AI timeout')),
    );

    const result = await handler.execute(new MatchCompetitorKeywordsCommand(run.id, 'ai'));
    const artifacts = await artifactRepository.findByRunId(run.id);
    const payload = artifacts.find(
      (artifact) => artifact.artifactType === 'competitor_keyword_matches',
    )?.payload as {
      aiError: string | null;
      aiEvaluationStatus: string;
      algorithmicFallbackCandidateCount: number;
      candidateCount: number;
      candidates: Array<{
        candidateScoreComponents: {
          fallbackReason?: string;
          matchingMode?: string;
        };
        proxyEvaluation: {
          semanticMatches: Array<{ competitorKeyword: string }>;
        };
      }>;
      matchingMode: string;
    };

    expect(result.candidateCount).toBe(1);
    expect(result.matchedCandidateCount).toBe(1);
    expect(payload.matchingMode).toBe('ai');
    expect(payload.aiEvaluationStatus).toBe('failed_fallback_to_algorithmic');
    expect(payload.algorithmicFallbackCandidateCount).toBe(1);
    expect(payload.aiError).toBe('AI timeout');
    expect(payload.candidates[0]?.candidateScoreComponents).toMatchObject({
      matchingMode: 'algorithmic_fallback',
      fallbackReason: 'AI matching failed; deterministic fallback was used.',
    });
    expect(payload.candidates[0]?.proxyEvaluation.semanticMatches[0]).toMatchObject({
      competitorKeyword: 'earn interest on usdt',
    });
  });
});
