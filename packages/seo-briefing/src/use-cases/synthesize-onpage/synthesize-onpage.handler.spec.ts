import { describe, expect, it } from 'vitest';
import {
  SeoBriefAiPort,
  SeoBriefArtifact,
  SeoBriefRun,
  type SynthesizeOnPageParams,
  type SynthesizeOnPageResult,
} from '../../index.js';
import {
  InMemorySeoBriefArtifactRepository,
  InMemorySeoBriefRunRepository,
  InMemorySeoBriefRunStepRepository,
} from '../../testing/run-test-harness.js';
import { SynthesizeOnPageCommand } from './synthesize-onpage.command.js';
import { SynthesizeOnPageHandler } from './synthesize-onpage.handler.js';

class FakeSeoBriefAiPort extends SeoBriefAiPort {
  synthesizeCalls: SynthesizeOnPageParams[] = [];

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

  buildProductBridge(): Promise<never> {
    throw new Error('Not implemented in test');
  }

  explainClusterSelection(): Promise<never> {
    throw new Error('Not implemented in test');
  }

  generateSeoBrief(): Promise<never> {
    throw new Error('Not implemented in test');
  }

  synthesizeOnPage(params: SynthesizeOnPageParams): Promise<SynthesizeOnPageResult> {
    this.synthesizeCalls.push(params);

    return Promise.resolve({
      competitorStructureSummary: {
        commonH2Patterns: ['What USDT yield means', 'Risks and platform comparison'],
        commonContentBlocks: ['Definition block', 'Platform comparison block'],
        commonFaqQuestions: ['Is USDT yield safe?'],
        commonTablesOrComparisons: ['APY and lock-up comparison'],
        contentGaps: ['Few pages explain emerging-market trust concerns.'],
      },
      recommendedArticleStructure: {
        h1: 'How to earn yield on USDT without hype',
        h2: [
          {
            heading: 'Compare ways to make idle USDT productive',
            purpose: 'Frame common options without promising returns.',
            subpoints: ['Savings products', 'Staking/lending distinction'],
          },
        ],
        faq: ['Can I earn on USDT without locking it?'],
      },
      productInsertion: {
        section: 'After the comparison table',
        angle: 'Reinforce as an education-first option for cautious USDT holders.',
        do: ['Explain tradeoffs clearly.'],
        avoid: ['Do not promise guaranteed returns.'],
      },
      riskAndComplianceNotes: ['Avoid risk-free yield language.'],
    });
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

describe('SynthesizeOnPageHandler', () => {
  it('synthesizes parsed selected-cluster pages into article structure requirements', async () => {
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
        stage: 'cluster_selection',
        artifactType: 'cluster_selection_snapshot',
        payload: {
          artifactVersion: 'cluster_selection_v2',
          mainCluster: {
            clusterName: 'Safe USDT earning options',
            primaryKeyword: 'is it safe to earn interest on USDT',
            reason: 'Best product fit with safety intent.',
            sourceCluster: {
              keywords: ['USDT savings options'],
              competitorUrls: [
                {
                  domain: 'trustwallet.com',
                  url: 'https://trustwallet.com/stablecoin-earn/usdt',
                  title: 'Earn USDT Rewards',
                  rankAbsolute: 2,
                },
              ],
            },
          },
          supportingClusters: [],
        },
      }),
    );
    await artifactRepository.save(
      SeoBriefArtifact.create({
        runId: run.id,
        stage: 'onpage_research',
        artifactType: 'onpage_research_snapshot',
        payload: {
          artifactVersion: 'selected_cluster_onpage_v1',
          pages: [
            {
              status: 'completed',
              domain: 'trustwallet.com',
              url: 'https://trustwallet.com/stablecoin-earn/usdt',
              role: 'closest_intent_match',
              sourceQuery: 'is it safe to earn interest on USDT',
              title: 'Earn USDT Rewards',
              metaDescription: 'Earn rewards on your USDT holdings.',
              h1: ['Earn USDT Rewards'],
              h2: ['How USDT rewards work', 'Risks to understand'],
              h3: ['Flexible access'],
              textBlocks: ['Earn rewards while understanding the risks.'],
              markdownPreview: 'Long competitor content preview',
              importantLinks: [{ url: 'https://trustwallet.com', text: 'Trust Wallet' }],
              rawResponses: {
                contentParsing: { shouldNotReachAi: true },
              },
            },
            {
              status: 'failed',
              domain: 'broken.example',
              url: 'https://broken.example/page',
              errorMessage: 'Fetch failed',
            },
          ],
        },
      }),
    );

    const result = await new SynthesizeOnPageHandler(
      runRepository,
      stepRepository,
      artifactRepository,
      ai,
    ).execute(new SynthesizeOnPageCommand(run.id));

    expect(result).toMatchObject({
      artifactType: 'onpage_synthesis_snapshot',
      pageCount: 1,
      recommendedSectionCount: 1,
      contentGapCount: 1,
    });
    expect(ai.synthesizeCalls).toHaveLength(1);
    expect(ai.synthesizeCalls[0]?.onPagePages).toHaveLength(1);
    expect(ai.synthesizeCalls[0]?.onPagePages[0]?.url).toBe(
      'https://trustwallet.com/stablecoin-earn/usdt',
    );
    expect(JSON.stringify(ai.synthesizeCalls[0])).not.toContain('shouldNotReachAi');

    const artifacts = await artifactRepository.findByRunId(run.id);
    const synthesis = artifacts.find(
      (artifact) => artifact.artifactType === 'onpage_synthesis_snapshot',
    );
    expect(synthesis?.payload).toMatchObject({
      artifactVersion: 'onpage_synthesis_v1',
      pageCount: 1,
      recommendedArticleStructure: {
        h1: 'How to earn yield on USDT without hype',
      },
      productInsertion: {
        section: 'After the comparison table',
      },
    });
    expect((await runRepository.findById(run.id))?.status).toBe('awaiting_confirmation');
  });
});
