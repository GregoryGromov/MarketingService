import { describe, expect, it } from 'vitest';
import {
  validateClusterKeywordsResult,
  validateScoreDirtyKeywordCandidatesResult,
} from './deepseek-seo-brief-ai.validators.js';

describe('validateScoreDirtyKeywordCandidatesResult', () => {
  it('normalizes compact items output into accepted, maybe, and rejected buckets', () => {
    const result = validateScoreDirtyKeywordCandidatesResult(
      {
        items: [
          {
            id: 1,
            keyword: 'How much interest is on USDT',
            status: 'accepted',
            scores: [82, 76, 74, 80, 90, 64],
            intent: 'informational',
            stage: 'consideration',
            reason: 'Strong topic and product fit with grounded SERP evidence.',
            risk: [],
            evidence: ['PAA query and selected related query.'],
          },
          {
            id: 2,
            keyword: 'free USDT generator',
            status: 'rejected',
            scores: [20, 0, 10, 5, 0, 10],
            intent: 'transactional',
            stage: 'decision',
            reason: 'Unsafe scam-like query.',
            risk: ['scam_or_free_money'],
            evidence: ['Hard-risk language.'],
          },
        ],
        summary: ['Accepted useful USDT education query and rejected scam query.'],
      },
      'scoreDirtyKeywordCandidates',
    );

    expect(result.accepted).toHaveLength(1);
    expect(result.maybe).toHaveLength(0);
    expect(result.rejected).toHaveLength(1);
    expect(result.accepted[0]).toMatchObject({
      keyword: 'How much interest is on USDT',
      status: 'accepted',
      totalScore: 78,
      fit: {
        topicFit: 'strong',
        productFit: 'strong',
        audienceFit: 'moderate',
        intentFit: 'strong',
        riskCompliance: 'strong',
        evidence: 'moderate',
      },
    });
    expect(result.summary).toEqual({
      acceptedCount: 1,
      maybeCount: 0,
      rejectedCount: 1,
      notes: ['Accepted useful USDT education query and rejected scam query.'],
    });
  });
});

describe('validateClusterKeywordsResult', () => {
  it('normalizes compact id-based clusters into keyword-based clusters', () => {
    const result = validateClusterKeywordsResult(
      {
        clusters: [
          {
            name: 'USDT transfer fees',
            user_intent: 'Reader wants to reduce transfer cost.',
            intent: 'informational',
            primary_id: 1,
            secondary_ids: [2],
            question_ids: [3],
            supporting_ids: [2, 3],
            confidence: 'high',
            reason: 'All ids describe the same transfer-cost intent.',
          },
        ],
      },
      'clusterKeywords',
      {
        runId: 'run_1' as never,
        topicSeed: 'USDT fees',
        keywords: [
          'how to reduce USDT transfer fees',
          'cheapest network for USDT transfer',
          'why are USDT fees so high',
        ],
      },
    );

    expect(result.clusters).toEqual([
      {
        label: 'USDT transfer fees',
        primaryKeyword: 'how to reduce USDT transfer fees',
        intent: 'informational',
        keywords: [
          'how to reduce USDT transfer fees',
          'cheapest network for USDT transfer',
          'why are USDT fees so high',
        ],
        rationale: 'All ids describe the same transfer-cost intent.',
        userIntent: 'Reader wants to reduce transfer cost.',
        secondaryKeywords: ['cheapest network for USDT transfer'],
        questions: ['why are USDT fees so high'],
        supportingItems: ['cheapest network for USDT transfer', 'why are USDT fees so high'],
        competitorUrls: [],
        sourceConfidence: 'high',
        evidenceSummary: 'All ids describe the same transfer-cost intent.',
      },
    ]);
  });

  it('accepts common alternative cluster array keys', () => {
    const result = validateClusterKeywordsResult(
      {
        intent_clusters: [
          {
            name: 'USDT transfer fees',
            user_intent: 'Reader wants to reduce transfer cost.',
            intent: 'informational',
            primary_id: 1,
            secondary_ids: [2],
            question_ids: [],
            supporting_ids: [2],
            confidence: 'medium',
            reason: 'Both ids describe transfer cost.',
          },
        ],
      },
      'clusterKeywords',
      {
        runId: 'run_1' as never,
        topicSeed: 'USDT fees',
        keywords: ['how to reduce USDT transfer fees', 'cheapest network for USDT transfer'],
      },
    );

    expect(result.clusters[0]?.primaryKeyword).toBe('how to reduce USDT transfer fees');
  });

  it('accepts a root array of clusters', () => {
    const result = validateClusterKeywordsResult(
      [
        {
          name: 'USDT transfer fees',
          user_intent: 'Reader wants to reduce transfer cost.',
          intent: 'informational',
          primary_id: 1,
          secondary_ids: [],
          question_ids: [],
          supporting_ids: [],
          confidence: 'low',
          reason: 'Single intent cluster.',
        },
      ],
      'clusterKeywords',
      {
        runId: 'run_1' as never,
        topicSeed: 'USDT fees',
        keywords: ['how to reduce USDT transfer fees'],
      },
    );

    expect(result.clusters).toHaveLength(1);
  });
});
