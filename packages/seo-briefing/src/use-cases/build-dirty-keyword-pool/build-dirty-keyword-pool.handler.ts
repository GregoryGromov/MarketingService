import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { SeoBriefArtifact } from '../../domain/seo-brief-artifact.entity.js';
import { SeoBriefArtifactRepository } from '../../domain/seo-brief-artifact.repository.js';
import { SeoBriefRunRepository } from '../../domain/seo-brief-run.repository.js';
import type { SeoBriefJsonObject, SeoBriefJsonValue } from '../../domain/seo-briefing.types.js';
import { SeoBriefRunNotFoundError } from '../../errors/seo-brief-run-not-found.error.js';
import { BuildDirtyKeywordPoolCommand } from './build-dirty-keyword-pool.command.js';

type DirtyKeywordSource =
  | 'keyword_hypothesis'
  | 'serp_derived_candidate'
  | 'selected_related_query';

interface DirtyKeywordEvidence {
  candidateScore?: number | null;
  competitorEvidence?: SeoBriefJsonValue | null;
  intent?: string | null;
  keywordGroup?: string | null;
  metrics?: SeoBriefJsonValue | null;
  proxyEvaluation?: SeoBriefJsonValue | null;
  reason?: string | null;
  serpEvidence?: SeoBriefJsonValue | null;
  source: DirtyKeywordSource;
  sourceDomain?: string | null;
  sourceKeyword?: string | null;
  sourceText?: string | null;
}

interface SerpDomainConcentration {
  dominantDomain: string | null;
  dominantDomainShare: number | null;
  hhi: number;
  label: 'low' | 'medium' | 'high' | 'very_high';
  resultCount: number;
  uniqueDomainCount: number;
}

interface DirtyKeywordCandidate {
  evidence: DirtyKeywordEvidence[];
  flags: {
    hasRankedKeywordEvidence: boolean;
    hasSearchVolume: boolean;
    hasSelectedRelatedQuery: boolean;
    hasCompetitorKeywordMatch: boolean;
    isInitialHypothesis: boolean;
  };
  metrics: {
    bestRankAbsolute: number | null;
    competitionLevel: string | null;
    competitorMatchScore: number | null;
    cpc: number | null;
    candidateScore: number | null;
    intent: string | null;
    keywordDifficulty: number | null;
    proxyDemandScore: number | null;
    searchVolume: number | null;
    sourceHypothesisSerpDomainConcentrationLabel: string | null;
    sourceHypothesisSerpDomainHhi: number | null;
    sourceHypothesisSerpDominantDomain: string | null;
    sourceHypothesisSerpDominantDomainShare: number | null;
    sourceHypothesisSerpResultCount: number | null;
    sourceHypothesisSerpUniqueDomainCount: number | null;
  };
  normalizedText: string;
  primarySource: DirtyKeywordSource;
  sourceCount: number;
  sources: DirtyKeywordSource[];
  text: string;
}

export interface BuildDirtyKeywordPoolResult {
  artifactType: 'dirty_keyword_pool';
  candidateCount: number;
  duplicateEvidenceCount: number;
  runId: string;
  sourceCounts: Record<string, number>;
}

@CommandHandler(BuildDirtyKeywordPoolCommand)
export class BuildDirtyKeywordPoolHandler
  implements ICommandHandler<BuildDirtyKeywordPoolCommand, BuildDirtyKeywordPoolResult>
{
  constructor(
    @Inject(SeoBriefRunRepository)
    private readonly runRepository: SeoBriefRunRepository,
    @Inject(SeoBriefArtifactRepository)
    private readonly artifactRepository: SeoBriefArtifactRepository,
  ) {}

  async execute(command: BuildDirtyKeywordPoolCommand): Promise<BuildDirtyKeywordPoolResult> {
    const run = await this.runRepository.findById(command.runId as never);
    if (!run) {
      throw new SeoBriefRunNotFoundError(command.runId);
    }

    const artifacts = await this.artifactRepository.findByRunId(run.id);
    const serpDomainConcentrationByKeyword = buildSerpDomainConcentrationByKeyword(artifacts);

    const builder = new DirtyKeywordPoolBuilder();
    collectKeywordHypotheses(artifacts, builder, serpDomainConcentrationByKeyword);
    collectSerpDerivedCandidates(artifacts, builder, serpDomainConcentrationByKeyword);
    collectSelectedRelatedQueries(artifacts, builder, serpDomainConcentrationByKeyword);

    const candidates = builder.build();
    if (candidates.length === 0) {
      throw new Error('No keyword sources found for dirty keyword pool');
    }

    const sourceCounts = countSources(candidates);
    const duplicateEvidenceCount = candidates.reduce(
      (sum, candidate) => sum + Math.max(0, candidate.evidence.length - 1),
      0,
    );
    const artifact = SeoBriefArtifact.create({
      runId: run.id,
      stage: 'keyword_research',
      artifactType: 'dirty_keyword_pool',
      payload: {
        artifactVersion: 'dirty_keyword_pool_v1',
        sourceArtifactTypes: [
          'keyword_hypotheses',
          'keyword_serp_preview_snapshots',
          'keyword_serp_derived_keywords',
          'keyword_related_query_selections',
        ],
        notes: [
          'This is an intentionally dirty candidate pool, not a final keyword shortlist.',
          'Duplicate exact-normalized queries are merged, but all source evidence is preserved.',
          'SERP themes are not included as keywords because they are content topics, not validated search queries.',
          'SERP domain concentration is calculated with unweighted HHI over organic result domains for the source hypothesis.',
          'Competitor keyword matches and Ranked Keywords are intentionally excluded from this candidate pool.',
          'Product Fit filtering and final scoring happen in the next step.',
        ],
        candidateCount: candidates.length,
        sourceCounts,
        duplicateEvidenceCount,
        candidates: candidates as unknown as SeoBriefJsonValue,
      },
    });
    await this.artifactRepository.save(artifact);
    run.awaitConfirmation();
    await this.runRepository.save(run);

    return {
      runId: run.id,
      artifactType: 'dirty_keyword_pool',
      candidateCount: candidates.length,
      sourceCounts,
      duplicateEvidenceCount,
    };
  }
}

class DirtyKeywordPoolBuilder {
  private readonly candidates = new Map<string, DirtyKeywordCandidate>();

  add(text: string, evidence: DirtyKeywordEvidence): void {
    const normalizedText = normalizeKeywordText(text);
    if (!normalizedText) {
      return;
    }

    const existing = this.candidates.get(normalizedText);
    if (!existing) {
      this.candidates.set(normalizedText, {
        text: normalizeDisplayKeyword(text),
        normalizedText,
        primarySource: evidence.source,
        sources: [evidence.source],
        sourceCount: 1,
        evidence: [evidence],
        metrics: summarizeMetrics([evidence]),
        flags: summarizeFlags([evidence]),
      });
      return;
    }

    existing.evidence.push(evidence);
    existing.sources = [...new Set(existing.evidence.map((item) => item.source))];
    existing.sourceCount = existing.sources.length;
    existing.primarySource = choosePrimarySource(existing.evidence);
    existing.metrics = summarizeMetrics(existing.evidence);
    existing.flags = summarizeFlags(existing.evidence);
  }

  build(): DirtyKeywordCandidate[] {
    return [...this.candidates.values()].sort(compareCandidates);
  }
}

function collectKeywordHypotheses(
  artifacts: SeoBriefArtifact[],
  builder: DirtyKeywordPoolBuilder,
  serpDomainConcentrationByKeyword: Map<string, SerpDomainConcentration>,
): void {
  const payload = readLatestObjectArtifact(artifacts, 'keyword_hypotheses');
  const hypotheses = Array.isArray(payload?.hypotheses) ? payload.hypotheses : [];
  const groupByKeyword = readGroupByKeyword(payload);

  for (const item of hypotheses) {
    const record = asObject(item);
    const keyword = readString(record?.keyword);
    if (!keyword) {
      continue;
    }

    builder.add(keyword, {
      source: 'keyword_hypothesis',
      sourceKeyword: keyword,
      keywordGroup:
        readString(record?.group) ?? groupByKeyword.get(normalizeKeywordText(keyword)) ?? null,
      intent: readString(record?.intentHint) ?? readString(record?.intent_hint),
      metrics: createSerpDomainConcentrationMetrics(
        serpDomainConcentrationByKeyword.get(normalizeKeywordText(keyword)),
      ),
      reason: readString(record?.reason),
    });
  }
}

function collectSerpDerivedCandidates(
  artifacts: SeoBriefArtifact[],
  builder: DirtyKeywordPoolBuilder,
  serpDomainConcentrationByKeyword: Map<string, SerpDomainConcentration>,
): void {
  const payload =
    readLatestObjectArtifact(artifacts, 'keyword_serp_derived_keywords') ??
    readLatestObjectArtifact(artifacts, 'first_keyword_serp_derived_keywords');
  const items = Array.isArray(payload?.items) ? payload.items : payload ? [payload] : [];

  for (const item of items) {
    const record = asObject(item);
    const sourceKeyword = readString(record?.keyword);
    const queries = Array.isArray(record?.similarSearchQueries) ? record.similarSearchQueries : [];

    for (const queryItem of queries) {
      const query = asObject(queryItem);
      const text = readString(query?.query);
      if (!text) {
        continue;
      }

      builder.add(text, {
        source: 'serp_derived_candidate',
        sourceKeyword,
        sourceText: readString(query?.sourceText) ?? text,
        reason: readString(query?.reason),
        serpEvidence: {
          source: readString(query?.source),
          sourceHypothesisSerpDomainConcentration: createSerpDomainConcentrationMetrics(
            sourceKeyword
              ? serpDomainConcentrationByKeyword.get(normalizeKeywordText(sourceKeyword))
              : undefined,
          ),
          sourceText: readString(query?.sourceText),
        } as unknown as SeoBriefJsonValue,
        metrics: createSerpDomainConcentrationMetrics(
          sourceKeyword
            ? serpDomainConcentrationByKeyword.get(normalizeKeywordText(sourceKeyword))
            : undefined,
        ),
      });
    }
  }
}

function collectSelectedRelatedQueries(
  artifacts: SeoBriefArtifact[],
  builder: DirtyKeywordPoolBuilder,
  serpDomainConcentrationByKeyword: Map<string, SerpDomainConcentration>,
): void {
  const payload =
    readLatestObjectArtifact(artifacts, 'keyword_related_query_selections') ??
    readLatestObjectArtifact(artifacts, 'first_keyword_related_query_selection');
  const items = Array.isArray(payload?.items) ? payload.items : payload ? [payload] : [];

  for (const item of items) {
    const record = asObject(item);
    const sourceKeyword = readString(record?.keyword);
    const selected = Array.isArray(record?.selected) ? record.selected : [];

    for (const selectedItem of selected) {
      const query = asObject(selectedItem);
      const text = readString(query?.keyword);
      if (!text) {
        continue;
      }

      builder.add(text, {
        source: 'selected_related_query',
        sourceKeyword,
        sourceText: readString(query?.sourceText) ?? text,
        reason: readString(query?.reason),
        serpEvidence: {
          source: readString(query?.source),
          sourceHypothesisSerpDomainConcentration: createSerpDomainConcentrationMetrics(
            sourceKeyword
              ? serpDomainConcentrationByKeyword.get(normalizeKeywordText(sourceKeyword))
              : undefined,
          ),
          sourceText: readString(query?.sourceText),
        } as unknown as SeoBriefJsonValue,
        metrics: createSerpDomainConcentrationMetrics(
          sourceKeyword
            ? serpDomainConcentrationByKeyword.get(normalizeKeywordText(sourceKeyword))
            : undefined,
        ),
      });
    }
  }
}

function buildSerpDomainConcentrationByKeyword(
  artifacts: SeoBriefArtifact[],
): Map<string, SerpDomainConcentration> {
  const payload =
    readLatestObjectArtifact(artifacts, 'keyword_serp_preview_snapshots') ??
    readLatestObjectArtifact(artifacts, 'first_keyword_serp_preview_snapshot');
  const items = Array.isArray(payload?.items) ? payload.items : payload ? [payload] : [];
  const result = new Map<string, SerpDomainConcentration>();

  for (const item of items) {
    const record = asObject(item);
    const keyword = readString(record?.keyword);
    const snapshot = asObject(record?.snapshot);
    if (!keyword || !snapshot) {
      continue;
    }

    const concentration = calculateSerpDomainConcentration(snapshot);
    if (concentration) {
      result.set(normalizeKeywordText(keyword), concentration);
    }
  }

  return result;
}

function calculateSerpDomainConcentration(
  snapshot: Record<string, unknown>,
): SerpDomainConcentration | null {
  const domains = readObjectArray(snapshot.organicResults)
    .map((item) => readString(item.domain) ?? domainFromUrl(readString(item.url)))
    .filter((domain): domain is string => Boolean(domain))
    .map(normalizeDomain)
    .filter((domain) => domain.length > 0);

  if (domains.length === 0) {
    return null;
  }

  const counts = new Map<string, number>();
  for (const domain of domains) {
    counts.set(domain, (counts.get(domain) ?? 0) + 1);
  }

  const resultCount = domains.length;
  const hhi = roundMetric(
    [...counts.values()].reduce((sum, count) => {
      const share = count / resultCount;
      return sum + share ** 2;
    }, 0),
  );
  const [dominantDomain, dominantCount] = [...counts.entries()].sort(
    (left, right) => right[1] - left[1] || left[0].localeCompare(right[0]),
  )[0] ?? [null, null];
  const dominantDomainShare =
    dominantCount === null || dominantCount === undefined
      ? null
      : roundMetric(dominantCount / resultCount);

  return {
    dominantDomain,
    dominantDomainShare,
    hhi,
    label: labelSerpDomainConcentration(hhi),
    resultCount,
    uniqueDomainCount: counts.size,
  };
}

function createSerpDomainConcentrationMetrics(
  concentration: SerpDomainConcentration | undefined,
): SeoBriefJsonValue | null {
  if (!concentration) {
    return null;
  }

  return {
    sourceHypothesisSerpDomainConcentrationLabel: concentration.label,
    sourceHypothesisSerpDomainHhi: concentration.hhi,
    sourceHypothesisSerpDominantDomain: concentration.dominantDomain,
    sourceHypothesisSerpDominantDomainShare: concentration.dominantDomainShare,
    sourceHypothesisSerpResultCount: concentration.resultCount,
    sourceHypothesisSerpUniqueDomainCount: concentration.uniqueDomainCount,
  } as unknown as SeoBriefJsonValue;
}

function readLatestObjectArtifact(
  artifacts: SeoBriefArtifact[],
  artifactType: string,
): SeoBriefJsonObject | null {
  const artifact = [...artifacts].reverse().find((item) => item.artifactType === artifactType);
  return artifact?.payload &&
    typeof artifact.payload === 'object' &&
    !Array.isArray(artifact.payload)
    ? (artifact.payload as SeoBriefJsonObject)
    : null;
}

function readGroupByKeyword(payload: SeoBriefJsonObject | null): Map<string, string> {
  const result = new Map<string, string>();
  const groups = Array.isArray(payload?.groups) ? payload.groups : [];

  for (const groupItem of groups) {
    const group = asObject(groupItem);
    const label = readString(group?.label) ?? readString(group?.name) ?? readString(group?.group);
    const hypotheses = Array.isArray(group?.hypotheses) ? group.hypotheses : [];
    if (!label) {
      continue;
    }

    for (const hypothesisItem of hypotheses) {
      const hypothesis = asObject(hypothesisItem);
      const keyword = readString(hypothesis?.keyword);
      const key = keyword ? normalizeKeywordText(keyword) : '';
      if (key && !result.has(key)) {
        result.set(key, label);
      }
    }
  }

  return result;
}

function countSources(candidates: DirtyKeywordCandidate[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const candidate of candidates) {
    for (const source of candidate.sources) {
      result[source] = (result[source] ?? 0) + 1;
    }
  }

  return result;
}

function choosePrimarySource(evidence: DirtyKeywordEvidence[]): DirtyKeywordSource {
  const priority: DirtyKeywordSource[] = [
    'selected_related_query',
    'keyword_hypothesis',
    'serp_derived_candidate',
  ];

  return (
    priority.find((source) => evidence.some((item) => item.source === source)) ??
    evidence[0]?.source ??
    'serp_derived_candidate'
  );
}

function summarizeMetrics(evidence: DirtyKeywordEvidence[]): DirtyKeywordCandidate['metrics'] {
  const metricRecords = evidence.map((item) => asObject(item.metrics)).filter(Boolean);
  const competitorRecords = evidence
    .map((item) => asObject(item.competitorEvidence))
    .filter(Boolean);

  return {
    searchVolume: maxNumber(metricRecords.map((item) => readNumber(item?.searchVolume))),
    proxyDemandScore: maxNumber(metricRecords.map((item) => readNumber(item?.proxyDemandScore))),
    competitorMatchScore: maxNumber(
      metricRecords.map((item) => readNumber(item?.competitorMatchScore)),
    ),
    candidateScore: maxNumber(evidence.map((item) => item.candidateScore ?? null)),
    keywordDifficulty: minNumber(metricRecords.map((item) => readNumber(item?.keywordDifficulty))),
    cpc: maxNumber(metricRecords.map((item) => readNumber(item?.cpc))),
    competitionLevel: firstString(metricRecords.map((item) => readString(item?.competitionLevel))),
    intent: firstString([
      ...evidence.map((item) => item.intent ?? null),
      ...metricRecords.map((item) => readString(item?.intent)),
    ]),
    bestRankAbsolute: minNumber(competitorRecords.map((item) => readNumber(item?.rankAbsolute))),
    sourceHypothesisSerpDomainHhi: maxNumber(
      metricRecords.map((item) => readNumber(item?.sourceHypothesisSerpDomainHhi)),
    ),
    sourceHypothesisSerpResultCount: maxNumber(
      metricRecords.map((item) => readNumber(item?.sourceHypothesisSerpResultCount)),
    ),
    sourceHypothesisSerpUniqueDomainCount: maxNumber(
      metricRecords.map((item) => readNumber(item?.sourceHypothesisSerpUniqueDomainCount)),
    ),
    sourceHypothesisSerpDominantDomainShare: maxNumber(
      metricRecords.map((item) => readNumber(item?.sourceHypothesisSerpDominantDomainShare)),
    ),
    sourceHypothesisSerpDominantDomain: firstString(
      metricRecords.map((item) => readString(item?.sourceHypothesisSerpDominantDomain)),
    ),
    sourceHypothesisSerpDomainConcentrationLabel:
      strongestSourceHypothesisSerpDomainConcentrationLabel(metricRecords),
  };
}

function summarizeFlags(evidence: DirtyKeywordEvidence[]): DirtyKeywordCandidate['flags'] {
  const metrics = evidence.map((item) => asObject(item.metrics)).filter(Boolean);

  return {
    isInitialHypothesis: evidence.some((item) => item.source === 'keyword_hypothesis'),
    hasSelectedRelatedQuery: evidence.some((item) => item.source === 'selected_related_query'),
    hasCompetitorKeywordMatch: false,
    hasRankedKeywordEvidence: false,
    hasSearchVolume: metrics.some((item) => readNumber(item?.searchVolume) !== null),
  };
}

function compareCandidates(left: DirtyKeywordCandidate, right: DirtyKeywordCandidate): number {
  if (right.sourceCount !== left.sourceCount) {
    return right.sourceCount - left.sourceCount;
  }

  const leftVolume = left.metrics.searchVolume ?? -1;
  const rightVolume = right.metrics.searchVolume ?? -1;
  if (rightVolume !== leftVolume) {
    return rightVolume - leftVolume;
  }

  return left.text.localeCompare(right.text);
}

function normalizeDisplayKeyword(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .replace(/[?!.\u3002\uff01\uff1f]+$/u, '')
    .trim();
}

function normalizeKeywordText(value: string): string {
  return normalizeDisplayKeyword(value).toLowerCase();
}

function asObject(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readObjectArray(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value)
    ? value.map(asObject).filter((item): item is Record<string, unknown> => item !== null)
    : [];
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function firstString(values: Array<string | null>): string | null {
  return values.find((value): value is string => Boolean(value)) ?? null;
}

function maxNumber(values: Array<number | null>): number | null {
  const numbers = values.filter((value): value is number => value !== null);
  return numbers.length ? Math.max(...numbers) : null;
}

function minNumber(values: Array<number | null>): number | null {
  const numbers = values.filter((value): value is number => value !== null);
  return numbers.length ? Math.min(...numbers) : null;
}

function strongestSourceHypothesisSerpDomainConcentrationLabel(
  metricRecords: Array<Record<string, unknown> | null>,
): string | null {
  const byStrength: Record<string, number> = {
    low: 1,
    medium: 2,
    high: 3,
    very_high: 4,
  };
  const labels = metricRecords
    .map((item) => readString(item?.sourceHypothesisSerpDomainConcentrationLabel))
    .filter((label): label is string => Boolean(label));

  return (
    labels.sort((left, right) => (byStrength[right] ?? 0) - (byStrength[left] ?? 0))[0] ?? null
  );
}

function labelSerpDomainConcentration(hhi: number): SerpDomainConcentration['label'] {
  if (hhi < 0.2) {
    return 'low';
  }
  if (hhi < 0.4) {
    return 'medium';
  }
  if (hhi < 0.7) {
    return 'high';
  }
  return 'very_high';
}

function normalizeDomain(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^www\./, '');
}

function domainFromUrl(value: string | null): string | null {
  if (!value) {
    return null;
  }
  try {
    return new URL(value).hostname;
  } catch {
    return null;
  }
}

function roundMetric(value: number): number {
  return Math.round(value * 1_000) / 1_000;
}
