import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { SeoBriefArtifact } from '../../domain/seo-brief-artifact.entity.js';
import { SeoBriefArtifactRepository } from '../../domain/seo-brief-artifact.repository.js';
import { SeoBriefRunRepository } from '../../domain/seo-brief-run.repository.js';
import type { SeoBriefJsonObject, SeoBriefJsonValue } from '../../domain/seo-briefing.types.js';
import { SeoBriefRunNotFoundError } from '../../errors/seo-brief-run-not-found.error.js';
import { SeoResearchPort, type SeoRankedKeywordItem } from '../../ports/seo-research.port.js';
import { BuildCompetitorKeywordMapCommand } from './build-competitor-keyword-map.command.js';

interface ManualCompetitorTarget {
  raw: string;
  source: 'must_include' | 'optional';
  target: string;
}

interface SkippedManualCompetitor {
  raw: string;
  reason: string;
  source: 'must_include' | 'optional' | 'exclude';
}

interface FlatCompetitorKeyword {
  competitorEvidence: SeoBriefJsonValue[];
  metrics: {
    bestRankAbsolute: number | null;
    competitionLevel: string | null;
    cpc: number | null;
    intent: string | null;
    keywordDifficulty: number | null;
    searchVolume: number | null;
    searchVolumeSource: 'ranked_keywords';
  };
  normalizedText: string;
  serpFeatures: string[];
  source: 'competitor_keyword_map';
  sourceDomains: string[];
  text: string;
  type: 'keyword';
}

export interface BuildCompetitorKeywordMapResult {
  artifactType: 'competitor_keyword_map';
  competitorKeywordMapArtifactId: string;
  competitorKeywordsJsonId: string;
  itemCount: number;
  rankedKeywordsUniverseArtifactId: string;
  runId: string;
  skippedCompetitorCount: number;
  targetCount: number;
  targets: string[];
}

@CommandHandler(BuildCompetitorKeywordMapCommand)
export class BuildCompetitorKeywordMapHandler
  implements ICommandHandler<BuildCompetitorKeywordMapCommand, BuildCompetitorKeywordMapResult>
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
    command: BuildCompetitorKeywordMapCommand,
  ): Promise<BuildCompetitorKeywordMapResult> {
    const run = await this.runRepository.findById(command.runId as never);
    if (!run) {
      throw new SeoBriefRunNotFoundError(command.runId);
    }

    const artifacts = await this.artifactRepository.findByRunId(run.id);
    const normalizedInput = readLatestObjectArtifact(artifacts, 'normalized_input');
    if (!normalizedInput) {
      throw new Error('Create SEO brief run input before building competitor keyword map');
    }

    const manualCompetitors = readManualCompetitorTargets(normalizedInput);
    if (manualCompetitors.targets.length === 0) {
      throw new Error('Add manual competitor domains before building competitor keyword map');
    }

    const competitorKeywordsJsonId = resolveCompetitorKeywordsJsonId(normalizedInput, run.id);
    const targetResults = [];
    const rawResponses = [];
    const items: SeoRankedKeywordItem[] = [];

    for (const target of manualCompetitors.targets) {
      const result = await this.seoResearch.getRankedKeywords({
        runId: run.id,
        target: target.target,
        market: {
          country: run.country,
          language: run.language,
          locationName: run.country,
        },
        limit: 100,
        historicalSerpMode: 'live',
        loadRankAbsolute: false,
        ignoreSynonyms: false,
        includeClickstreamData: false,
      });

      targetResults.push({
        raw: target.raw,
        source: target.source,
        target: result.target,
        totalCount: result.totalCount,
        itemsCount: result.itemsCount,
        metrics: result.metrics,
        items: result.items as unknown as SeoBriefJsonValue,
      });
      rawResponses.push({
        target: result.target,
        rawResponse: result.rawResponse,
      });
      items.push(...result.items);
    }

    const flatKeywords = buildFlatCompetitorKeywords(items);
    const sharedPayload = {
      sourceArtifactType: 'normalized_input',
      competitorKeywordsJsonId,
      endpoint: '/v3/dataforseo_labs/google/ranked_keywords/live',
      market: {
        country: run.country,
        language: run.language,
        locationName: run.country,
      },
      requestDefaults: {
        limit: 100,
        historicalSerpMode: 'live',
        loadRankAbsolute: false,
        ignoreSynonyms: false,
        includeClickstreamData: false,
      },
      manualCompetitors: {
        mustInclude: manualCompetitors.mustInclude,
        optional: manualCompetitors.optional,
        exclude: manualCompetitors.exclude,
        skipped: manualCompetitors.skipped as unknown as SeoBriefJsonValue,
      },
      notes: [
        'Ranked Keywords are fetched only from manual competitor domains in Step 0 input.',
        'SERP-discovered domains and AI domain classification are not used for this V2 competitor keyword map.',
        'This is evidence collection only; dirty pool filtering and Product Fit happen later.',
      ],
      targets: manualCompetitors.targets.map((target) => target.target),
      targetCount: manualCompetitors.targets.length,
      itemCount: items.length,
      deduplicatedKeywordCount: flatKeywords.length,
      targetResults,
      items: items as unknown as SeoBriefJsonValue,
      allKeywordsFlat: flatKeywords as unknown as SeoBriefJsonValue,
      rawResponses,
    } satisfies SeoBriefJsonObject;

    const competitorKeywordMapArtifact = SeoBriefArtifact.create({
      runId: run.id,
      stage: 'keyword_research',
      artifactType: 'competitor_keyword_map',
      payload: {
        artifactVersion: 'competitor_keyword_map_v1',
        ...sharedPayload,
      },
    });
    await this.artifactRepository.save(competitorKeywordMapArtifact);

    const rankedKeywordsUniverseArtifact = SeoBriefArtifact.create({
      runId: run.id,
      stage: 'keyword_research',
      artifactType: 'ranked_keywords_universe',
      payload: {
        artifactVersion: 'ranked_keywords_universe_v2',
        ...sharedPayload,
        sourceArtifactType: 'competitor_keyword_map',
        sourceArtifactId: competitorKeywordMapArtifact.id,
      },
    });
    await this.artifactRepository.save(rankedKeywordsUniverseArtifact);

    run.awaitConfirmation();
    await this.runRepository.save(run);

    return {
      runId: run.id,
      artifactType: 'competitor_keyword_map',
      competitorKeywordsJsonId,
      targetCount: manualCompetitors.targets.length,
      targets: manualCompetitors.targets.map((target) => target.target),
      itemCount: items.length,
      skippedCompetitorCount: manualCompetitors.skipped.length,
      competitorKeywordMapArtifactId: competitorKeywordMapArtifact.id,
      rankedKeywordsUniverseArtifactId: rankedKeywordsUniverseArtifact.id,
    };
  }
}

function readLatestObjectArtifact(
  artifacts: SeoBriefArtifact[],
  artifactType: string,
): SeoBriefJsonObject | null {
  const artifact = [...artifacts].reverse().find((item) => item.artifactType === artifactType);
  return artifact?.payload && typeof artifact.payload === 'object' && !Array.isArray(artifact.payload)
    ? (artifact.payload as SeoBriefJsonObject)
    : null;
}

function readManualCompetitorTargets(normalizedInput: SeoBriefJsonObject): {
  exclude: string[];
  mustInclude: string[];
  optional: string[];
  skipped: SkippedManualCompetitor[];
  targets: ManualCompetitorTarget[];
} {
  const knownCompetitors = asObject(normalizedInput.knownCompetitors);
  const mustInclude = readStringArray(knownCompetitors?.mustInclude);
  const optional = readStringArray(knownCompetitors?.optional);
  const exclude = readStringArray(knownCompetitors?.exclude);
  const excludedTargets = new Set(
    exclude.map((item) => normalizeCompetitorTarget(item)).filter((item): item is string => Boolean(item)),
  );
  const skipped: SkippedManualCompetitor[] = [];
  const seen = new Set<string>();
  const targets: ManualCompetitorTarget[] = [];

  for (const [source, values] of [
    ['must_include', mustInclude] as const,
    ['optional', optional] as const,
  ]) {
    for (const raw of values) {
      const target = normalizeCompetitorTarget(raw);
      if (!target) {
        skipped.push({
          raw,
          source,
          reason: 'Competitor hint is not a domain-like DataForSEO target.',
        });
        continue;
      }

      if (excludedTargets.has(target)) {
        skipped.push({
          raw,
          source,
          reason: 'Competitor target is explicitly excluded.',
        });
        continue;
      }

      if (seen.has(target)) {
        continue;
      }

      seen.add(target);
      targets.push({ raw, source, target });
    }
  }

  for (const raw of exclude) {
    if (!normalizeCompetitorTarget(raw)) {
      skipped.push({
        raw,
        source: 'exclude',
        reason: 'Exclude hint is not a domain-like DataForSEO target.',
      });
    }
  }

  return { mustInclude, optional, exclude, skipped, targets };
}

function buildFlatCompetitorKeywords(items: SeoRankedKeywordItem[]): FlatCompetitorKeyword[] {
  const byKeyword = new Map<string, FlatCompetitorKeyword>();

  for (const item of items) {
    const normalizedText = normalizeKeywordText(item.text);
    if (!normalizedText) {
      continue;
    }

    const existing = byKeyword.get(normalizedText);
    if (!existing) {
      byKeyword.set(normalizedText, {
        text: normalizeDisplayText(item.text),
        normalizedText,
        type: 'keyword',
        source: 'competitor_keyword_map',
        sourceDomains: [item.sourceDomain],
        metrics: {
          searchVolume: item.metrics.searchVolume,
          searchVolumeSource: 'ranked_keywords',
          keywordDifficulty: item.metrics.keywordDifficulty,
          cpc: item.metrics.cpc,
          competitionLevel: item.metrics.competitionLevel,
          intent: item.metrics.intent,
          bestRankAbsolute: item.competitorEvidence.rankAbsolute,
        },
        serpFeatures: item.serpEvidence.serpFeatures,
        competitorEvidence: [item.competitorEvidence as unknown as SeoBriefJsonValue],
      });
      continue;
    }

    existing.sourceDomains = [...new Set([...existing.sourceDomains, item.sourceDomain])];
    existing.metrics.searchVolume = maxNullable(existing.metrics.searchVolume, item.metrics.searchVolume);
    existing.metrics.keywordDifficulty = minNullable(
      existing.metrics.keywordDifficulty,
      item.metrics.keywordDifficulty,
    );
    existing.metrics.cpc = maxNullable(existing.metrics.cpc, item.metrics.cpc);
    existing.metrics.bestRankAbsolute = minNullable(
      existing.metrics.bestRankAbsolute,
      item.competitorEvidence.rankAbsolute,
    );
    existing.metrics.competitionLevel =
      existing.metrics.competitionLevel ?? item.metrics.competitionLevel;
    existing.metrics.intent = existing.metrics.intent ?? item.metrics.intent;
    existing.serpFeatures = [
      ...new Set([...existing.serpFeatures, ...item.serpEvidence.serpFeatures]),
    ];
    existing.competitorEvidence.push(item.competitorEvidence as unknown as SeoBriefJsonValue);
  }

  return [...byKeyword.values()].sort((left, right) => {
    const rightVolume = right.metrics.searchVolume ?? -1;
    const leftVolume = left.metrics.searchVolume ?? -1;
    if (rightVolume !== leftVolume) {
      return rightVolume - leftVolume;
    }

    return (left.metrics.bestRankAbsolute ?? 999) - (right.metrics.bestRankAbsolute ?? 999);
  });
}

function resolveCompetitorKeywordsJsonId(
  normalizedInput: SeoBriefJsonObject,
  runId: string,
): string {
  const explicitId = readString(normalizedInput.competitorKeywordsJsonId);
  if (explicitId) {
    return normalizeCompetitorKeywordsJsonId(explicitId);
  }

  return `competitor_keywords_${runId.replace(/^seo_brief_run_/u, '')}`;
}

function normalizeCompetitorKeywordsJsonId(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/gu, '_')
      .replace(/^_+|_+$/gu, '')
      .slice(0, 120) || 'competitor_keywords'
  );
}

function normalizeCompetitorTarget(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }

  const host = trimmed
    .replace(/^https?:\/\//u, '')
    .replace(/^www\./u, '')
    .split(/[/?#]/u)[0]
    ?.replace(/:\d+$/u, '');
  if (!host || !host.includes('.') || host.includes(' ')) {
    return null;
  }

  return host;
}

function normalizeKeywordText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[?!.,;:]+$/u, '')
    .replace(/\s+/gu, ' ');
}

function normalizeDisplayText(value: string): string {
  return value.trim().replace(/[?!.,;:]+$/u, '').replace(/\s+/gu, ' ');
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => readString(item)).filter((item): item is string => Boolean(item))
    : [];
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function asObject(value: unknown): SeoBriefJsonObject | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as SeoBriefJsonObject)
    : null;
}

function maxNullable(left: number | null, right: number | null): number | null {
  if (left == null) {
    return right;
  }

  if (right == null) {
    return left;
  }

  return Math.max(left, right);
}

function minNullable(left: number | null, right: number | null): number | null {
  if (left == null) {
    return right;
  }

  if (right == null) {
    return left;
  }

  return Math.min(left, right);
}
