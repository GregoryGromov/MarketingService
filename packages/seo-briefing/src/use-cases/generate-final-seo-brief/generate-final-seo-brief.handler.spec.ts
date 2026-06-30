import { describe, expect, it } from 'vitest';
import {
  type GenerateSeoBriefParams,
  type GenerateSeoBriefResult,
  SeoBriefAiPort,
  SeoBriefArtifact,
  SeoBriefRun,
} from '../../index.js';
import {
  InMemorySeoBriefArtifactRepository,
  InMemorySeoBriefDocumentRepository,
  InMemorySeoBriefRunRepository,
  InMemorySeoBriefRunStepRepository,
} from '../../testing/run-test-harness.js';
import { GenerateFinalSeoBriefCommand } from './generate-final-seo-brief.command.js';
import { GenerateFinalSeoBriefHandler } from './generate-final-seo-brief.handler.js';

class FakeSeoBriefAiPort extends SeoBriefAiPort {
  generateCalls: GenerateSeoBriefParams[] = [];

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

  generateSeoBrief(params: GenerateSeoBriefParams): Promise<GenerateSeoBriefResult> {
    this.generateCalls.push(params);

    return Promise.resolve({
      topicHint: 'idle USDT yield',
      mainCluster: 'Safe USDT earning options',
      supportingClusters: ['USDT platform comparisons'],
      primaryKeyword: 'is it safe to earn interest on USDT',
      secondaryKeywords: ['USDT savings options'],
      searchIntent: 'Beginner wants safe ways to make idle USDT productive.',
      targetReader: 'Cautious USDT holder in Nigeria',
      contentType: 'educational guide',
      recommendedTitle: 'How to Earn Interest on USDT Without Hype',
      recommendedH1: 'How to Earn Interest on USDT Without Hype',
      recommendedMetaTitle: 'How to Earn Interest on USDT Without Hype',
      recommendedMetaDescription: 'Compare practical USDT earning options and risks clearly.',
      title: 'How to Earn Interest on USDT Without Hype',
      metaTitle: 'How to Earn Interest on USDT Without Hype',
      metaDescription: 'Compare practical USDT earning options and risks clearly.',
      angle: 'Educational comparison for cautious users.',
      outline: [
        {
          heading: 'Compare common USDT earning options',
          h2: 'Compare common USDT earning options',
          h3: ['Savings accounts', 'Lending and staking differences'],
          notes: 'Explain tradeoffs before product mention.',
          purpose: 'Help readers understand options.',
          keyPoints: ['Savings accounts', 'Lending and staking differences'],
        },
      ],
      faq: [
        {
          question: 'Is earning interest on USDT risk-free?',
          answer: 'No, explain platform and lock-up risks.',
          answerDirection: 'No, explain platform and lock-up risks.',
        },
      ],
      productInsertion: {
        where: 'After the comparison section',
        how: 'Introduce Reinforce as an education-first option.',
        sampleAngle: 'Reinforce helps users evaluate productive USDT use without hype.',
        avoid: ['Do not promise guaranteed returns.'],
      },
      productPlacement: {
        summary: 'Mention Reinforce after the comparison section.',
        cta: 'Learn how Reinforce works',
        sections: ['After the comparison section'],
      },
      competitorGapsToFill: ['Explain emerging-market trust concerns.'],
      riskNotes: ['Avoid risk-free yield language.'],
      cta: 'Learn how Reinforce works',
      internalLinks: ['USDT risk guide'],
      externalSourcesNeeded: ['Current platform terms'],
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
    cta: 'Learn how Reinforce works',
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

describe('GenerateFinalSeoBriefHandler', () => {
  it('generates and stores the final SEO brief from selected cluster and OnPage synthesis', async () => {
    const runRepository = new InMemorySeoBriefRunRepository();
    const stepRepository = new InMemorySeoBriefRunStepRepository();
    const artifactRepository = new InMemorySeoBriefArtifactRepository();
    const documentRepository = new InMemorySeoBriefDocumentRepository();
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
            productFitType: 'education_bridge',
            productFitDecision: 'approve',
            sourceCluster: {
              primaryKeywordCandidate: 'is it safe to earn interest on USDT',
              intent: 'informational',
              keywords: ['USDT savings options'],
              secondaryKeywords: ['USDT savings options'],
              questions: ['Is USDT staking safe?'],
            },
          },
          supportingClusters: [
            {
              clusterName: 'USDT platform comparisons',
              primaryKeyword: 'best USDT savings platforms',
              sourceCluster: {
                keywords: ['best USDT savings platforms'],
              },
            },
          ],
          rejectedClusters: [],
        },
      }),
    );
    await artifactRepository.save(
      SeoBriefArtifact.create({
        runId: run.id,
        stage: 'brief_generation',
        artifactType: 'onpage_synthesis_snapshot',
        payload: {
          artifactVersion: 'onpage_synthesis_v1',
          competitorStructureSummary: {
            contentGaps: ['Few pages explain emerging-market trust concerns.'],
          },
          recommendedArticleStructure: {
            h1: 'How to earn yield on USDT without hype',
            h2: [{ heading: 'Compare options', purpose: 'Explain choices', subpoints: [] }],
            faq: ['Is USDT yield safe?'],
          },
          productInsertion: {
            section: 'After comparison',
            angle: 'Education-first product bridge.',
            do: ['Explain tradeoffs clearly.'],
            avoid: ['Do not promise guaranteed returns.'],
          },
          riskAndComplianceNotes: ['Avoid risk-free language.'],
        },
      }),
    );

    const result = await new GenerateFinalSeoBriefHandler(
      runRepository,
      stepRepository,
      artifactRepository,
      documentRepository,
      ai,
    ).execute(new GenerateFinalSeoBriefCommand(run.id));

    expect(result).toMatchObject({
      artifactType: 'final_brief_snapshot',
      title: 'How to Earn Interest on USDT Without Hype',
      primaryKeyword: 'is it safe to earn interest on USDT',
      outlineSectionCount: 1,
      faqCount: 1,
    });
    expect(ai.generateCalls).toHaveLength(1);
    expect(ai.generateCalls[0]?.onPageSynthesis?.artifactVersion).toBe('onpage_synthesis_v1');
    expect(ai.generateCalls[0]?.primaryKeyword).toBe('is it safe to earn interest on USDT');

    const finalBrief = await documentRepository.findLatestByRunId(run.id);
    expect(finalBrief?.briefPayload).toMatchObject({
      recommendedTitle: 'How to Earn Interest on USDT Without Hype',
      primaryKeyword: 'is it safe to earn interest on USDT',
      productInsertion: {
        where: 'After the comparison section',
      },
    });

    const artifacts = await artifactRepository.findByRunId(run.id);
    expect(artifacts.some((artifact) => artifact.artifactType === 'final_brief_snapshot')).toBe(
      true,
    );
    expect(artifacts.some((artifact) => artifact.artifactType === 'evidence_pack_snapshot')).toBe(
      true,
    );
    expect((await runRepository.findById(run.id))?.status).toBe('done');
  });
});
