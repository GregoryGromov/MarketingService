import { describe, expect, it } from 'vitest';
import {
  type ReviewClusterProductFitParams,
  type ReviewClusterProductFitResult,
  SeoBriefAiPort,
  SeoBriefArtifact,
  SeoBriefRun,
} from '../../index.js';
import {
  InMemorySeoBriefArtifactRepository,
  InMemorySeoBriefRunRepository,
  InMemorySeoBriefRunStepRepository,
} from '../../testing/run-test-harness.js';
import { ReviewClusterProductFitCommand } from './review-cluster-product-fit.command.js';
import { ReviewClusterProductFitHandler } from './review-cluster-product-fit.handler.js';

class FakeSeoBriefAiPort extends SeoBriefAiPort {
  reviewCalls: ReviewClusterProductFitParams[] = [];

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

  clusterKeywords(): Promise<never> {
    throw new Error('Not implemented in test');
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

  reviewClusterProductFit(
    params: ReviewClusterProductFitParams,
  ): Promise<ReviewClusterProductFitResult> {
    this.reviewCalls.push(params);

    return Promise.resolve({
      clusterProductFit: [
        {
          clusterName: 'Safe USDT earning options',
          productFitScore: 84,
          productFitType: 'education_bridge',
          decision: 'approve',
          productInsertionAngle: 'Use Reinforce as a careful education-first next step.',
          whereToInsert: 'After explaining common earning options and risks.',
          whatNotToClaim: ['Do not promise guaranteed yield.'],
          reason: 'The cluster is risk-aware and naturally supports an educational product bridge.',
        },
        {
          clusterName: 'USDT cash-out workflows',
          productFitScore: 58,
          productFitType: 'workflow_bridge',
          decision: 'supporting_only',
          productInsertionAngle: 'Use as supporting context for wallet workflow education.',
          whereToInsert: 'As an internal-link support article, not the main product page.',
          whatNotToClaim: ['Do not imply Reinforce is a cash-out tool.'],
          reason: 'Workflow context is relevant, but the product is not the direct answer.',
        },
        {
          clusterName: 'Unknown AI cluster',
          productFitScore: 99,
          productFitType: 'direct_solution',
          decision: 'approve',
          productInsertionAngle: 'Should be ignored.',
          whereToInsert: 'Should be ignored.',
          whatNotToClaim: [],
          reason: 'Should be ignored because the cluster is not in the input.',
        },
      ],
    });
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
    keyMessage: 'Explain options and risks clearly.',
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

describe('ReviewClusterProductFitHandler', () => {
  it('reviews intent clusters for Product Fit and stores decisions with source clusters', async () => {
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
        stage: 'clustering',
        artifactType: 'cluster_snapshot',
        payload: {
          artifactVersion: 'keyword_intent_clusters_v1',
          clusters: [
            {
              clusterName: 'Safe USDT earning options',
              userIntent: 'Beginner wants to know if earning on USDT is safe.',
              primaryKeywordCandidate: 'is it safe to earn interest on USDT',
              intent: 'informational',
              keywords: ['is it safe to earn interest on USDT', 'USDT savings account'],
              secondaryKeywords: ['USDT savings account'],
              questions: ['is USDT staking safe'],
              supportingItems: ['USDT savings account'],
              supportingItemDetails: [
                {
                  text: 'USDT savings account',
                  originType: 'ranked_keywords',
                  sources: ['ranked_keywords', 'dirty_keyword_pool'],
                  candidateScore: 68,
                  metrics: {
                    searchVolume: 170,
                    bestRankAbsolute: 3,
                    proxyDemandScore: 64,
                    competitorMatchScore: 88,
                    candidateScore: 72,
                  },
                  whyInCluster: 'Ranked keyword evidence supports the safety intent.',
                  sourceCandidate: {
                    text: 'USDT savings account',
                    sources: ['ranked_keywords'],
                  },
                },
              ],
              competitorUrls: [
                {
                  domain: 'trustwallet.com',
                  url: 'https://trustwallet.com/stablecoin-earn/usdt',
                  title: 'Earn USDT Rewards',
                  rankAbsolute: 3,
                },
              ],
              sourceConfidence: 'high',
              evidenceSummary: 'SERP and ranked keyword evidence support safety intent.',
            },
            {
              clusterName: 'USDT cash-out workflows',
              userIntent: 'User wants to move from USDT to local money.',
              primaryKeywordCandidate: 'how to cash out USDT to naira',
              intent: 'informational',
              keywords: ['how to cash out USDT to naira'],
              secondaryKeywords: [],
              questions: [],
              supportingItems: [],
              competitorUrls: [],
              sourceConfidence: 'medium',
              evidenceSummary: 'Workflow adjacent to the topic.',
            },
            {
              clusterName: 'Unreviewed fallback cluster',
              userIntent: 'AI misses this cluster.',
              primaryKeywordCandidate: 'USDT private key recovery',
              intent: 'informational',
              keywords: ['USDT private key recovery'],
              secondaryKeywords: [],
              questions: [],
              supportingItems: [],
              competitorUrls: [],
              sourceConfidence: 'low',
              evidenceSummary: 'Risky cluster should not pass without review.',
            },
          ],
        },
      }),
    );
    const handler = new ReviewClusterProductFitHandler(
      runRepository,
      stepRepository,
      artifactRepository,
      ai,
    );

    const result = await handler.execute(new ReviewClusterProductFitCommand(run.id));
    const artifacts = await artifactRepository.findByRunId(run.id);
    const saved = artifacts.find(
      (artifact) => artifact.artifactType === 'cluster_product_fit_review',
    )?.payload as {
      approvedCount: number;
      clusterProductFit: Array<{
        clusterName: string;
        decision: string;
        productFitType: string;
        source: string;
        sourceCluster: {
          primaryKeywordCandidate: string;
          supportingItemDetails: Array<{
            candidateScore: number;
            metrics: { proxyDemandScore: number };
            text: string;
          }>;
        };
      }>;
      fallbackMissingReviewCount: number;
      ignoredAiClusterReviewCount: number;
      rejectedCount: number;
      reviewedClusterCount: number;
      supportingOnlyCount: number;
    };
    const steps = await stepRepository.findByRunId(run.id);

    expect(result).toMatchObject({
      artifactType: 'cluster_product_fit_review',
      reviewedClusterCount: 3,
      approvedCount: 1,
      supportingOnlyCount: 1,
      rejectedCount: 1,
    });
    expect(ai.reviewCalls).toHaveLength(1);
    expect(ai.reviewCalls[0]?.modelMode).toBe('pro');
    expect(ai.reviewCalls[0]?.clusters.map((cluster) => cluster.clusterName)).toEqual([
      'Safe USDT earning options',
      'USDT cash-out workflows',
      'Unreviewed fallback cluster',
    ]);
    expect(ai.reviewCalls[0]?.clusters[0]?.supportingItemDetails).toMatchObject([
      {
        text: 'USDT savings account',
        candidateScore: 68,
        metrics: {
          proxyDemandScore: 64,
          competitorMatchScore: 88,
        },
      },
    ]);
    expect(saved).toMatchObject({
      reviewedClusterCount: 3,
      approvedCount: 1,
      supportingOnlyCount: 1,
      rejectedCount: 1,
      ignoredAiClusterReviewCount: 1,
      fallbackMissingReviewCount: 1,
    });
    expect(saved.clusterProductFit.map((item) => item.decision)).toEqual([
      'approve',
      'supporting_only',
      'reject',
    ]);
    expect(saved.clusterProductFit[0]?.sourceCluster.primaryKeywordCandidate).toBe(
      'is it safe to earn interest on USDT',
    );
    expect(saved.clusterProductFit[0]?.sourceCluster.supportingItemDetails).toMatchObject([
      {
        text: 'USDT savings account',
        candidateScore: 68,
        metrics: {
          proxyDemandScore: 64,
        },
      },
    ]);
    expect(saved.clusterProductFit[2]).toMatchObject({
      clusterName: 'Unreviewed fallback cluster',
      productFitType: 'no_fit',
      source: 'fallback_missing_ai_review',
    });
    expect(JSON.stringify(saved)).not.toContain('Unknown AI cluster');
    expect(steps[0]).toMatchObject({
      stage: 'cluster_scoring',
      status: 'completed',
    });
    expect((await runRepository.findById(run.id))?.status).toBe('awaiting_confirmation');
  });
});
