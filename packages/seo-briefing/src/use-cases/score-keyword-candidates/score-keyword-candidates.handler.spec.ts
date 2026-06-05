import { describe, expect, it } from 'vitest';
import {
  SeoBriefArtifact,
  SeoBriefRun,
} from '../../index.js';
import {
  InMemorySeoBriefArtifactRepository,
  InMemorySeoBriefRunRepository,
  InMemorySeoBriefRunStepRepository,
} from '../../testing/run-test-harness.js';
import { ScoreKeywordCandidatesCommand } from './score-keyword-candidates.command.js';
import { ScoreKeywordCandidatesHandler } from './score-keyword-candidates.handler.js';

function createRun(): SeoBriefRun {
  return SeoBriefRun.create({
    topicSeed: 'idle USDT yield',
    country: 'Nigeria',
    language: 'English',
    audience: 'USDT holders',
    productName: 'Reinforce',
    productDescription: 'Helps users make idle USDT productive',
    keyMessage: 'Explain options and risks clearly.',
    brandMemorySnapshot: {
      brandName: 'Reinforce',
      productDescription: 'Helps users make idle USDT productive',
      targetAudience: 'USDT holders',
      approvedFacts: [],
      forbiddenClaims: ['guaranteed returns'],
      glossary: {},
      bannedPhrases: [],
      requiredPhrases: [],
      brandDocs: [],
      adaptationPromptRules: null,
    },
  });
}

describe('ScoreKeywordCandidatesHandler', () => {
  it('scores dirty pool candidates and stores accepted, maybe, and rejected decisions', async () => {
    const runRepository = new InMemorySeoBriefRunRepository();
    const stepRepository = new InMemorySeoBriefRunStepRepository();
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
        stage: 'keyword_triage',
        artifactType: 'dirty_keyword_pool',
        payload: {
          artifactVersion: 'dirty_keyword_pool_v1',
          candidateCount: 4,
          candidates: [
            {
              text: 'is it safe to earn interest on USDT',
              normalizedText: 'is it safe to earn interest on usdt',
              sources: ['keyword_hypothesis', 'serp_derived_candidate'],
              sourceCount: 2,
              metrics: {
                searchVolume: null,
                keywordDifficulty: null,
                cpc: null,
                intent: 'informational',
                bestRankAbsolute: 2,
              },
              flags: {
                isInitialHypothesis: true,
                hasSelectedRelatedQuery: false,
                hasRankedKeywordEvidence: false,
                hasSearchVolume: false,
              },
              evidence: [
                {
                  source: 'keyword_hypothesis',
                  reason: 'Safety pain from keyword hypothesis.',
                },
                {
                  source: 'serp_derived_candidate',
                  sourceKeyword: 'safe usdt earning',
                  sourceText: 'Is it safe to earn interest on USDT?',
                },
              ],
            },
            {
              text: 'USDT savings account',
              normalizedText: 'usdt savings account',
              sources: ['ranked_keywords'],
              sourceCount: 1,
              metrics: {
                searchVolume: 170,
                keywordDifficulty: 8,
                cpc: 0.4,
                intent: 'commercial',
                bestRankAbsolute: 3,
              },
              flags: {
                isInitialHypothesis: false,
                hasSelectedRelatedQuery: false,
                hasRankedKeywordEvidence: true,
                hasSearchVolume: true,
              },
              evidence: [
                {
                  source: 'ranked_keywords',
                  sourceDomain: 'trustwallet.com',
                  reason: 'Competitor ranks for this query.',
                },
              ],
            },
            {
              text: 'free USDT generator',
              normalizedText: 'free usdt generator',
              sources: ['ranked_keywords'],
              sourceCount: 1,
              metrics: {
                searchVolume: 90,
                keywordDifficulty: 2,
                cpc: null,
                intent: 'transactional',
                bestRankAbsolute: 9,
              },
              flags: {
                isInitialHypothesis: false,
                hasSelectedRelatedQuery: false,
                hasRankedKeywordEvidence: true,
                hasSearchVolume: true,
              },
              evidence: [
                {
                  source: 'ranked_keywords',
                  sourceDomain: 'scam.example',
                  reason: 'Risky query from competitor universe.',
                },
              ],
            },
            {
              text: 'USDT logo download',
              normalizedText: 'usdt logo download',
              sources: ['ranked_keywords'],
              sourceCount: 1,
              metrics: {
                searchVolume: 50,
                keywordDifficulty: 2,
                cpc: null,
                intent: 'navigational',
                bestRankAbsolute: 4,
              },
              flags: {
                isInitialHypothesis: false,
                hasSelectedRelatedQuery: false,
                hasRankedKeywordEvidence: true,
                hasSearchVolume: true,
              },
              evidence: [
                {
                  source: 'ranked_keywords',
                  sourceDomain: 'example.com',
                  reason: 'Noise query that must not continue.',
                },
              ],
            },
          ],
        },
      }),
    );
    const handler = new ScoreKeywordCandidatesHandler(runRepository, stepRepository, artifactRepository);

    const result = await handler.execute(new ScoreKeywordCandidatesCommand(run.id));
    const artifacts = await artifactRepository.findByRunId(run.id);
    const saved = artifacts.find(
      (artifact) => artifact.artifactType === 'keyword_candidate_scoring',
    )?.payload as {
      accepted: Array<{ keyword: string; sourceCandidate: { text: string } }>;
      acceptedCount: number;
      hardExcludedCandidateCount: number;
      maybe: Array<{ keyword: string; sourceCandidate: { text: string } }>;
      maybeCount: number;
      rejected: Array<{ keyword: string; sourceCandidate: { text: string } }>;
      rejectedCount: number;
      summary: {
        hardExcludedCandidateCount: number;
        keptAfterNoiseCount: number;
        llmCallCount: number;
      };
      filteringMode: string;
      stagedFiltering: { buckets: Array<{ bucket: string; acceptedCount: number }> };
    };
    const steps = await stepRepository.findByRunId(run.id);

    expect(result).toMatchObject({
      artifactType: 'keyword_candidate_scoring',
      acceptedCount: 2,
      maybeCount: 0,
      rejectedCount: 2,
    });
    expect(saved).toMatchObject({
      filteringMode: 'deterministic_staged_filtering',
      acceptedCount: 2,
      maybeCount: 0,
      rejectedCount: 2,
      hardExcludedCandidateCount: 2,
      maybe: [],
      rejected: [
        {
          keyword: 'free USDT generator',
          sourceCandidate: {
            text: 'free USDT generator',
          },
        },
        {
          keyword: 'USDT logo download',
          sourceCandidate: {
            text: 'USDT logo download',
          },
        },
      ],
      summary: {
        hardExcludedCandidateCount: 2,
        keptAfterNoiseCount: 2,
        llmCallCount: 0,
      },
    });
    expect(saved.accepted).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          keyword: 'is it safe to earn interest on USDT',
          bucket: 'wallet_safety',
          productFitLabel: 'high',
        }),
        expect.objectContaining({
          keyword: 'USDT savings account',
          bucket: 'stablecoin_yield',
          productFitLabel: 'high',
        }),
      ]),
    );
    expect(saved.stagedFiltering.buckets.some((bucket) => bucket.bucket === 'stablecoin_yield')).toBe(
      true,
    );
    expect(steps[0]).toMatchObject({
      stage: 'keyword_triage',
      status: 'completed',
    });
    expect((await runRepository.findById(run.id))?.status).toBe('awaiting_confirmation');
  });

  it('filters large dirty pools without calling an LLM scoring batch', async () => {
    const runRepository = new InMemorySeoBriefRunRepository();
    const stepRepository = new InMemorySeoBriefRunStepRepository();
    const artifactRepository = new InMemorySeoBriefArtifactRepository();
    const run = createRun();
    const candidates = Array.from({ length: 56 }, (_, index) => ({
      text: `USDT savings candidate ${index + 1}`,
      normalizedText: `usdt savings candidate ${index + 1}`,
      sources: ['ranked_keywords'],
      sourceCount: 1,
      metrics: {
        searchVolume: 100 + index,
        keywordDifficulty: 10,
        intent: 'commercial',
        bestRankAbsolute: 3,
      },
      flags: {
        isInitialHypothesis: false,
        hasSelectedRelatedQuery: false,
        hasRankedKeywordEvidence: true,
        hasSearchVolume: true,
      },
      evidence: [
        {
          source: 'ranked_keywords',
          sourceDomain: 'competitor.example',
          reason: 'Synthetic competitor evidence.',
        },
      ],
    }));

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
        stage: 'keyword_triage',
        artifactType: 'dirty_keyword_pool',
        payload: {
          artifactVersion: 'dirty_keyword_pool_v1',
          candidateCount: candidates.length,
          candidates,
        },
      }),
    );
    const handler = new ScoreKeywordCandidatesHandler(runRepository, stepRepository, artifactRepository);

    const result = await handler.execute(new ScoreKeywordCandidatesCommand(run.id));
    const artifacts = await artifactRepository.findByRunId(run.id);
    const saved = artifacts.find(
      (artifact) => artifact.artifactType === 'keyword_candidate_scoring',
    )?.payload as {
      accepted: Array<{ keyword: string }>;
      acceptedPerBucketLimit: number;
      aiScoredCandidateCount: number;
      maybe: Array<{ keyword: string }>;
      maybePerBucketLimit: number;
      rejected: Array<{ keyword: string }>;
      stagedFiltering: { buckets: Array<{ bucket: string; acceptedCount: number; maybeCount: number }> };
    };

    expect(saved.aiScoredCandidateCount).toBe(0);
    expect(saved.accepted.length).toBeLessThanOrEqual(saved.acceptedPerBucketLimit);
    expect(saved.maybe.length).toBeLessThanOrEqual(saved.maybePerBucketLimit);
    expect(saved.rejected.length).toBeGreaterThan(0);
    expect(saved.stagedFiltering.buckets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          bucket: 'stablecoin_yield',
          acceptedCount: saved.acceptedPerBucketLimit,
          maybeCount: saved.maybePerBucketLimit,
        }),
      ]),
    );
    expect(result).toMatchObject({
      artifactType: 'keyword_candidate_scoring',
      acceptedCount: saved.acceptedPerBucketLimit,
      maybeCount: saved.maybePerBucketLimit,
      rejectedCount: 40,
    });
  });
});
