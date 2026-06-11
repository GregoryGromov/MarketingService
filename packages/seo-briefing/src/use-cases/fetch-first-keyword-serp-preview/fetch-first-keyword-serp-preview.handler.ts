import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { SeoBriefArtifact } from '../../domain/seo-brief-artifact.entity.js';
import { SeoBriefArtifactRepository } from '../../domain/seo-brief-artifact.repository.js';
import { SeoBriefRunRepository } from '../../domain/seo-brief-run.repository.js';
import type { SeoBriefJsonValue } from '../../domain/seo-briefing.types.js';
import { SeoBriefKeywordHypothesesNotFoundError } from '../../errors/seo-brief-keyword-hypotheses-not-found.error.js';
import { SeoBriefRunNotFoundError } from '../../errors/seo-brief-run-not-found.error.js';
import { SeoResearchPort } from '../../ports/seo-research.port.js';
import { readRequestTimeoutMsFromArtifacts } from '../seo-brief-request-timeout.js';
import { FetchFirstKeywordSerpPreviewCommand } from './fetch-first-keyword-serp-preview.command.js';

export interface FetchFirstKeywordSerpPreviewResult {
  derivedKeywordsArtifactId: string;
  derivedKeywordsPayload: SeoBriefJsonValue;
  keyword: string;
  rawArtifactId: string;
  snapshot: SeoBriefJsonValue;
  snapshotArtifactId: string;
}

export function readKeywordsFromHypotheses(payload: SeoBriefJsonValue, runId: string): string[] {
  if (!payload || Array.isArray(payload) || typeof payload !== 'object') {
    throw new SeoBriefKeywordHypothesesNotFoundError(runId);
  }

  const hypotheses = Array.isArray(payload.hypotheses) ? payload.hypotheses : null;
  const keywords = (hypotheses ?? [])
    .map((item) =>
      item && !Array.isArray(item) && typeof item === 'object'
        ? (item as Record<string, SeoBriefJsonValue>)
        : null,
    )
    .map((item) => (typeof item?.keyword === 'string' ? item.keyword.trim() : ''))
    .filter((keyword) => keyword.length > 0);

  if (keywords.length === 0) {
    throw new SeoBriefKeywordHypothesesNotFoundError(runId);
  }

  return keywords;
}

function readFirstKeywordFromHypotheses(payload: SeoBriefJsonValue, runId: string): string {
  return readKeywordsFromHypotheses(payload, runId)[0] as string;
}

function asObject(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function normalizeCandidate(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeSearchQuery(value: string): string {
  return normalizeCandidate(value)
    .replace(/[?!.\u3002\uff01\uff1f]+$/u, '')
    .trim();
}

function candidateKey(value: string): string {
  return normalizeSearchQuery(value).toLowerCase();
}

function pushUniqueCandidate(
  candidates: Array<{
    query: string;
    reason: string;
    source: string;
    sourceText: string;
  }>,
  seen: Set<string>,
  params: {
    query: string | null;
    reason: string;
    source: string;
    sourceText?: string | null;
  },
): void {
  const query = params.query ? normalizeSearchQuery(params.query) : '';
  if (!query) {
    return;
  }

  const key = candidateKey(query);
  if (seen.has(key)) {
    return;
  }

  seen.add(key);
  candidates.push({
    query,
    source: params.source,
    sourceText: normalizeCandidate(params.sourceText ?? query),
    reason: params.reason,
  });
}

function pushUniqueTheme(
  themes: Array<{
    reason: string;
    source: string;
    sourceText: string;
    theme: string;
  }>,
  seen: Set<string>,
  params: {
    reason: string;
    source: string;
    sourceText?: string | null;
    theme: string | null;
  },
): void {
  const theme = params.theme ? normalizeCandidate(params.theme) : '';
  if (!theme) {
    return;
  }

  const key = candidateKey(theme);
  if (seen.has(key)) {
    return;
  }

  seen.add(key);
  themes.push({
    theme,
    source: params.source,
    sourceText: normalizeCandidate(params.sourceText ?? theme),
    reason: params.reason,
  });
}

export function buildSerpDerivedKeywordsPayload(params: {
  keyword: string;
  snapshot: SeoBriefJsonValue;
}): SeoBriefJsonValue {
  const snapshot = asObject(params.snapshot);
  const candidateQueries: Array<{
    query: string;
    reason: string;
    source: string;
    sourceText: string;
  }> = [];
  const serpThemes: Array<{
    reason: string;
    source: string;
    sourceText: string;
    theme: string;
  }> = [];
  const seenQueries = new Set<string>();
  const seenThemes = new Set<string>();

  for (const item of asArray(snapshot?.peopleAlsoAsk)) {
    const question = asString(asObject(item)?.question);
    pushUniqueCandidate(candidateQueries, seenQueries, {
      query: question,
      source: 'people_also_ask',
      sourceText: question,
      reason: 'Direct question from the People Also Ask SERP block.',
    });
  }

  for (const item of asArray(snapshot?.relatedSearches)) {
    const query = asString(item);
    pushUniqueCandidate(candidateQueries, seenQueries, {
      query,
      source: 'related_search',
      sourceText: query,
      reason: 'Visible related search query from the SERP.',
    });
  }

  const aiOverview = asObject(snapshot?.aiOverview);
  for (const item of asArray(aiOverview?.elements)) {
    const element = asObject(item);
    const text = asString(element?.text);
    pushUniqueTheme(serpThemes, seenThemes, {
      theme: asString(element?.title) ?? text,
      source: 'ai_overview',
      sourceText: text,
      reason: 'Theme surfaced inside the AI Overview block.',
    });
  }

  for (const item of asArray(snapshot?.organicResults)) {
    const result = asObject(item);
    const title = asString(result?.title);
    const snippet = asString(result?.snippet);
    pushUniqueTheme(serpThemes, seenThemes, {
      theme: title,
      source: 'organic_title',
      sourceText: title,
      reason: 'Recurring topic from an organic result title.',
    });
    pushUniqueTheme(serpThemes, seenThemes, {
      theme: snippet,
      source: 'organic_snippet',
      sourceText: snippet,
      reason: 'Recurring topic from an organic result snippet.',
    });
  }

  return {
    keyword: params.keyword,
    similarSearchQueries: candidateQueries,
    serpThemes: serpThemes.slice(0, 20),
    notes: [
      'Similar search queries are taken only from People Also Ask and related searches.',
      'AI Overview and organic results are stored as themes, not validated keywords.',
    ],
  };
}

@CommandHandler(FetchFirstKeywordSerpPreviewCommand)
export class FetchFirstKeywordSerpPreviewHandler
  implements
    ICommandHandler<FetchFirstKeywordSerpPreviewCommand, FetchFirstKeywordSerpPreviewResult>
{
  constructor(
    @Inject(SeoBriefRunRepository)
    private readonly runRepository: SeoBriefRunRepository,
    @Inject(SeoBriefArtifactRepository)
    private readonly artifactRepository: SeoBriefArtifactRepository,
    @Inject(SeoResearchPort)
    private readonly seoResearch: SeoResearchPort,
  ) {}

  async execute(
    command: FetchFirstKeywordSerpPreviewCommand,
  ): Promise<FetchFirstKeywordSerpPreviewResult> {
    const run = await this.runRepository.findById(command.runId as never);
    if (!run) {
      throw new SeoBriefRunNotFoundError(command.runId);
    }

    const artifacts = await this.artifactRepository.findByRunId(run.id);
    const keywordHypothesesArtifact = [...artifacts]
      .reverse()
      .find((artifact) => artifact.artifactType === 'keyword_hypotheses');

    const keyword = readFirstKeywordFromHypotheses(
      keywordHypothesesArtifact?.payload ?? null,
      run.id,
    );

    const serpPreview = await this.seoResearch.getOrganicSerpSnapshot({
      runId: run.id,
      timeoutMs: readRequestTimeoutMsFromArtifacts(artifacts),
      keyword,
      market: {
        country: run.country,
        language: run.language,
        locationName: run.country,
      },
    });

    const rawArtifact = SeoBriefArtifact.create({
      runId: run.id,
      stage: 'keyword_expansion',
      artifactType: 'first_keyword_serp_preview_raw_response',
      payload: {
        keyword,
        rawResponse: serpPreview.rawResponse,
      },
    });
    const snapshotArtifact = SeoBriefArtifact.create({
      runId: run.id,
      stage: 'keyword_expansion',
      artifactType: 'first_keyword_serp_preview_snapshot',
      payload: {
        keyword,
        snapshot: serpPreview.snapshot as unknown as SeoBriefJsonValue,
      },
    });
    const derivedKeywordsPayload = buildSerpDerivedKeywordsPayload({
      keyword,
      snapshot: serpPreview.snapshot as unknown as SeoBriefJsonValue,
    });
    const derivedKeywordsArtifact = SeoBriefArtifact.create({
      runId: run.id,
      stage: 'keyword_expansion',
      artifactType: 'first_keyword_serp_derived_keywords',
      payload: derivedKeywordsPayload,
    });

    await this.artifactRepository.save(rawArtifact);
    await this.artifactRepository.save(snapshotArtifact);
    await this.artifactRepository.save(derivedKeywordsArtifact);

    return {
      keyword,
      derivedKeywordsArtifactId: derivedKeywordsArtifact.id,
      derivedKeywordsPayload,
      rawArtifactId: rawArtifact.id,
      snapshotArtifactId: snapshotArtifact.id,
      snapshot: snapshotArtifact.payload,
    };
  }
}
