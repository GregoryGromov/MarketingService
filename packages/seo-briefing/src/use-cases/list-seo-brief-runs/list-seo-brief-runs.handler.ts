import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { SeoBriefArtifactRepository } from '../../domain/seo-brief-artifact.repository.js';
import { SeoBriefDocumentRepository } from '../../domain/seo-brief-document.repository.js';
import { SeoBriefExternalCallLogRepository } from '../../domain/seo-brief-external-call-log.repository.js';
import { SeoBriefLlmLogRepository } from '../../domain/seo-brief-llm-log.repository.js';
import type { SeoBriefRunStatus } from '../../domain/seo-brief-run.aggregate.js';
import { SeoBriefRunRepository } from '../../domain/seo-brief-run.repository.js';
import { SeoBriefRunStepRepository } from '../../domain/seo-brief-run-step.repository.js';
import type { SeoBriefJsonValue } from '../../domain/seo-briefing.types.js';
import { ListSeoBriefRunsQuery } from './list-seo-brief-runs.query.js';

export interface ListSeoBriefRunsResultItem {
  id: string;
  projectId: string | null;
  status: SeoBriefRunStatus;
  topicSeed: string;
  market: {
    country: string;
    language: string;
  };
  productName: string;
  failureReason: string | null;
  selectedClusterLabel: string | null;
  finalBriefTitle: string | null;
  hasFinalBrief: boolean;
  metricsSummary: {
    totalCost: number;
    totalRunDurationMs: number | null;
  };
  createdAt: Date;
  updatedAt: Date;
}

@QueryHandler(ListSeoBriefRunsQuery)
export class ListSeoBriefRunsHandler
  implements IQueryHandler<ListSeoBriefRunsQuery, ListSeoBriefRunsResultItem[]>
{
  constructor(
    @Inject(SeoBriefRunRepository)
    private readonly runRepository: SeoBriefRunRepository,
    @Inject(SeoBriefDocumentRepository)
    private readonly documentRepository: SeoBriefDocumentRepository,
    @Inject(SeoBriefArtifactRepository)
    private readonly artifactRepository: SeoBriefArtifactRepository,
    @Inject(SeoBriefRunStepRepository)
    private readonly stepRepository: SeoBriefRunStepRepository,
    @Inject(SeoBriefLlmLogRepository)
    private readonly llmLogRepository: SeoBriefLlmLogRepository,
    @Inject(SeoBriefExternalCallLogRepository)
    private readonly externalCallLogRepository: SeoBriefExternalCallLogRepository,
  ) {}

  async execute(query: ListSeoBriefRunsQuery): Promise<ListSeoBriefRunsResultItem[]> {
    const runs = await this.runRepository.findMany({
      limit: normalizeLimit(query.filters.limit),
      projectId: normalizeText(query.filters.projectId),
      status: query.filters.status ?? null,
    });

    const documents = await Promise.all(
      runs.map(async (run) => ({
        runId: run.id,
        document: await this.documentRepository.findLatestByRunId(run.id),
        artifacts: await this.artifactRepository.findByRunId(run.id),
        steps: await this.stepRepository.findByRunId(run.id),
        llmCalls: await this.llmLogRepository.findByRunId(run.id),
        externalCalls: await this.externalCallLogRepository.findByRunId(run.id),
      })),
    );
    const documentMap = new Map(documents.map((item) => [item.runId, item]));

    return runs.map((run) => {
      const aggregate = documentMap.get(run.id) ?? null;
      const document = aggregate?.document ?? null;
      const clusterSelection = findLatestArtifactPayload(
        aggregate?.artifacts ?? [],
        'cluster_selection_snapshot',
      );
      const finalBrief = findLatestArtifactPayload(
        aggregate?.artifacts ?? [],
        'final_brief_snapshot',
      );
      const selectedClusterPayload =
        document?.selectedClusterPayload ??
        readObjectField(clusterSelection, 'selectedCluster') ??
        readObjectField(clusterSelection, 'mainCluster') ??
        null;
      const briefPayload =
        document?.briefPayload ?? readObjectField(finalBrief, 'brief') ?? finalBrief;
      return {
        id: run.id,
        projectId: run.projectId,
        status: run.status,
        topicSeed: run.topicSeed,
        market: {
          country: run.country,
          language: run.language,
        },
        productName: run.productName,
        failureReason: run.failureReason,
        selectedClusterLabel:
          extractStringField(selectedClusterPayload, 'label') ??
          extractStringField(selectedClusterPayload, 'clusterName') ??
          extractStringField(selectedClusterPayload, 'primaryKeyword'),
        finalBriefTitle:
          extractStringField(briefPayload, 'title') ??
          extractStringField(briefPayload, 'recommendedTitle') ??
          extractStringField(finalBrief, 'title'),
        hasFinalBrief: document != null || finalBrief != null,
        metricsSummary: {
          totalCost: roundCurrency(
            (aggregate?.llmCalls ?? []).reduce((sum, log) => sum + (log.estimatedCost ?? 0), 0) +
              (aggregate?.externalCalls ?? []).reduce(
                (sum, log) => sum + (log.estimatedCost ?? 0),
                0,
              ),
          ),
          totalRunDurationMs: deriveRunDurationMs(
            run.createdAt,
            run.updatedAt,
            aggregate?.steps ?? [],
          ),
        },
        createdAt: run.createdAt,
        updatedAt: run.updatedAt,
      };
    });
  }
}

function normalizeText(value?: string | null): string | null {
  const nextValue = value?.trim();
  return nextValue ? nextValue : null;
}

function normalizeLimit(value?: number): number | undefined {
  if (value == null || !Number.isFinite(value)) {
    return 25;
  }

  if (value <= 0) {
    return 25;
  }

  return Math.min(Math.trunc(value), 100);
}

function extractStringField(payload: SeoBriefJsonValue | null, field: string): string | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return null;
  }

  const value = payload[field];
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function readObjectField(
  payload: SeoBriefJsonValue | null,
  field: string,
): SeoBriefJsonValue | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return null;
  }

  const value = payload[field];
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function findLatestArtifactPayload(
  artifacts: { artifactType: string; payload: SeoBriefJsonValue; createdAt: Date }[],
  artifactType: string,
): SeoBriefJsonValue | null {
  const artifact = artifacts
    .filter((item) => item.artifactType === artifactType)
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())[0];

  return artifact?.payload ?? null;
}

function deriveRunDurationMs(
  createdAt: Date,
  updatedAt: Date,
  steps: Array<{ finishedAt: Date | null }>,
): number | null {
  const latestFinishedAt = steps
    .map((step) => step.finishedAt?.getTime() ?? null)
    .filter((value): value is number => value != null)
    .sort((left, right) => right - left)[0];

  const endMs = latestFinishedAt ?? updatedAt.getTime();
  return Math.max(0, endMs - createdAt.getTime());
}

function roundCurrency(value: number): number {
  return Number(value.toFixed(6));
}
