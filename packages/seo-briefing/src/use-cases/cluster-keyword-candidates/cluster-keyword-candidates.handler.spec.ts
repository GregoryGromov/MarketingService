import { describe, expect, it } from 'vitest';
import {
  type ClusterKeywordsParams,
  type ClusterKeywordsResult,
  SeoBriefAiPort,
  SeoBriefArtifact,
  SeoBriefRun,
} from '../../index.js';
import {
  InMemorySeoBriefArtifactRepository,
  InMemorySeoBriefRunRepository,
  InMemorySeoBriefRunStepRepository,
} from '../../testing/run-test-harness.js';
import { ClusterKeywordCandidatesCommand } from './cluster-keyword-candidates.command.js';
import { ClusterKeywordCandidatesHandler } from './cluster-keyword-candidates.handler.js';

class FakeSeoBriefAiPort extends SeoBriefAiPort {
  clusterCalls: ClusterKeywordsParams[] = [];

  extractContext(): Promise<never> {
    throw new Error('Not implemented in test');
  }

  extractUserPainScenarios(): Promise<never> {
    throw new Error('Not implemented in test');
  }

  expandKeywords(): Promise<never> {
    throw new Error('Not implemented in test');
  }

  triageKeywords(): Promise<never> {
    throw new Error('Not implemented in test');
  }

  clusterKeywords(params: ClusterKeywordsParams): Promise<ClusterKeywordsResult> {
    this.clusterCalls.push(params);

    return Promise.resolve({
      clusters: [
        {
          label: 'Safe USDT earning options',
          userIntent: 'Beginner wants to understand safe ways to earn on idle USDT.',
          primaryKeyword: 'is it safe to earn interest on USDT',
          intent: 'informational',
          keywords: [
            'is it safe to earn interest on USDT',
            'USDT savings account',
            'invented should be removed',
          ],
          secondaryKeywords: ['USDT savings account'],
          questions: ['is it safe to earn interest on USDT'],
          supportingItems: ['USDT savings account'],
          competitorUrls: [
            {
              domain: 'trustwallet.com',
              url: 'https://trustwallet.com/stablecoin-earn/usdt',
              title: 'Earn USDT Rewards',
              rankAbsolute: 3,
            },
          ],
          sourceConfidence: 'high',
          evidenceSummary: 'Safety query and ranked keyword evidence point to one intent.',
          rationale: 'Both candidates address beginner-safe USDT earning.',
        },
      ],
    });
  }

  selectRelatedKeywords(): Promise<never> {
    throw new Error('Not implemented in test');
  }

  classifySerpDomains(): Promise<never> {
    throw new Error('Not implemented in test');
  }

  scoreDirtyKeywordCandidates(): Promise<never> {
    throw new Error('Not implemented in test');
  }

  buildProductBridge(): Promise<never> {
    throw new Error('Not implemented in test');
  }

  explainClusterSelection(): Promise<never> {
    throw new Error('Not implemented in test');
  }

  generateSeoBrief(): Promise<never> {
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

describe('ClusterKeywordCandidatesHandler', () => {
  it('clusters accepted and maybe candidates while excluding rejected candidates', async () => {
    const runRepository = new InMemorySeoBriefRunRepository();
    const stepRepository = new InMemorySeoBriefRunStepRepository();
    const artifactRepository = new InMemorySeoBriefArtifactRepository();
    const ai = new FakeSeoBriefAiPort();
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
        artifactType: 'keyword_candidate_scoring',
        payload: {
          artifactVersion: 'keyword_candidate_scoring_v1',
          accepted: [
            {
              keyword: 'is it safe to earn interest on USDT',
              status: 'accepted',
              totalScore: 87,
              scores: {
                topicFit: 90,
                productFit: 82,
                audienceFit: 88,
                intentFit: 86,
                riskCompliance: 92,
                evidence: 85,
              },
              fit: {
                topicFit: 'strong',
                productFit: 'strong',
                audienceFit: 'strong',
                intentFit: 'strong',
                riskCompliance: 'strong',
                evidence: 'strong',
              },
              intent: 'informational',
              stage: 'awareness',
              reasons: ['Direct safety fit.'],
              riskFlags: [],
              evidenceNotes: ['Grounded by SERP.'],
              sourceCandidate: {
                text: 'is it safe to earn interest on USDT',
                sources: ['keyword_hypothesis'],
                metrics: {
                  intent: 'informational',
                  bestRankAbsolute: 2,
                },
                evidence: [],
              },
            },
          ],
          maybe: [
            {
              keyword: 'USDT savings account',
              status: 'maybe',
              totalScore: 68,
              scores: {
                topicFit: 72,
                productFit: 62,
                audienceFit: 65,
                intentFit: 70,
                riskCompliance: 74,
                evidence: 80,
              },
              fit: {
                topicFit: 'moderate',
                productFit: 'moderate',
                audienceFit: 'moderate',
                intentFit: 'moderate',
                riskCompliance: 'moderate',
                evidence: 'strong',
              },
              intent: 'commercial',
              stage: 'consideration',
              reasons: ['Useful supporting query.'],
              riskFlags: ['Needs careful return framing.'],
              evidenceNotes: ['Has ranked keyword evidence.'],
              sourceCandidate: {
                text: 'USDT savings account',
                sources: ['ranked_keywords'],
                metrics: {
                  searchVolume: 170,
                  keywordDifficulty: 8,
                  intent: 'commercial',
                  bestRankAbsolute: 3,
                  proxyDemandScore: 64,
                  competitorMatchScore: 88,
                  candidateScore: 72,
                },
                evidence: [
                  {
                    source: 'ranked_keywords',
                    sourceDomain: 'trustwallet.com',
                    rankingUrl: 'https://trustwallet.com/stablecoin-earn/usdt',
                    rankingTitle: 'Earn USDT Rewards',
                    rankAbsolute: 3,
                  },
                ],
              },
            },
          ],
          rejected: [
            {
              keyword: 'free USDT generator',
              status: 'rejected',
              totalScore: 16,
            },
          ],
        },
      }),
    );
    const handler = new ClusterKeywordCandidatesHandler(
      runRepository,
      stepRepository,
      artifactRepository,
      ai,
    );

    const result = await handler.execute(new ClusterKeywordCandidatesCommand(run.id));
    const artifacts = await artifactRepository.findByRunId(run.id);
    const saved = artifacts.find((artifact) => artifact.artifactType === 'cluster_snapshot')
      ?.payload as {
      clusterCount: number;
      clusters: Array<{
        candidateItems: unknown[];
        competitorUrls: Array<{ domain: string; url: string }>;
        keywords: string[];
        primaryKeywordCandidate: string;
        secondaryKeywords: string[];
        supportingItemDetails: Array<{
          candidateScore: number;
          metrics: { proxyDemandScore: number };
          sources: string[];
          text: string;
        }>;
      }>;
      excludedRejectedCandidateCount: number;
      inputCandidateCount: number;
    };
    const steps = await stepRepository.findByRunId(run.id);

    expect(result).toMatchObject({
      artifactType: 'cluster_snapshot',
      inputCandidateCount: 2,
      clusterCount: 1,
    });
    expect(ai.clusterCalls).toHaveLength(1);
    expect(ai.clusterCalls[0]?.modelMode).toBe('pro');
    expect(ai.clusterCalls[0]?.keywords).toEqual([
      'is it safe to earn interest on USDT',
      'USDT savings account',
    ]);
    expect(ai.clusterCalls[0]?.rejectedKeywords).toEqual([]);
    expect(ai.clusterCalls[0]?.candidates?.map((candidate) => candidate.status)).toEqual([
      'accepted',
      'maybe',
    ]);
    expect(ai.clusterCalls[0]?.candidates?.[1]?.metrics).toMatchObject({
      proxyDemandScore: 64,
      competitorMatchScore: 88,
      candidateScore: 72,
    });
    expect(saved).toMatchObject({
      clusterCount: 1,
      inputCandidateCount: 2,
      excludedRejectedCandidateCount: 1,
      clusters: [
        {
          primaryKeywordCandidate: 'is it safe to earn interest on USDT',
          secondaryKeywords: ['USDT savings account'],
          keywords: ['is it safe to earn interest on USDT', 'USDT savings account'],
          competitorUrls: [
            {
              domain: 'trustwallet.com',
              url: 'https://trustwallet.com/stablecoin-earn/usdt',
            },
          ],
        },
      ],
    });
    expect(saved.clusters[0]?.supportingItemDetails).toMatchObject([
      {
        text: 'USDT savings account',
        sources: ['ranked_keywords'],
        candidateScore: 68,
        metrics: {
          proxyDemandScore: 64,
        },
      },
    ]);
    expect(saved.clusters[0]?.candidateItems).toHaveLength(2);
    expect(JSON.stringify(saved)).not.toContain('invented should be removed');
    expect(JSON.stringify(saved)).not.toContain('free USDT generator');
    expect(steps[0]).toMatchObject({
      stage: 'clustering',
      status: 'completed',
    });
    expect((await runRepository.findById(run.id))?.status).toBe('awaiting_confirmation');
  });

  it('requires scored keyword candidates before clustering', async () => {
    const runRepository = new InMemorySeoBriefRunRepository();
    const stepRepository = new InMemorySeoBriefRunStepRepository();
    const artifactRepository = new InMemorySeoBriefArtifactRepository();
    const ai = new FakeSeoBriefAiPort();
    const run = createRun();
    await runRepository.save(run);
    await artifactRepository.save(
      SeoBriefArtifact.create({
        runId: run.id,
        stage: 'keyword_research',
        artifactType: 'dirty_keyword_pool',
        payload: {
          artifactVersion: 'dirty_keyword_pool_v1',
          candidates: [
            {
              keyword: 'is it safe to earn interest on USDT',
              status: 'accepted',
            },
          ],
        },
      }),
    );
    const handler = new ClusterKeywordCandidatesHandler(
      runRepository,
      stepRepository,
      artifactRepository,
      ai,
    );

    await expect(handler.execute(new ClusterKeywordCandidatesCommand(run.id))).rejects.toThrow(
      'Score keyword candidates before clustering',
    );
    expect(ai.clusterCalls).toHaveLength(0);
    expect(await stepRepository.findByRunId(run.id)).toHaveLength(0);
  });
});
