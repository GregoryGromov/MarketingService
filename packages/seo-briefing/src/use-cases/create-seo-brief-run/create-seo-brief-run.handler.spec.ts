import type { EventBus } from '@nestjs/cqrs';
import { describe, expect, it, vi } from 'vitest';
import { SeoBriefProjectNotFoundError } from '../../errors/seo-brief-project-not-found.error.js';
import {
  InMemoryBrandMemoryReader,
  InMemorySeoBriefArtifactRepository,
  InMemorySeoBriefRunRepository,
  InMemorySeoBriefRunStepRepository,
} from '../../testing/run-test-harness.js';
import { CreateSeoBriefRunCommand } from './create-seo-brief-run.command.js';
import { CreateSeoBriefRunHandler } from './create-seo-brief-run.handler.js';

function createHandler() {
  const brandMemoryReader = new InMemoryBrandMemoryReader();
  const runRepository = new InMemorySeoBriefRunRepository();
  const runStepRepository = new InMemorySeoBriefRunStepRepository();
  const artifactRepository = new InMemorySeoBriefArtifactRepository();
  const eventBus = { publishAll: vi.fn() } as unknown as EventBus;

  return {
    brandMemoryReader,
    runRepository,
    runStepRepository,
    artifactRepository,
    eventBus,
    handler: new CreateSeoBriefRunHandler(
      brandMemoryReader,
      runRepository,
      runStepRepository,
      artifactRepository,
      eventBus,
    ),
  };
}

describe('CreateSeoBriefRunHandler', () => {
  it('creates a run with project-backed brand memory snapshot and artifacts', async () => {
    const ctx = createHandler();
    ctx.brandMemoryReader.seed({
      projectId: 'project-1',
      projectName: 'Reinforce Project',
      brandMemorySnapshot: {
        brandName: null,
        productDescription: null,
        targetAudience: 'Crypto beginners',
        approvedFacts: ['Supports USDT productivity flows'],
        forbiddenClaims: ['Guaranteed returns'],
        glossary: { usdt: 'Stablecoin pegged to USD' },
        bannedPhrases: ['risk-free'],
        requiredPhrases: ['capital at risk'],
        brandDocs: [{ title: 'Brand guide', url: null, notes: 'v1' }],
        adaptationPromptRules: { blog: 'Stay educational' },
      },
    });

    const result = await ctx.handler.execute(
      new CreateSeoBriefRunCommand({
        projectId: 'project-1',
        topicSeed: ' how to earn with USDT ',
        hypothesesCount: 20,
        serpEnrichmentCount: 10,
        competitorKeywordsJsonId: ' nigeria_usdt_competitors_v1 ',
        market: {
          country: ' Nigeria ',
          language: ' English ',
          locationName: ' Lagos ',
        },
        audience: ' Beginners holding USDT ',
        userPains: [' Save money in dollars ', 'Avoid naira devaluation'],
        userScenarios: ['Uses Binance P2P', 'Stores USDT in Trust Wallet'],
        keywordExpansionPrompt: 'Keep the keywords short and head-term oriented.',
        product: {
          name: ' Reinforce ',
          description: ' Helps users make idle USDT productive ',
        },
        keyMessage: ' Idle USDT can be used more productively ',
        audienceShift: {
          before: 'Does not know earning options',
          after: 'Understands options and sees Reinforce as one path',
        },
        cta: ' Learn more ',
        knownCompetitors: {
          mustInclude: [' Binance Earn ', 'Nexo'],
          optional: ['Trust Wallet'],
          exclude: ['Scammy faucets'],
        },
        brandConstraints: ['No hype'],
        claimsConstraints: ['No guaranteed returns'],
        preferredAngle: 'Educational comparison',
        excludedTopics: ['Leverage'],
        seoProductBalance: {
          seoWeight: 0.7,
        },
      }),
    );

    const storedRun = await ctx.runRepository.findById(result.runId as never);
    const storedSteps = await ctx.runStepRepository.findByRunId(result.runId as never);
    const storedArtifacts = await ctx.artifactRepository.findByRunId(result.runId as never);

    expect(result.status).toBe('awaiting_confirmation');
    expect(result.deduplicated).toBe(false);
    expect(result.projectId).toBe('project-1');
    expect(storedRun).not.toBeNull();
    expect(storedRun?.status).toBe('awaiting_confirmation');
    expect(storedRun?.brandMemorySnapshot.brandName).toBe('Reinforce');
    expect(storedRun?.brandMemorySnapshot.productDescription).toBe(
      'Helps users make idle USDT productive',
    );
    expect(storedRun?.brandMemorySnapshot.targetAudience).toBe('Crypto beginners');
    expect(storedRun?.seoWeight).toBe(0.7);
    expect(storedRun?.productWeight).toBeCloseTo(0.3, 8);
    expect(storedSteps).toHaveLength(1);
    expect(storedSteps[0]?.stage).toBe('created');
    expect(storedSteps[0]?.status).toBe('completed');
    expect(storedArtifacts).toHaveLength(5);

    const inputArtifact = storedArtifacts.find(
      (artifact) => artifact.artifactType === 'normalized_input',
    );
    const brandMemoryArtifact = storedArtifacts.find(
      (artifact) => artifact.artifactType === 'brand_memory_snapshot',
    );
    const manualPainsArtifact = storedArtifacts.find(
      (artifact) => artifact.artifactType === 'user_pain_scenarios',
    );
    const seoProductContextArtifact = storedArtifacts.find(
      (artifact) => artifact.artifactType === 'seo_product_context',
    );
    const operationalLimitsArtifact = storedArtifacts.find(
      (artifact) => artifact.artifactType === 'operational_limits_snapshot',
    );

    expect(inputArtifact?.payload).toEqual({
      inputVersion: 'topic_hint_manual_pains_v2',
      projectId: 'project-1',
      aiModelMode: 'pro',
      topicHint: 'how to earn with USDT',
      topicHintScope: {
        requiredTopicTerms: ['earn', 'usdt'],
        topicCoverageInstruction:
          'Treat requiredTopicTerms as hard scope anchors extracted from topic_hint. The SEO plan must explicitly preserve at least one of: earn, usdt. Generic adjacent queries may support the brief, but they must not replace the concrete topic scope.',
      },
      topicSeed: 'how to earn with USDT',
      hypothesesCount: 20,
      serpEnrichmentCount: 10,
      requestTimeoutMs: 300000,
      competitorKeywordsJsonId: 'nigeria_usdt_competitors_v1',
      market: {
        country: 'Nigeria',
        language: 'English',
        locationName: 'Lagos',
      },
      audience: 'Beginners holding USDT',
      userPains: ['Save money in dollars', 'Avoid naira devaluation'],
      userScenarios: ['Uses Binance P2P', 'Stores USDT in Trust Wallet'],
      keywordExpansionPrompt: 'Keep the keywords short and head-term oriented.',
      product: {
        name: 'Reinforce',
        description: 'Helps users make idle USDT productive',
      },
      keyMessage: 'Idle USDT can be used more productively',
      knownCompetitors: {
        mustInclude: ['Binance Earn', 'Nexo'],
        optional: ['Trust Wallet'],
        exclude: ['Scammy faucets'],
      },
      brandConstraints: ['No hype'],
      claimsConstraints: ['No guaranteed returns'],
      preferredAngle: 'Educational comparison',
      excludedTopics: ['Leverage'],
      campaignContext: null,
      audienceShift: {
        before: 'Does not know earning options',
        after: 'Understands options and sees Reinforce as one path',
      },
      cta: 'Learn more',
      seoProductBalance: {
        seoWeight: 0.7,
        productWeight: 0.30000000000000004,
      },
    });
    expect(brandMemoryArtifact?.payload).toEqual({
      artifactVersion: 'brand_memory_snapshot_v1',
      algorithmStep: 'brand_memory_snapshot',
      purpose:
        'Source-of-truth product, trust, claims, phrase, and brand constraints used by downstream SEO brief steps.',
      source: 'project_brand_memory',
      projectId: 'project-1',
      projectName: 'Reinforce Project',
      summary: {
        brandName: 'Reinforce',
        hasProjectBrandMemory: true,
        approvedFactCount: 1,
        forbiddenClaimCount: 1,
        requiredPhraseCount: 1,
        bannedPhraseCount: 1,
        glossaryTermCount: 1,
        brandDocCount: 1,
        hasAdaptationPromptRules: true,
      },
      usageRules: [
        'Use approvedFacts, glossary, requiredPhrases, and brandDocs as allowed context.',
        'Use forbiddenClaims and bannedPhrases as hard constraints.',
        'Do not infer persistent brand facts from marketer one-off files unless they are already in this snapshot.',
      ],
      snapshot: storedRun?.brandMemorySnapshot,
    });
    expect(manualPainsArtifact?.payload).toMatchObject({
      artifactVersion: 'manual_user_pain_scenarios_v1',
      algorithmStep: 'input_manual_user_pains',
      source: 'marketer_input',
      userPains: [
        {
          pain: 'Save money in dollars',
          productConnection: 'education',
        },
        {
          pain: 'Avoid naira devaluation',
          productConnection: 'education',
        },
      ],
      userScenarios: [
        {
          scenario: 'Uses Binance P2P',
          type: 'action',
          productFitHypothesis: 'education_bridge',
        },
        {
          scenario: 'Stores USDT in Trust Wallet',
          type: 'action',
          productFitHypothesis: 'education_bridge',
        },
      ],
    });
    expect(seoProductContextArtifact?.payload).toMatchObject({
      artifactVersion: 'seo_product_context_v1',
      algorithmStep: 'seo_product_context',
      researchFrame: {
        topicHint: 'how to earn with USDT',
        market: {
          country: 'Nigeria',
          language: 'English',
          locationName: 'Lagos',
        },
        audience: 'Beginners holding USDT',
        preferredAngle: 'Educational comparison',
        keyMessage: 'Idle USDT can be used more productively',
        cta: 'Learn more',
        campaignContext: null,
        audienceShift: {
          before: 'Does not know earning options',
          after: 'Understands options and sees Reinforce as one path',
        },
        manualUserContext: {
          userPains: ['Save money in dollars', 'Avoid naira devaluation'],
          userScenarios: ['Uses Binance P2P', 'Stores USDT in Trust Wallet'],
        },
      },
      v2Controls: {
        hypothesesCount: 20,
        serpEnrichmentCount: 10,
        competitorKeywordsJsonId: 'nigeria_usdt_competitors_v1',
      },
      competitorContext: {
        mustInclude: ['Binance Earn', 'Nexo'],
        optional: ['Trust Wallet'],
        exclude: ['Scammy faucets'],
      },
      marketerConstraints: {
        brandConstraints: ['No hype'],
        claimsConstraints: ['No guaranteed returns'],
        excludedTopics: ['Leverage'],
      },
      brandMemoryContext: {
        source: 'project_brand_memory',
        projectId: 'project-1',
        projectName: 'Reinforce Project',
        brandName: 'Reinforce',
        productDescription: 'Helps users make idle USDT productive',
        targetAudience: 'Crypto beginners',
        approvedFacts: ['Supports USDT productivity flows'],
        forbiddenClaims: ['Guaranteed returns'],
        requiredPhrases: ['capital at risk'],
        bannedPhrases: ['risk-free'],
      },
    });
    expect(operationalLimitsArtifact?.payload).toMatchObject({
      keywordExpansionLimit: 9,
      maxClustersToScore: 5,
      maxManualRerunAttemptsPerStage: 3,
    });
  });

  it('creates a run from input only when project id is omitted', async () => {
    const ctx = createHandler();

    const result = await ctx.handler.execute(
      new CreateSeoBriefRunCommand({
        topicSeed: 'USDT yield basics',
        market: {
          country: 'Nigeria',
          language: 'English',
        },
        audience: 'Retail crypto beginners',
        product: {
          name: 'Reinforce',
          description: 'Helps users understand low-friction yield options',
        },
      }),
    );

    const storedRun = await ctx.runRepository.findById(result.runId as never);
    expect(result.status).toBe('awaiting_confirmation');
    expect(result.deduplicated).toBe(false);
    expect(storedRun?.projectId).toBeNull();
    expect(storedRun?.status).toBe('awaiting_confirmation');
    expect(storedRun?.brandMemorySnapshot).toEqual({
      brandName: 'Reinforce',
      productDescription: 'Helps users understand low-friction yield options',
      targetAudience: 'Retail crypto beginners',
      keyMessage: null,
      defaultCta: null,
      brandConstraints: [],
      claimsConstraints: [],
      approvedFacts: [],
      forbiddenClaims: [],
      glossary: {},
      bannedPhrases: [],
      requiredPhrases: [],
      brandDocs: [],
      adaptationPromptRules: null,
      seoCompetitors: {
        mustInclude: [],
        optional: [],
        exclude: [],
      },
      seoCompetitorKeywordMap: null,
    });
  });

  it('throws when project id is provided but brand memory cannot be loaded', async () => {
    const ctx = createHandler();

    await expect(
      ctx.handler.execute(
        new CreateSeoBriefRunCommand({
          projectId: 'missing-project',
          topicSeed: 'USDT yield basics',
          market: {
            country: 'Nigeria',
            language: 'English',
          },
          audience: 'Retail crypto beginners',
          product: {
            name: 'Reinforce',
            description: 'Helps users understand low-friction yield options',
          },
        }),
      ),
    ).rejects.toBeInstanceOf(SeoBriefProjectNotFoundError);
  });

  it('reuses a recent duplicate run instead of creating a new one', async () => {
    const ctx = createHandler();

    const first = await ctx.handler.execute(
      new CreateSeoBriefRunCommand({
        topicSeed: 'USDT yield basics',
        market: {
          country: 'Nigeria',
          language: 'English',
        },
        audience: 'Retail crypto beginners',
        product: {
          name: 'Reinforce',
          description: 'Helps users understand low-friction yield options',
        },
      }),
    );
    const second = await ctx.handler.execute(
      new CreateSeoBriefRunCommand({
        topicSeed: 'USDT yield basics',
        market: {
          country: 'Nigeria',
          language: 'English',
        },
        audience: 'Retail crypto beginners',
        product: {
          name: 'Reinforce',
          description: 'Helps users understand low-friction yield options',
        },
      }),
    );

    expect(first.deduplicated).toBe(false);
    expect(second.deduplicated).toBe(true);
    expect(second.runId).toBe(first.runId);
    expect(ctx.runRepository.records.size).toBe(1);
  });

  it('does not deduplicate runs when keyword expansion prompt changes', async () => {
    const ctx = createHandler();

    const first = await ctx.handler.execute(
      new CreateSeoBriefRunCommand({
        topicSeed: 'USDT yield basics',
        market: {
          country: 'Nigeria',
          language: 'English',
        },
        audience: 'Retail crypto beginners',
        keywordExpansionPrompt: 'Use broad category-level keywords only.',
        product: {
          name: 'Reinforce',
          description: 'Helps users understand low-friction yield options',
        },
      }),
    );
    const second = await ctx.handler.execute(
      new CreateSeoBriefRunCommand({
        topicSeed: 'USDT yield basics',
        market: {
          country: 'Nigeria',
          language: 'English',
        },
        audience: 'Retail crypto beginners',
        keywordExpansionPrompt: 'Use slightly more commercial keywords.',
        product: {
          name: 'Reinforce',
          description: 'Helps users understand low-friction yield options',
        },
      }),
    );

    expect(first.deduplicated).toBe(false);
    expect(second.deduplicated).toBe(false);
    expect(second.runId).not.toBe(first.runId);
    expect(ctx.runRepository.records.size).toBe(2);
  });
});
