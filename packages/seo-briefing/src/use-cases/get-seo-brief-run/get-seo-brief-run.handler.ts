import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { SEO_BRIEF_OPERATIONAL_LIMITS } from '../../config/seo-brief-operational-limits.js';
import { SeoBriefArtifactRepository } from '../../domain/seo-brief-artifact.repository.js';
import { SeoBriefDocumentRepository } from '../../domain/seo-brief-document.repository.js';
import { SeoBriefExternalCallLogRepository } from '../../domain/seo-brief-external-call-log.repository.js';
import { SeoBriefLlmLogRepository } from '../../domain/seo-brief-llm-log.repository.js';
import type { SeoBriefRunStatus } from '../../domain/seo-brief-run.aggregate.js';
import { SeoBriefRunRepository } from '../../domain/seo-brief-run.repository.js';
import type {
  SeoBriefRunStage,
  SeoBriefRunStepStatus,
} from '../../domain/seo-brief-run-step.entity.js';
import { SeoBriefRunStepRepository } from '../../domain/seo-brief-run-step.repository.js';
import { SeoBriefScoreLogRepository } from '../../domain/seo-brief-score-log.repository.js';
import type {
  SeoBriefBrandMemorySnapshot,
  SeoBriefJsonValue,
} from '../../domain/seo-briefing.types.js';
import { GetSeoBriefRunQuery } from './get-seo-brief-run.query.js';

export interface GetSeoBriefRunArtifactResult {
  id: string;
  stage: SeoBriefRunStage;
  artifactType: string;
  payload: SeoBriefJsonValue;
  attempt: number;
  createdAt: Date;
}

export interface GetSeoBriefRunStepResult {
  id: string;
  stage: SeoBriefRunStage;
  status: SeoBriefRunStepStatus;
  attemptNumber: number;
  startedAt: Date;
  finishedAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
}

export interface GetSeoBriefRunLlmCallResult {
  id: string;
  stepId: string | null;
  operation: string;
  model: string;
  promptVersion: string;
  requestPayload: SeoBriefJsonValue;
  responsePayload: SeoBriefJsonValue | null;
  tokenUsageInput: number | null;
  tokenUsageOutput: number | null;
  estimatedCost: number | null;
  startedAt: Date;
  finishedAt: Date | null;
  status: 'running' | 'completed' | 'failed';
  errorMessage: string | null;
  createdAt: Date;
}

export interface GetSeoBriefRunExternalCallResult {
  id: string;
  stepId: string | null;
  provider: string;
  endpoint: string;
  requestPayload: SeoBriefJsonValue;
  responsePayload: SeoBriefJsonValue | null;
  estimatedCost: number | null;
  cacheHit: boolean;
  startedAt: Date;
  finishedAt: Date | null;
  status: 'running' | 'completed' | 'failed';
  errorMessage: string | null;
  createdAt: Date;
}

export interface GetSeoBriefRunScoreLogResult {
  id: string;
  stepId: string | null;
  formulaName: string;
  inputPayload: SeoBriefJsonValue;
  resultPayload: SeoBriefJsonValue;
  createdAt: Date;
}

export interface GetSeoBriefRunFinalBriefResult {
  id: string;
  selectedClusterPayload: SeoBriefJsonValue;
  briefPayload: SeoBriefJsonValue;
  rejectedClustersPayload: SeoBriefJsonValue | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetSeoBriefRunEvidencePackResult {
  finalBriefPayload: SeoBriefJsonValue | null;
  selectedClusterPayload: SeoBriefJsonValue | null;
  rejectedClustersPayload: SeoBriefJsonValue | null;
  researchV1Summary: SeoBriefJsonValue | null;
  researchV2Summary: SeoBriefJsonValue | null;
  selectionSnapshot: SeoBriefJsonValue | null;
  trail: {
    llmCallCount: number;
    externalCallCount: number;
    scoreLogCount: number;
  };
  timeline: Array<{
    stage: SeoBriefRunStage;
    status: SeoBriefRunStepStatus;
    finishedAt: Date | null;
    errorMessage: string | null;
  }>;
}

export interface GetSeoBriefRunResult {
  id: string;
  projectId: string | null;
  status: SeoBriefRunStatus;
  topicSeed: string;
  market: {
    country: string;
    language: string;
  };
  audience: string;
  product: {
    name: string;
    description: string;
  };
  keyMessage: string | null;
  audienceShift: {
    after: string | null;
    before: string | null;
  };
  cta: string | null;
  seoProductBalance: {
    productWeight: number;
    seoWeight: number;
  };
  brandMemorySnapshot: SeoBriefBrandMemorySnapshot;
  failureReason: string | null;
  operationalLimits: typeof SEO_BRIEF_OPERATIONAL_LIMITS;
  metrics: {
    stageDurationsMs: Partial<Record<SeoBriefRunStage, number>>;
    totalRunDurationMs: number | null;
    totalLlmCost: number;
    totalExternalCost: number;
    totalCost: number;
    llmCallCount: number;
    externalCallCount: number;
    scoreLogCount: number;
    cacheHitCount: number;
    costBreakdownByStep: Array<{
      stepId: string | null;
      stage: SeoBriefRunStage | null;
      attemptNumber: number | null;
      llmCost: number;
      externalCost: number;
      totalCost: number;
      llmCallCount: number;
      externalCallCount: number;
      cacheHitCount: number;
      llmOperations: string[];
      externalEndpoints: string[];
      startedAt: Date | null;
      finishedAt: Date | null;
    }>;
  };
  createdAt: Date;
  updatedAt: Date;
  steps: GetSeoBriefRunStepResult[];
  artifacts: GetSeoBriefRunArtifactResult[];
  llmCalls: GetSeoBriefRunLlmCallResult[];
  externalCalls: GetSeoBriefRunExternalCallResult[];
  scoreLogs: GetSeoBriefRunScoreLogResult[];
  finalBrief: GetSeoBriefRunFinalBriefResult | null;
  evidencePack: GetSeoBriefRunEvidencePackResult | null;
}

@QueryHandler(GetSeoBriefRunQuery)
export class GetSeoBriefRunHandler
  implements IQueryHandler<GetSeoBriefRunQuery, GetSeoBriefRunResult | null>
{
  constructor(
    @Inject(SeoBriefRunRepository)
    private readonly runRepository: SeoBriefRunRepository,
    @Inject(SeoBriefRunStepRepository)
    private readonly runStepRepository: SeoBriefRunStepRepository,
    @Inject(SeoBriefArtifactRepository)
    private readonly artifactRepository: SeoBriefArtifactRepository,
    @Inject(SeoBriefDocumentRepository)
    private readonly documentRepository: SeoBriefDocumentRepository,
    @Inject(SeoBriefLlmLogRepository)
    private readonly llmLogRepository: SeoBriefLlmLogRepository,
    @Inject(SeoBriefExternalCallLogRepository)
    private readonly externalCallLogRepository: SeoBriefExternalCallLogRepository,
    @Inject(SeoBriefScoreLogRepository)
    private readonly scoreLogRepository: SeoBriefScoreLogRepository,
  ) {}

  async execute(query: GetSeoBriefRunQuery): Promise<GetSeoBriefRunResult | null> {
    const run = await this.runRepository.findById(query.runId);
    if (!run) {
      return null;
    }

    const [steps, artifacts, finalBriefDocument, llmCalls, externalCalls, scoreLogs] =
      await Promise.all([
        this.runStepRepository.findByRunId(run.id),
        this.artifactRepository.findByRunId(run.id),
        this.documentRepository.findLatestByRunId(run.id),
        this.llmLogRepository.findByRunId(run.id),
        this.externalCallLogRepository.findByRunId(run.id),
        this.scoreLogRepository.findByRunId(run.id),
      ]);

    const finalBrief = finalBriefDocument
      ? {
          id: finalBriefDocument.id,
          selectedClusterPayload: finalBriefDocument.selectedClusterPayload,
          briefPayload: finalBriefDocument.briefPayload,
          rejectedClustersPayload: finalBriefDocument.rejectedClustersPayload,
          createdAt: finalBriefDocument.createdAt,
          updatedAt: finalBriefDocument.updatedAt,
        }
      : null;
    const researchV1Summary = findLatestArtifactPayload(artifacts, 'research_v1_summary');
    const researchV2Summary = findLatestArtifactPayload(artifacts, 'research_v2_summary');
    const selectionSnapshot = findLatestArtifactPayload(artifacts, 'cluster_selection_snapshot');
    const evidencePack = finalBrief
      ? {
          finalBriefPayload: finalBrief.briefPayload,
          selectedClusterPayload: finalBrief.selectedClusterPayload,
          rejectedClustersPayload: finalBrief.rejectedClustersPayload,
          researchV1Summary,
          researchV2Summary,
          selectionSnapshot,
          trail: {
            llmCallCount: llmCalls.length,
            externalCallCount: externalCalls.length,
            scoreLogCount: scoreLogs.length,
          },
          timeline: steps.map((step) => ({
            stage: step.stage,
            status: step.status,
            finishedAt: step.finishedAt,
            errorMessage: step.errorMessage,
          })),
        }
      : null;
    const metrics = buildRunMetrics(
      run.createdAt,
      run.updatedAt,
      steps,
      llmCalls,
      externalCalls,
      scoreLogs,
    );

    return {
      id: run.id,
      projectId: run.projectId,
      status: run.status,
      topicSeed: run.topicSeed,
      market: {
        country: run.country,
        language: run.language,
      },
      audience: run.audience,
      product: {
        name: run.productName,
        description: run.productDescription,
      },
      keyMessage: run.keyMessage,
      audienceShift: {
        before: run.audienceBefore,
        after: run.audienceAfter,
      },
      cta: run.cta,
      operationalLimits: SEO_BRIEF_OPERATIONAL_LIMITS,
      metrics,
      seoProductBalance: {
        seoWeight: run.seoWeight,
        productWeight: run.productWeight,
      },
      brandMemorySnapshot: run.brandMemorySnapshot,
      failureReason: run.failureReason,
      createdAt: run.createdAt,
      updatedAt: run.updatedAt,
      steps: steps.map((step) => ({
        id: step.id,
        stage: step.stage,
        status: step.status,
        attemptNumber: step.attemptNumber,
        startedAt: step.startedAt,
        finishedAt: step.finishedAt,
        errorMessage: step.errorMessage,
        createdAt: step.createdAt,
      })),
      artifacts: artifacts.map((artifact) => ({
        id: artifact.id,
        stage: artifact.stage,
        artifactType: artifact.artifactType,
        payload: artifact.payload,
        attempt: artifact.attempt,
        createdAt: artifact.createdAt,
      })),
      llmCalls: llmCalls.map((log) => ({
        id: log.id,
        stepId: log.stepId,
        operation: log.operation,
        model: log.model,
        promptVersion: log.promptVersion,
        requestPayload: log.requestPayload,
        responsePayload: log.responsePayload,
        tokenUsageInput: log.tokenUsageInput,
        tokenUsageOutput: log.tokenUsageOutput,
        estimatedCost: log.estimatedCost,
        startedAt: log.startedAt,
        finishedAt: log.finishedAt,
        status: log.status,
        errorMessage: log.errorMessage,
        createdAt: log.createdAt,
      })),
      externalCalls: externalCalls.map((log) => ({
        id: log.id,
        stepId: log.stepId,
        provider: log.provider,
        endpoint: log.endpoint,
        requestPayload: log.requestPayload,
        responsePayload: log.responsePayload,
        estimatedCost: log.estimatedCost,
        cacheHit: log.cacheHit,
        startedAt: log.startedAt,
        finishedAt: log.finishedAt,
        status: log.status,
        errorMessage: log.errorMessage,
        createdAt: log.createdAt,
      })),
      scoreLogs: scoreLogs.map((log) => ({
        id: log.id,
        stepId: log.stepId,
        formulaName: log.formulaName,
        inputPayload: log.inputPayload,
        resultPayload: log.resultPayload,
        createdAt: log.createdAt,
      })),
      finalBrief,
      evidencePack,
    };
  }
}

function buildRunMetrics(
  createdAt: Date,
  updatedAt: Date,
  steps: Array<{
    id: string;
    stage: SeoBriefRunStage;
    startedAt: Date;
    finishedAt: Date | null;
    attemptNumber: number;
  }>,
  llmCalls: Array<{
    stepId: string | null;
    operation: string;
    estimatedCost: number | null;
  }>,
  externalCalls: Array<{
    stepId: string | null;
    endpoint: string;
    estimatedCost: number | null;
    cacheHit: boolean;
  }>,
  scoreLogs: Array<unknown>,
): GetSeoBriefRunResult['metrics'] {
  const latestSteps = new Map<SeoBriefRunStage, (typeof steps)[number]>();
  for (const step of steps) {
    const current = latestSteps.get(step.stage);
    if (!current || current.attemptNumber <= step.attemptNumber) {
      latestSteps.set(step.stage, step);
    }
  }

  const stageDurationsMs = Object.fromEntries(
    [...latestSteps.values()]
      .filter((step) => step.finishedAt)
      .map((step) => [
        step.stage,
        Math.max(
          0,
          (step.finishedAt?.getTime() ?? step.startedAt.getTime()) - step.startedAt.getTime(),
        ),
      ]),
  ) as Partial<Record<SeoBriefRunStage, number>>;
  const latestFinishedAt = [...latestSteps.values()]
    .map((step) => step.finishedAt?.getTime() ?? null)
    .filter((value): value is number => value != null)
    .sort((left, right) => right - left)[0];
  const totalRunDurationMs =
    latestFinishedAt != null
      ? Math.max(0, latestFinishedAt - createdAt.getTime())
      : Math.max(0, updatedAt.getTime() - createdAt.getTime());
  const totalLlmCost = roundCurrency(
    llmCalls.reduce((sum, log) => sum + (log.estimatedCost ?? 0), 0),
  );
  const totalExternalCost = roundCurrency(
    externalCalls.reduce((sum, log) => sum + (log.estimatedCost ?? 0), 0),
  );

  return {
    stageDurationsMs,
    totalRunDurationMs,
    totalLlmCost,
    totalExternalCost,
    totalCost: roundCurrency(totalLlmCost + totalExternalCost),
    llmCallCount: llmCalls.length,
    externalCallCount: externalCalls.length,
    scoreLogCount: scoreLogs.length,
    cacheHitCount: externalCalls.filter((log) => log.cacheHit).length,
    costBreakdownByStep: buildCostBreakdownByStep(steps, llmCalls, externalCalls),
  };
}

function buildCostBreakdownByStep(
  steps: Array<{
    id: string;
    stage: SeoBriefRunStage;
    startedAt: Date;
    finishedAt: Date | null;
    attemptNumber: number;
  }>,
  llmCalls: Array<{
    stepId: string | null;
    operation: string;
    estimatedCost: number | null;
  }>,
  externalCalls: Array<{
    stepId: string | null;
    endpoint: string;
    estimatedCost: number | null;
    cacheHit: boolean;
  }>,
): GetSeoBriefRunResult['metrics']['costBreakdownByStep'] {
  const stepById = new Map(steps.map((step) => [step.id, step]));
  const buckets = new Map<
    string,
    GetSeoBriefRunResult['metrics']['costBreakdownByStep'][number]
  >();

  const getBucket = (stepId: string | null) => {
    const key = stepId ?? '__run_level__';
    const existing = buckets.get(key);
    if (existing) {
      return existing;
    }

    const step = stepId ? stepById.get(stepId) : null;
    const bucket: GetSeoBriefRunResult['metrics']['costBreakdownByStep'][number] = {
      stepId,
      stage: step?.stage ?? null,
      attemptNumber: step?.attemptNumber ?? null,
      llmCost: 0,
      externalCost: 0,
      totalCost: 0,
      llmCallCount: 0,
      externalCallCount: 0,
      cacheHitCount: 0,
      llmOperations: [],
      externalEndpoints: [],
      startedAt: step?.startedAt ?? null,
      finishedAt: step?.finishedAt ?? null,
    };
    buckets.set(key, bucket);

    return bucket;
  };

  for (const call of llmCalls) {
    const bucket = getBucket(call.stepId);
    bucket.llmCost = roundCurrency(bucket.llmCost + (call.estimatedCost ?? 0));
    bucket.llmCallCount += 1;
    bucket.llmOperations = appendUnique(bucket.llmOperations, call.operation);
  }

  for (const call of externalCalls) {
    const bucket = getBucket(call.stepId);
    bucket.externalCost = roundCurrency(bucket.externalCost + (call.estimatedCost ?? 0));
    bucket.externalCallCount += 1;
    bucket.cacheHitCount += call.cacheHit ? 1 : 0;
    bucket.externalEndpoints = appendUnique(bucket.externalEndpoints, call.endpoint);
  }

  const stepOrder = new Map(steps.map((step, index) => [step.id, index]));
  return [...buckets.values()]
    .map((bucket) => ({
      ...bucket,
      totalCost: roundCurrency(bucket.llmCost + bucket.externalCost),
    }))
    .sort((left, right) => {
      if (!left.stepId) return 1;
      if (!right.stepId) return -1;
      return (stepOrder.get(left.stepId) ?? Number.MAX_SAFE_INTEGER) -
        (stepOrder.get(right.stepId) ?? Number.MAX_SAFE_INTEGER);
    });
}

function appendUnique(values: string[], value: string): string[] {
  return values.includes(value) ? values : [...values, value];
}

function roundCurrency(value: number): number {
  return Number(value.toFixed(6));
}

function findLatestArtifactPayload(
  artifacts: Array<{ artifactType: string; payload: SeoBriefJsonValue }>,
  artifactType: string,
): SeoBriefJsonValue | null {
  for (let index = artifacts.length - 1; index >= 0; index -= 1) {
    const artifact = artifacts[index];
    if (artifact?.artifactType === artifactType) {
      return artifact.payload;
    }
  }

  return null;
}
