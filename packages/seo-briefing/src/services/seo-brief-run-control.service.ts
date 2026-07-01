import { Inject, Injectable } from '@nestjs/common';
import { SEO_BRIEF_OPERATIONAL_LIMITS } from '../config/seo-brief-operational-limits.js';
import { SeoBriefArtifact } from '../domain/seo-brief-artifact.entity.js';
import { SeoBriefArtifactRepository } from '../domain/seo-brief-artifact.repository.js';
import type { SeoBriefRunStatus } from '../domain/seo-brief-run.aggregate.js';
import { SeoBriefRunRepository } from '../domain/seo-brief-run.repository.js';
import {
  SEO_BRIEF_RUN_STAGE_ORDER,
  type SeoBriefRerunnableStage,
  type SeoBriefRunStage,
  type SeoBriefRunStep,
} from '../domain/seo-brief-run-step.entity.js';
import { SeoBriefRunStepRepository } from '../domain/seo-brief-run-step.repository.js';
import type { SeoBriefJsonObject, SeoBriefJsonValue } from '../domain/seo-briefing.types.js';
import { SeoBriefRunAttemptLimitError } from '../errors/seo-brief-run-attempt-limit.error.js';
import { SeoBriefRunBusyError } from '../errors/seo-brief-run-busy.error.js';
import { SeoBriefRunNoNextStageError } from '../errors/seo-brief-run-no-next-stage.error.js';
import { SeoBriefRunNotFoundError } from '../errors/seo-brief-run-not-found.error.js';
import { SeoBriefRunJobPort } from '../ports/seo-brief-run-job.port.js';

export interface SeoBriefRunControlResult {
  runId: string;
  status: SeoBriefRunStatus;
  startStage: SeoBriefRerunnableStage | null;
  jobId: string | null;
  seoProductBalance: {
    seoWeight: number;
    productWeight: number;
  };
}

@Injectable()
export class SeoBriefRunControlService {
  constructor(
    @Inject(SeoBriefRunRepository)
    private readonly runRepository: SeoBriefRunRepository,
    @Inject(SeoBriefRunStepRepository)
    private readonly stepRepository: SeoBriefRunStepRepository,
    @Inject(SeoBriefArtifactRepository)
    private readonly artifactRepository: SeoBriefArtifactRepository,
    @Inject(SeoBriefRunJobPort)
    private readonly jobs: SeoBriefRunJobPort,
  ) {}

  async rerun(params: {
    runId: string;
    startStage: SeoBriefRerunnableStage;
    requestedBy: 'rerun_whole' | 'rerun_stage' | 'regenerate_brief';
    seoWeight?: number | null;
    productWeight?: number | null;
  }): Promise<SeoBriefRunControlResult> {
    const run = await this.loadRun(params.runId);
    this.assertNotBusy(run.status, run.id);
    await this.assertAttemptLimit(run.id, params.startStage);

    if (params.seoWeight != null || params.productWeight != null) {
      run.setSeoProductBalance({
        seoWeight: params.seoWeight,
        productWeight: params.productWeight,
      });
    }

    await this.supersedeSteps(run.id, params.startStage);
    run.queue();
    await this.runRepository.save(run);
    await this.saveAdminArtifact({
      runId: run.id,
      stage: params.startStage,
      artifactType: 'rerun_request',
      payload: {
        requestedBy: params.requestedBy,
        requestedStage: params.startStage,
        seoProductBalance: {
          seoWeight: run.seoWeight,
          productWeight: run.productWeight,
        },
      },
    });

    const job = await this.jobs.enqueueRun({
      runId: run.id,
      startStage: params.startStage,
      stopAfterStage: params.startStage,
    });

    return {
      runId: run.id,
      status: run.status,
      startStage: params.startStage,
      jobId: job.jobId,
      seoProductBalance: {
        seoWeight: run.seoWeight,
        productWeight: run.productWeight,
      },
    };
  }

  async advance(params: { runId: string }): Promise<SeoBriefRunControlResult> {
    const run = await this.loadRun(params.runId);
    this.assertNotBusy(run.status, run.id);

    const steps = await this.stepRepository.findByRunId(run.id as never);
    const nextStage = findNextStage(steps);
    if (!nextStage) {
      throw new SeoBriefRunNoNextStageError(run.id);
    }

    const previousStatus = run.status;
    run.queue();
    await this.runRepository.save(run);
    await this.saveAdminArtifact({
      runId: run.id,
      stage: nextStage,
      artifactType: 'advance_request',
      payload: {
        requestedStage: nextStage,
        statusBeforeQueue: previousStatus,
      },
    });

    const job = await this.jobs.enqueueRun({
      runId: run.id,
      startStage: nextStage,
      stopAfterStage: nextStage,
    });

    return {
      runId: run.id,
      status: run.status,
      startStage: nextStage,
      jobId: job.jobId,
      seoProductBalance: {
        seoWeight: run.seoWeight,
        productWeight: run.productWeight,
      },
    };
  }

  /**
   * Enqueue a single backend job that runs the complete headless pipeline.
   * Auto runs must not stop for manual review: the worker auto-selects the best
   * available cluster and continues toward article output.
   */
  async runAutoUntilSelection(params: { runId: string }): Promise<SeoBriefRunControlResult> {
    return this.enqueueFullAutoFlow(params.runId);
  }

  private async enqueueFullAutoFlow(runId: string): Promise<SeoBriefRunControlResult> {
    const run = await this.loadRun(runId);
    this.assertNotBusy(run.status, run.id);

    run.queue();
    await this.runRepository.save(run);
    await this.saveAdminArtifact({
      runId: run.id,
      stage: 'keyword_expansion',
      artifactType: 'auto_run_request',
      payload: {
        requestedBy: 'full_auto_flow',
        fullAutoFlow: true,
      },
    });

    const job = await this.jobs.enqueueRun({
      runId: run.id,
      fullAutoFlow: true,
    });

    return {
      runId: run.id,
      status: run.status,
      startStage: 'keyword_expansion',
      jobId: job.jobId,
      seoProductBalance: {
        seoWeight: run.seoWeight,
        productWeight: run.productWeight,
      },
    };
  }

  async markManualReview(params: {
    runId: string;
    reason?: string | null;
  }): Promise<SeoBriefRunControlResult> {
    const run = await this.loadRun(params.runId);
    this.assertNotBusy(run.status, run.id);

    run.markNeedsManualReview(params.reason ?? null);
    await this.runRepository.save(run);
    await this.saveAdminArtifact({
      runId: run.id,
      stage: 'created',
      artifactType: 'manual_review_request',
      payload: {
        reason: params.reason?.trim() || null,
        status: run.status,
      },
    });

    return {
      runId: run.id,
      status: run.status,
      startStage: null,
      jobId: null,
      seoProductBalance: {
        seoWeight: run.seoWeight,
        productWeight: run.productWeight,
      },
    };
  }

  async reject(params: {
    runId: string;
    reason?: string | null;
  }): Promise<SeoBriefRunControlResult> {
    const run = await this.loadRun(params.runId);
    this.assertNotBusy(run.status, run.id);

    run.reject(params.reason?.trim() || 'Rejected during manual review');
    await this.runRepository.save(run);
    await this.saveAdminArtifact({
      runId: run.id,
      stage: 'created',
      artifactType: 'run_rejection_request',
      payload: {
        reason: run.failureReason,
        status: run.status,
      },
    });

    return {
      runId: run.id,
      status: run.status,
      startStage: null,
      jobId: null,
      seoProductBalance: {
        seoWeight: run.seoWeight,
        productWeight: run.productWeight,
      },
    };
  }

  private async loadRun(runId: string) {
    const run = await this.runRepository.findById(runId as never);
    if (!run) {
      throw new SeoBriefRunNotFoundError(runId);
    }

    return run;
  }

  private assertNotBusy(status: SeoBriefRunStatus, runId: string): void {
    if (status === 'queued' || status === 'running') {
      throw new SeoBriefRunBusyError(runId, status);
    }
  }

  private async supersedeSteps(runId: string, startStage: SeoBriefRerunnableStage): Promise<void> {
    const startIndex = SEO_BRIEF_RUN_STAGE_ORDER.indexOf(startStage);
    const steps = await this.stepRepository.findByRunId(runId as never);

    await Promise.all(
      steps.map(async (step) => {
        const stepIndex = SEO_BRIEF_RUN_STAGE_ORDER.indexOf(step.stage);
        if (step.status !== 'superseded' && stepIndex >= startIndex && step.stage !== 'created') {
          step.supersede();
          await this.stepRepository.save(step);
        }
      }),
    );
  }

  private async assertAttemptLimit(
    runId: string,
    startStage: SeoBriefRerunnableStage,
  ): Promise<void> {
    const steps = await this.stepRepository.findByRunId(runId as never);
    const attempts = steps
      .filter((step) => step.stage === startStage)
      .reduce((max, step) => Math.max(max, step.attemptNumber), 0);

    if (attempts >= SEO_BRIEF_OPERATIONAL_LIMITS.maxManualRerunAttemptsPerStage) {
      throw new SeoBriefRunAttemptLimitError(
        runId,
        startStage,
        SEO_BRIEF_OPERATIONAL_LIMITS.maxManualRerunAttemptsPerStage,
      );
    }
  }

  private async saveAdminArtifact(params: {
    runId: string;
    stage: SeoBriefRunStage;
    artifactType: string;
    payload: SeoBriefJsonObject;
  }): Promise<void> {
    await this.artifactRepository.save(
      SeoBriefArtifact.create({
        runId: params.runId as never,
        stage: params.stage,
        artifactType: params.artifactType,
        payload: params.payload as SeoBriefJsonValue,
      }),
    );
  }
}

function findNextStage(steps: SeoBriefRunStep[]): SeoBriefRerunnableStage | null {
  const latestByStage = new Map<SeoBriefRunStage, SeoBriefRunStep>();
  for (const step of steps) {
    latestByStage.set(step.stage, step);
  }

  for (const stage of SEO_BRIEF_RUN_STAGE_ORDER) {
    if (stage === 'created') {
      continue;
    }

    const latest = latestByStage.get(stage);
    if (!latest) {
      return stage;
    }

    if (latest.status !== 'completed') {
      return stage as SeoBriefRerunnableStage;
    }
  }

  return null;
}
