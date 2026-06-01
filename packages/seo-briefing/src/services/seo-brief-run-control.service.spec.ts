import { describe, expect, it } from 'vitest';
import { SeoBriefRun } from '../domain/seo-brief-run.aggregate.js';
import { SeoBriefRunStep } from '../domain/seo-brief-run-step.entity.js';
import { SeoBriefRunAttemptLimitError } from '../errors/seo-brief-run-attempt-limit.error.js';
import { SeoBriefRunBusyError } from '../errors/seo-brief-run-busy.error.js';
import {
  InMemorySeoBriefArtifactRepository,
  InMemorySeoBriefRunJobPort,
  InMemorySeoBriefRunRepository,
  InMemorySeoBriefRunStepRepository,
} from '../testing/run-test-harness.js';
import { SeoBriefRunControlService } from './seo-brief-run-control.service.js';

function createService() {
  const runRepository = new InMemorySeoBriefRunRepository();
  const stepRepository = new InMemorySeoBriefRunStepRepository();
  const artifactRepository = new InMemorySeoBriefArtifactRepository();
  const jobs = new InMemorySeoBriefRunJobPort();

  return {
    runRepository,
    stepRepository,
    artifactRepository,
    jobs,
    service: new SeoBriefRunControlService(runRepository, stepRepository, artifactRepository, jobs),
  };
}

function createFinishedRun(): SeoBriefRun {
  const run = SeoBriefRun.create({
    topicSeed: 'how to earn with USDT',
    country: 'Nigeria',
    language: 'English',
    audience: 'Beginners',
    productName: 'Reinforce',
    productDescription: 'Helps users make idle USDT productive',
    brandMemorySnapshot: {
      brandName: 'Reinforce',
      productDescription: 'Helps users make idle USDT productive',
      targetAudience: 'Beginners',
      approvedFacts: [],
      forbiddenClaims: [],
      glossary: {},
      bannedPhrases: [],
      requiredPhrases: [],
      brandDocs: [],
      adaptationPromptRules: null,
    },
  });
  run.queue();
  run.start();
  run.complete();
  return run;
}

describe('SeoBriefRunControlService', () => {
  it('queues a stage rerun, supersedes downstream steps, and saves the request artifact', async () => {
    const ctx = createService();
    const run = createFinishedRun();
    await ctx.runRepository.save(run);
    await ctx.stepRepository.save(
      SeoBriefRunStep.create({
        runId: run.id,
        stage: 'cluster_scoring',
        status: 'completed',
      }),
    );
    await ctx.stepRepository.save(
      SeoBriefRunStep.create({
        runId: run.id,
        stage: 'cluster_selection',
        status: 'completed',
      }),
    );
    await ctx.stepRepository.save(
      SeoBriefRunStep.create({
        runId: run.id,
        stage: 'brief_generation',
        status: 'completed',
      }),
    );

    const result = await ctx.service.rerun({
      runId: run.id,
      startStage: 'cluster_scoring',
      requestedBy: 'rerun_stage',
      seoWeight: 0.2,
      productWeight: 0.8,
    });

    const storedRun = await ctx.runRepository.findById(run.id);
    const steps = await ctx.stepRepository.findByRunId(run.id);
    const artifacts = await ctx.artifactRepository.findByRunId(run.id);

    expect(result.status).toBe('queued');
    expect(result.startStage).toBe('cluster_scoring');
    expect(result.jobId).toBe('1');
    expect(result.seoProductBalance).toEqual({
      seoWeight: 0.2,
      productWeight: 0.8,
    });
    expect(ctx.jobs.jobs).toEqual([
      {
        runId: run.id,
        startStage: 'cluster_scoring',
        stopAfterStage: 'cluster_scoring',
      },
    ]);
    expect(storedRun?.status).toBe('queued');
    expect(storedRun?.seoWeight).toBe(0.2);
    expect(storedRun?.productWeight).toBe(0.8);
    expect(steps.map((step) => [step.stage, step.status])).toEqual([
      ['cluster_scoring', 'superseded'],
      ['cluster_selection', 'superseded'],
      ['brief_generation', 'superseded'],
    ]);
    expect(
      artifacts.find((artifact) => artifact.artifactType === 'rerun_request')?.payload,
    ).toEqual({
      requestedBy: 'rerun_stage',
      requestedStage: 'cluster_scoring',
      seoProductBalance: {
        seoWeight: 0.2,
        productWeight: 0.8,
      },
    });
  });

  it('moves the run into manual review or rejection without enqueueing a new job', async () => {
    const ctx = createService();
    const run = createFinishedRun();
    await ctx.runRepository.save(run);

    const manualReview = await ctx.service.markManualReview({
      runId: run.id,
      reason: 'Need human review before republishing',
    });
    const rejected = await ctx.service.reject({
      runId: run.id,
      reason: 'Topic quality is too weak',
    });
    const artifacts = await ctx.artifactRepository.findByRunId(run.id);

    expect(manualReview.status).toBe('needs_manual_review');
    expect(manualReview.jobId).toBeNull();
    expect(rejected.status).toBe('rejected');
    expect(rejected.jobId).toBeNull();
    expect(ctx.jobs.jobs).toHaveLength(0);
    expect(artifacts.map((artifact) => artifact.artifactType)).toEqual([
      'manual_review_request',
      'run_rejection_request',
    ]);
  });

  it('rejects control commands while the run is already queued or running', async () => {
    const ctx = createService();
    const run = SeoBriefRun.create({
      topicSeed: 'how to earn with USDT',
      country: 'Nigeria',
      language: 'English',
      audience: 'Beginners',
      productName: 'Reinforce',
      productDescription: 'Helps users make idle USDT productive',
      brandMemorySnapshot: {
        brandName: 'Reinforce',
        productDescription: 'Helps users make idle USDT productive',
        targetAudience: 'Beginners',
        approvedFacts: [],
        forbiddenClaims: [],
        glossary: {},
        bannedPhrases: [],
        requiredPhrases: [],
        brandDocs: [],
        adaptationPromptRules: null,
      },
    });
    run.queue();
    await ctx.runRepository.save(run);

    await expect(
      ctx.service.rerun({
        runId: run.id,
        startStage: 'brief_generation',
        requestedBy: 'regenerate_brief',
      }),
    ).rejects.toBeInstanceOf(SeoBriefRunBusyError);
  });

  it('blocks reruns after the configured manual attempt limit', async () => {
    const ctx = createService();
    const run = createFinishedRun();
    await ctx.runRepository.save(run);

    for (const attemptNumber of [1, 2, 3]) {
      await ctx.stepRepository.save(
        SeoBriefRunStep.create({
          runId: run.id,
          stage: 'brief_generation',
          status: 'completed',
          attemptNumber,
        }),
      );
    }

    await expect(
      ctx.service.rerun({
        runId: run.id,
        startStage: 'brief_generation',
        requestedBy: 'regenerate_brief',
      }),
    ).rejects.toBeInstanceOf(SeoBriefRunAttemptLimitError);
  });

  it('advances the run to the next unfinished stage with a single-stage job', async () => {
    const ctx = createService();
    const run = createFinishedRun();
    run.awaitConfirmation();
    await ctx.runRepository.save(run);
    await ctx.stepRepository.save(
      SeoBriefRunStep.create({
        runId: run.id,
        stage: 'keyword_expansion',
        status: 'completed',
      }),
    );

    const result = await ctx.service.advance({ runId: run.id });
    const artifacts = await ctx.artifactRepository.findByRunId(run.id);

    expect(result.status).toBe('queued');
    expect(result.startStage).toBe('keyword_research');
    expect(ctx.jobs.jobs).toEqual([
      {
        runId: run.id,
        startStage: 'keyword_research',
        stopAfterStage: 'keyword_research',
      },
    ]);
    expect(
      artifacts.find((artifact) => artifact.artifactType === 'advance_request')?.payload,
    ).toEqual({
      requestedStage: 'keyword_research',
      statusBeforeQueue: 'awaiting_confirmation',
    });
  });
});
