import { describe, expect, it } from 'vitest';
import { SeoBriefArtifact, SeoBriefRun } from '../../index.js';
import type {
  ScoreDirtyKeywordCandidateInput,
  ScoreDirtyKeywordCandidatesResult,
  SeoBriefAiPort,
} from '../../ports/seo-brief-ai.port.js';
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

function createAiPort(callLog: number[] = []): SeoBriefAiPort {
  return {
    scoreDirtyKeywordCandidates: async ({
      candidates,
    }: {
      candidates: ScoreDirtyKeywordCandidateInput[];
    }) => {
      callLog.push(candidates.length);
      const result: ScoreDirtyKeywordCandidatesResult = {
        accepted: [],
        maybe: [],
        rejected: [],
        summary: {
          acceptedCount: 0,
          maybeCount: 0,
          rejectedCount: 0,
          notes: ['AI test stub scored provided candidates only.'],
        },
      };

      for (const candidate of candidates) {
        const normalized = candidate.keyword.toLowerCase();
        const rejected =
          normalized.includes('free usdt') ||
          normalized.includes('generator') ||
          normalized.includes('logo download');
        const scored = {
          keyword: candidate.keyword,
          status: rejected ? ('rejected' as const) : ('accepted' as const),
          totalScore: rejected ? 5 : 82,
          scores: {
            topicFit: rejected ? 5 : 85,
            productFit: rejected ? 5 : 82,
            audienceFit: rejected ? 5 : 78,
            intentFit: rejected ? 5 : 80,
            riskCompliance: rejected ? 0 : 88,
            evidence: rejected ? 20 : 75,
          },
          fit: {
            topicFit: rejected ? ('none' as const) : ('strong' as const),
            productFit: rejected ? ('none' as const) : ('strong' as const),
            audienceFit: rejected ? ('none' as const) : ('strong' as const),
            intentFit: rejected ? ('none' as const) : ('strong' as const),
            riskCompliance: rejected ? ('none' as const) : ('strong' as const),
            evidence: rejected ? ('weak' as const) : ('strong' as const),
          },
          intent: rejected ? ('navigational' as const) : ('informational' as const),
          stage: rejected ? ('awareness' as const) : ('consideration' as const),
          reasons: [
            rejected
              ? 'Rejected by AI test stub as noise.'
              : 'Accepted by AI test stub as relevant.',
          ],
          riskFlags: rejected ? ['test_noise'] : [],
          evidenceNotes: candidate.evidenceSummary.slice(0, 2),
        };

        if (rejected) {
          result.rejected.push(scored);
        } else {
          result.accepted.push(scored);
        }
      }

      result.summary.acceptedCount = result.accepted.length;
      result.summary.rejectedCount = result.rejected.length;

      return result;
    },
  } as unknown as SeoBriefAiPort;
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
    const handler = new ScoreKeywordCandidatesHandler(
      runRepository,
      stepRepository,
      artifactRepository,
      createAiPort(),
    );

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
      stagedFiltering: {
        stages: Array<{ stage: string; acceptedCount?: number; keptCount?: number }>;
      };
    };
    const steps = await stepRepository.findByRunId(run.id);

    expect(result).toMatchObject({
      artifactType: 'keyword_candidate_scoring',
      acceptedCount: 2,
      maybeCount: 0,
      rejectedCount: 2,
    });
    expect(saved).toMatchObject({
      filteringMode: 'ai_staged_filtering',
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
        llmCallCount: 3,
      },
    });
    expect(saved.accepted).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          keyword: 'is it safe to earn interest on USDT',
          aiStage: 'ai_final_calibration',
        }),
        expect.objectContaining({
          keyword: 'USDT savings account',
          aiStage: 'ai_final_calibration',
        }),
      ]),
    );
    expect(saved.stagedFiltering.stages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          stage: 'ai_noise_and_eligibility',
          keptCount: 2,
        }),
      ]),
    );
    expect(steps[0]).toMatchObject({
      stage: 'keyword_triage',
      status: 'completed',
    });
    expect((await runRepository.findById(run.id))?.status).toBe('awaiting_confirmation');
  });

  it('filters large dirty pools through compact AI batches', async () => {
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
    const callLog: number[] = [];
    const handler = new ScoreKeywordCandidatesHandler(
      runRepository,
      stepRepository,
      artifactRepository,
      createAiPort(callLog),
    );

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
      summary: { llmCallCount: number };
      stagedFiltering: { stages: Array<{ stage: string; aiCallCount: number }> };
    };

    expect(saved.aiScoredCandidateCount).toBe(candidates.length);
    expect(saved.accepted.length).toBe(candidates.length);
    expect(saved.maybe.length).toBe(0);
    expect(saved.rejected.length).toBe(0);
    expect(saved.summary.llmCallCount).toBe(6);
    expect(callLog).toEqual([50, 6, 40, 16, 40, 16]);
    expect(saved.stagedFiltering.stages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          stage: 'ai_fit_scoring',
          aiCallCount: 2,
        }),
      ]),
    );
    expect(result).toMatchObject({
      artifactType: 'keyword_candidate_scoring',
      acceptedCount: candidates.length,
      maybeCount: 0,
      rejectedCount: 0,
    });
  });
});
