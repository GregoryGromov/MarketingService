import { describe, expect, it } from 'vitest';
import { SeoBriefArtifact, SeoBriefRun } from '../../index.js';
import {
  InMemorySeoBriefArtifactRepository,
  InMemorySeoBriefRunRepository,
  InMemorySeoBriefRunStepRepository,
} from '../../testing/run-test-harness.js';
import { SelectSeoBriefClustersCommand } from './select-seo-brief-clusters.command.js';
import { SelectSeoBriefClustersHandler } from './select-seo-brief-clusters.handler.js';

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

describe('SelectSeoBriefClustersHandler', () => {
  it('selects one approved main cluster, supporting clusters, and rejected clusters', async () => {
    const runRepository = new InMemorySeoBriefRunRepository();
    const stepRepository = new InMemorySeoBriefRunStepRepository();
    const artifactRepository = new InMemorySeoBriefArtifactRepository();
    const run = createRun();
    await runRepository.save(run);
    await artifactRepository.save(
      SeoBriefArtifact.create({
        runId: run.id,
        stage: 'cluster_scoring',
        artifactType: 'cluster_product_fit_review',
        payload: {
          artifactVersion: 'cluster_product_fit_review_v1',
          clusterProductFit: [
            {
              clusterName: 'Safe USDT earning options',
              productFitScore: 84,
              productFitType: 'education_bridge',
              decision: 'approve',
              productInsertionAngle: 'Education-first product bridge.',
              whereToInsert: 'After risk explanation.',
              whatNotToClaim: ['Do not promise guaranteed yield.'],
              reason: 'Strong safety education fit.',
              sourceCluster: {
                clusterName: 'Safe USDT earning options',
                primaryKeywordCandidate: 'is it safe to earn interest on USDT',
                intent: 'informational',
                keywords: ['is it safe to earn interest on USDT', 'USDT savings account'],
                questions: ['is USDT staking safe'],
                supportingItemDetails: [
                  {
                    text: 'USDT savings account',
                    sources: ['ranked_keywords', 'serp_derived_candidate'],
                    candidateScore: 72,
                    metrics: {
                      searchVolume: 170,
                      bestRankAbsolute: 3,
                      proxyDemandScore: 64,
                      competitorMatchScore: 88,
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
            },
            {
              clusterName: 'USDT cash-out workflows',
              productFitScore: 58,
              productFitType: 'workflow_bridge',
              decision: 'supporting_only',
              productInsertionAngle: 'Use as workflow support.',
              whereToInsert: 'Internal support article.',
              whatNotToClaim: ['Do not imply Reinforce is a cash-out tool.'],
              reason: 'Useful, but not the direct main article.',
              sourceCluster: {
                clusterName: 'USDT cash-out workflows',
                primaryKeywordCandidate: 'how to cash out USDT to naira',
                intent: 'informational',
                keywords: ['how to cash out USDT to naira'],
                questions: [],
                supportingItemDetails: [
                  {
                    text: 'USDT to naira',
                    sources: ['serp_derived_candidate'],
                    metrics: {
                      proxyDemandScore: 42,
                    },
                  },
                ],
                competitorUrls: [],
                sourceConfidence: 'medium',
              },
            },
            {
              clusterName: 'Free USDT generators',
              productFitScore: 12,
              productFitType: 'no_fit',
              decision: 'reject',
              productInsertionAngle: 'Do not insert.',
              whereToInsert: 'Nowhere.',
              whatNotToClaim: ['Do not discuss scam tools as options.'],
              reason: 'Unsafe and no Product Fit.',
              sourceCluster: {
                clusterName: 'Free USDT generators',
                primaryKeywordCandidate: 'free USDT generator',
                intent: 'transactional',
                keywords: ['free USDT generator'],
                sourceConfidence: 'low',
              },
            },
          ],
        },
      }),
    );
    const handler = new SelectSeoBriefClustersHandler(
      runRepository,
      stepRepository,
      artifactRepository,
    );

    const result = await handler.execute(new SelectSeoBriefClustersCommand(run.id));
    const artifacts = await artifactRepository.findByRunId(run.id);
    const saved = artifacts.find((artifact) => artifact.artifactType === 'cluster_selection_snapshot')
      ?.payload as {
      mainCluster: { clusterName: string; primaryKeyword: string; priorityScore: number };
      rankedClusters: Array<{ clusterName: string; priorityScore: number }>;
      rejectedClusters: Array<{ clusterName: string; reason: string }>;
      selectedCluster: { label: string; representativeKeyword: string };
      supportingClusters: Array<{ clusterName: string; role: string }>;
    };
    const steps = await stepRepository.findByRunId(run.id);

    expect(result).toMatchObject({
      artifactType: 'cluster_selection_snapshot',
      mainClusterName: 'Safe USDT earning options',
      supportingClusterCount: 1,
      rejectedClusterCount: 1,
    });
    expect(saved.mainCluster).toMatchObject({
      clusterName: 'Safe USDT earning options',
      primaryKeyword: 'is it safe to earn interest on USDT',
    });
    expect(saved.mainCluster.priorityScore).toBeGreaterThan(60);
    expect(saved.supportingClusters).toMatchObject([
      {
        clusterName: 'USDT cash-out workflows',
        role: 'supporting article / internal link',
      },
    ]);
    expect(saved.rejectedClusters).toMatchObject([
      {
        clusterName: 'Free USDT generators',
        reason: 'Unsafe and no Product Fit.',
      },
    ]);
    expect(saved.selectedCluster).toMatchObject({
      label: 'Safe USDT earning options',
      representativeKeyword: 'is it safe to earn interest on USDT',
    });
    expect(saved.rankedClusters[0]?.clusterName).toBe('Safe USDT earning options');
    expect(steps[0]).toMatchObject({
      stage: 'cluster_selection',
      status: 'completed',
    });
    expect((await runRepository.findById(run.id))?.status).toBe('awaiting_confirmation');
  });
});
