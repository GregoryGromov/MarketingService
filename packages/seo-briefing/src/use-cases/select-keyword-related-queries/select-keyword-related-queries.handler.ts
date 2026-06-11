import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { SeoBriefArtifact } from '../../domain/seo-brief-artifact.entity.js';
import { SeoBriefArtifactRepository } from '../../domain/seo-brief-artifact.repository.js';
import { SeoBriefRunRepository } from '../../domain/seo-brief-run.repository.js';
import type { SeoBriefJsonObject, SeoBriefJsonValue } from '../../domain/seo-briefing.types.js';
import { SeoBriefRunNotFoundError } from '../../errors/seo-brief-run-not-found.error.js';
import { SeoBriefSerpDerivedKeywordsNotFoundError } from '../../errors/seo-brief-serp-derived-keywords-not-found.error.js';
import {
  type SelectedRelatedKeyword,
  type SelectRelatedKeywordCandidateInput,
  type SeoBriefAiModelMode,
  SeoBriefAiPort,
} from '../../ports/seo-brief-ai.port.js';
import { readRequestTimeoutMsFromArtifacts } from '../seo-brief-request-timeout.js';
import { SelectKeywordRelatedQueriesCommand } from './select-keyword-related-queries.command.js';

const MAX_SELECTED_RELATED_QUERIES = 3;

export interface SelectKeywordRelatedQueriesResult {
  artifactId: string;
  keywordCount: number;
  selectedCount: number;
  payload: SeoBriefJsonValue;
}

function asObject(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function readAiModelMode(artifacts: SeoBriefArtifact[]): SeoBriefAiModelMode {
  const normalizedInputArtifact = [...artifacts]
    .reverse()
    .find((artifact) => artifact.artifactType === 'normalized_input');
  const payload = asObject(normalizedInputArtifact?.payload);
  const value = asString(payload?.aiModelMode);
  return value === 'flash' || value === 'pro' || value === 'pro_thinking' ? value : 'pro';
}

function normalizeQuery(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeSearchQuery(value: string): string {
  return normalizeQuery(value)
    .replace(/[?!.\u3002\uff01\uff1f]+$/u, '')
    .trim();
}

function queryKey(value: string): string {
  return normalizeSearchQuery(value).toLowerCase();
}

function readCandidates(item: Record<string, unknown>): SelectRelatedKeywordCandidateInput[] {
  const rawCandidates = Array.isArray(item.similarSearchQueries) ? item.similarSearchQueries : [];

  return rawCandidates
    .map((candidate) => asObject(candidate))
    .filter((candidate): candidate is Record<string, unknown> => candidate !== null)
    .map((candidate) => ({
      query: normalizeSearchQuery(asString(candidate.query) ?? ''),
      source: normalizeQuery(asString(candidate.source) ?? ''),
      sourceText: normalizeQuery(asString(candidate.sourceText) ?? asString(candidate.query) ?? ''),
      reason: normalizeQuery(asString(candidate.reason) ?? ''),
    }))
    .filter((candidate) => candidate.query.length > 0 && candidate.sourceText.length > 0);
}

function selectGroundedResults(params: {
  aiSelected: SelectedRelatedKeyword[];
  candidates: SelectRelatedKeywordCandidateInput[];
}): SelectedRelatedKeyword[] {
  const candidateByKey = new Map(
    params.candidates.map((candidate) => [queryKey(candidate.query), candidate]),
  );
  const seen = new Set<string>();
  const selected: SelectedRelatedKeyword[] = [];

  for (const item of params.aiSelected) {
    const key = queryKey(item.keyword);
    const sourceCandidate = candidateByKey.get(key);
    if (!sourceCandidate || seen.has(key)) {
      continue;
    }

    seen.add(key);
    selected.push({
      keyword: sourceCandidate.query,
      source: sourceCandidate.source,
      sourceText: sourceCandidate.sourceText,
      reason: normalizeQuery(item.reason || sourceCandidate.reason),
    });

    if (selected.length >= MAX_SELECTED_RELATED_QUERIES) {
      break;
    }
  }

  return selected;
}

function readDerivedItems(payload: SeoBriefJsonValue, runId: string): Record<string, unknown>[] {
  const record = asObject(payload);
  const items = Array.isArray(record?.items) ? record.items.map((item) => asObject(item)) : [];
  const derivedItems = items.filter((item): item is Record<string, unknown> => item !== null);

  if (derivedItems.length === 0) {
    throw new SeoBriefSerpDerivedKeywordsNotFoundError(runId);
  }

  return derivedItems;
}

@CommandHandler(SelectKeywordRelatedQueriesCommand)
export class SelectKeywordRelatedQueriesHandler
  implements ICommandHandler<SelectKeywordRelatedQueriesCommand, SelectKeywordRelatedQueriesResult>
{
  constructor(
    @Inject(SeoBriefRunRepository)
    private readonly runRepository: SeoBriefRunRepository,
    @Inject(SeoBriefArtifactRepository)
    private readonly artifactRepository: SeoBriefArtifactRepository,
    @Inject(SeoBriefAiPort)
    private readonly ai: SeoBriefAiPort,
  ) {}

  async execute(
    command: SelectKeywordRelatedQueriesCommand,
  ): Promise<SelectKeywordRelatedQueriesResult> {
    const run = await this.runRepository.findById(command.runId as never);
    if (!run) {
      throw new SeoBriefRunNotFoundError(command.runId);
    }

    const artifacts = await this.artifactRepository.findByRunId(run.id);
    const aiModelMode = readAiModelMode(artifacts);
    const requestTimeoutMs = readRequestTimeoutMsFromArtifacts(artifacts);
    const derivedArtifact = [...artifacts]
      .reverse()
      .find((artifact) => artifact.artifactType === 'keyword_serp_derived_keywords');
    const derivedItems = readDerivedItems(derivedArtifact?.payload ?? null, run.id);
    const selectionItems: SeoBriefJsonValue[] = [];
    let selectedCount = 0;

    for (const item of derivedItems) {
      const keyword = normalizeQuery(asString(item.keyword) ?? '');
      if (!keyword) {
        continue;
      }

      const candidates = readCandidates(item);
      const aiResult =
        candidates.length > 0
          ? await this.ai.selectRelatedKeywords({
              runId: run.id,
              modelMode: aiModelMode,
              timeoutMs: requestTimeoutMs,
              seedKeyword: keyword,
              candidates,
              limit: MAX_SELECTED_RELATED_QUERIES,
            })
          : { selected: [], rejected: [] };
      const selected = selectGroundedResults({
        aiSelected: aiResult.selected,
        candidates,
      });
      selectedCount += selected.length;

      selectionItems.push({
        index: typeof item.index === 'number' ? item.index : selectionItems.length,
        keyword,
        selected: selected as unknown as SeoBriefJsonValue,
        rejected: aiResult.rejected as unknown as SeoBriefJsonValue,
        selectionRules: {
          maxSelected: MAX_SELECTED_RELATED_QUERIES,
          grounding: 'selected keyword must exactly match one SERP-derived candidate query',
        },
      });
    }

    if (selectionItems.length === 0) {
      throw new SeoBriefSerpDerivedKeywordsNotFoundError(run.id);
    }

    const payload: SeoBriefJsonObject = {
      items: selectionItems,
      selectionRules: {
        maxSelectedPerKeyword: MAX_SELECTED_RELATED_QUERIES,
        grounding: 'selected keyword must exactly match one SERP-derived candidate query',
      },
    };
    const artifact = SeoBriefArtifact.create({
      runId: run.id,
      stage: 'keyword_expansion',
      artifactType: 'keyword_related_query_selections',
      payload,
    });

    await this.artifactRepository.save(artifact);

    return {
      artifactId: artifact.id,
      keywordCount: selectionItems.length,
      payload,
      selectedCount,
    };
  }
}
