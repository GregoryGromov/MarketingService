import type { EventBus } from '@nestjs/cqrs';
import { describe, expect, it, vi } from 'vitest';
import { SeoBriefProjectNotFoundError } from '../../errors/seo-brief-project-not-found.error.js';
import {
  InMemoryBrandMemoryReader,
  InMemorySeoBriefArtifactRepository,
  InMemorySeoBriefRunJobPort,
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
  const jobs = new InMemorySeoBriefRunJobPort();
  const eventBus = { publishAll: vi.fn() } as unknown as EventBus;

  return {
    brandMemoryReader,
    runRepository,
    runStepRepository,
    artifactRepository,
    jobs,
    eventBus,
    handler: new CreateSeoBriefRunHandler(
      brandMemoryReader,
      runRepository,
      runStepRepository,
      artifactRepository,
      jobs,
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
        market: {
          country: ' Nigeria ',
          language: ' English ',
          locationName: ' Lagos ',
        },
        audience: ' Beginners holding USDT ',
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
        seoProductBalance: {
          seoWeight: 0.7,
        },
      }),
    );

    const storedRun = await ctx.runRepository.findById(result.runId as never);
    const storedSteps = await ctx.runStepRepository.findByRunId(result.runId as never);
    const storedArtifacts = await ctx.artifactRepository.findByRunId(result.runId as never);

    expect(result.status).toBe('queued');
    expect(result.deduplicated).toBe(false);
    expect(result.projectId).toBe('project-1');
    expect(ctx.jobs.jobs).toEqual([
      {
        runId: result.runId,
        startStage: 'keyword_expansion',
        stopAfterStage: 'keyword_expansion',
      },
    ]);
    expect(storedRun).not.toBeNull();
    expect(storedRun?.status).toBe('queued');
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
    expect(storedArtifacts).toHaveLength(3);

    const inputArtifact = storedArtifacts.find(
      (artifact) => artifact.artifactType === 'normalized_input',
    );
    const brandMemoryArtifact = storedArtifacts.find(
      (artifact) => artifact.artifactType === 'brand_memory_snapshot',
    );
    const operationalLimitsArtifact = storedArtifacts.find(
      (artifact) => artifact.artifactType === 'operational_limits_snapshot',
    );

    expect(inputArtifact?.payload).toEqual({
      projectId: 'project-1',
      topicSeed: 'how to earn with USDT',
      market: {
        country: 'Nigeria',
        language: 'English',
        locationName: 'Lagos',
      },
      audience: 'Beginners holding USDT',
      keywordExpansionPrompt: 'Keep the keywords short and head-term oriented.',
      product: {
        name: 'Reinforce',
        description: 'Helps users make idle USDT productive',
      },
      keyMessage: 'Idle USDT can be used more productively',
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
      source: 'project_brand_memory',
      projectId: 'project-1',
      projectName: 'Reinforce Project',
      snapshot: storedRun?.brandMemorySnapshot,
    });
    expect(operationalLimitsArtifact?.payload).toMatchObject({
      keywordExpansionLimit: 3,
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
    expect(ctx.jobs.jobs).toEqual([
      {
        runId: result.runId,
        startStage: 'keyword_expansion',
        stopAfterStage: 'keyword_expansion',
      },
    ]);
    expect(result.status).toBe('queued');
    expect(result.deduplicated).toBe(false);
    expect(storedRun?.projectId).toBeNull();
    expect(storedRun?.status).toBe('queued');
    expect(storedRun?.brandMemorySnapshot).toEqual({
      brandName: 'Reinforce',
      productDescription: 'Helps users understand low-friction yield options',
      targetAudience: 'Retail crypto beginners',
      approvedFacts: [],
      forbiddenClaims: [],
      glossary: {},
      bannedPhrases: [],
      requiredPhrases: [],
      brandDocs: [],
      adaptationPromptRules: null,
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
    expect(ctx.jobs.jobs).toEqual([
      {
        runId: first.runId,
        startStage: 'keyword_expansion',
        stopAfterStage: 'keyword_expansion',
      },
    ]);
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
    expect(ctx.jobs.jobs).toHaveLength(2);
    expect(ctx.runRepository.records.size).toBe(2);
  });
});
