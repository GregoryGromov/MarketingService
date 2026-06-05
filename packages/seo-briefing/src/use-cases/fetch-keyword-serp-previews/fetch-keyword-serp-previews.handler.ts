import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { SeoBriefArtifact } from '../../domain/seo-brief-artifact.entity.js';
import { SeoBriefArtifactRepository } from '../../domain/seo-brief-artifact.repository.js';
import { SeoBriefRunRepository } from '../../domain/seo-brief-run.repository.js';
import type { SeoBriefJsonValue } from '../../domain/seo-briefing.types.js';
import { SeoBriefKeywordHypothesesNotFoundError } from '../../errors/seo-brief-keyword-hypotheses-not-found.error.js';
import { SeoBriefRunNotFoundError } from '../../errors/seo-brief-run-not-found.error.js';
import { SeoResearchPort } from '../../ports/seo-research.port.js';
import { FetchKeywordSerpPreviewsCommand } from './fetch-keyword-serp-previews.command.js';

export interface FetchKeywordSerpPreviewsResult {
  keywordCount: number;
  keywords: string[];
  rawArtifactId: string;
  selectedHypotheses: SerpSelectedHypothesis[];
  snapshotArtifactId: string;
}

interface SerpHypothesisCandidate {
  index: number;
  keyword: string;
  hypothesisType: string | null;
  productFitHypothesis: string | null;
  riskFlags: string[];
}

interface SerpSelectedHypothesis extends SerpHypothesisCandidate {
  selectionReason: string;
  selectionScore: number;
}

@CommandHandler(FetchKeywordSerpPreviewsCommand)
export class FetchKeywordSerpPreviewsHandler
  implements ICommandHandler<FetchKeywordSerpPreviewsCommand, FetchKeywordSerpPreviewsResult>
{
  constructor(
    @Inject(SeoBriefRunRepository)
    private readonly runRepository: SeoBriefRunRepository,
    @Inject(SeoBriefArtifactRepository)
    private readonly artifactRepository: SeoBriefArtifactRepository,
    @Inject(SeoResearchPort)
    private readonly seoResearch: SeoResearchPort,
  ) {}

  async execute(command: FetchKeywordSerpPreviewsCommand): Promise<FetchKeywordSerpPreviewsResult> {
    const run = await this.runRepository.findById(command.runId as never);
    if (!run) {
      throw new SeoBriefRunNotFoundError(command.runId);
    }

    const artifacts = await this.artifactRepository.findByRunId(run.id);
    const keywordHypothesesArtifact = [...artifacts]
      .reverse()
      .find((artifact) => artifact.artifactType === 'keyword_hypotheses');
    const hypotheses = readHypothesesForSerpSelection(keywordHypothesesArtifact?.payload ?? null, run.id);
    const requestedCount = readSerpEnrichmentCount(artifacts, hypotheses.length);
    const selectedHypotheses = selectHypothesesForSerp(hypotheses, requestedCount);
    const keywords = selectedHypotheses.map((item) => item.keyword);
    const rawItems: SeoBriefJsonValue[] = [];
    const snapshotItems: SeoBriefJsonValue[] = [];

    for (const selectedHypothesis of selectedHypotheses) {
      const keyword = selectedHypothesis.keyword;
      const serpPreview = await this.seoResearch.getOrganicSerpSnapshot({
        runId: run.id,
        keyword,
        market: {
          country: run.country,
          language: run.language,
          locationName: run.country,
        },
      });

      rawItems.push({
        index: selectedHypothesis.index,
        keyword,
        hypothesisType: selectedHypothesis.hypothesisType,
        productFitHypothesis: selectedHypothesis.productFitHypothesis,
        selectionReason: selectedHypothesis.selectionReason,
        rawResponse: serpPreview.rawResponse as unknown as SeoBriefJsonValue,
      });
      snapshotItems.push({
        index: selectedHypothesis.index,
        keyword,
        hypothesisType: selectedHypothesis.hypothesisType,
        productFitHypothesis: selectedHypothesis.productFitHypothesis,
        selectionReason: selectedHypothesis.selectionReason,
        snapshot: serpPreview.snapshot as unknown as SeoBriefJsonValue,
      });
    }

    const rawArtifact = SeoBriefArtifact.create({
      runId: run.id,
      stage: 'keyword_expansion',
      artifactType: 'keyword_serp_preview_raw_responses',
      payload: {
        artifactVersion: 'keyword_serp_preview_raw_responses_v2',
        requestedCount,
        selectedHypotheses: selectedHypotheses as unknown as SeoBriefJsonValue,
        items: rawItems,
      },
    });
    const snapshotArtifact = SeoBriefArtifact.create({
      runId: run.id,
      stage: 'keyword_expansion',
      artifactType: 'keyword_serp_preview_snapshots',
      payload: {
        artifactVersion: 'keyword_serp_preview_snapshots_v2',
        requestedCount,
        selectedHypotheses: selectedHypotheses as unknown as SeoBriefJsonValue,
        items: snapshotItems,
      },
    });
    await this.artifactRepository.save(rawArtifact);
    await this.artifactRepository.save(snapshotArtifact);

    return {
      keywordCount: keywords.length,
      keywords,
      rawArtifactId: rawArtifact.id,
      selectedHypotheses,
      snapshotArtifactId: snapshotArtifact.id,
    };
  }
}

function readHypothesesForSerpSelection(
  payload: SeoBriefJsonValue,
  runId: string,
): SerpHypothesisCandidate[] {
  if (!payload || Array.isArray(payload) || typeof payload !== 'object') {
    throw new SeoBriefKeywordHypothesesNotFoundError(runId);
  }

  const hypotheses = Array.isArray(payload.hypotheses) ? payload.hypotheses : [];
  const result = hypotheses
    .map((item, index): SerpHypothesisCandidate | null => {
      const record =
        item && typeof item === 'object' && !Array.isArray(item)
          ? (item as Record<string, SeoBriefJsonValue>)
          : null;
      const keyword = typeof record?.keyword === 'string' ? record.keyword.trim() : '';
      if (!keyword) {
        return null;
      }

      return {
        index,
        keyword,
        hypothesisType: typeof record?.hypothesisType === 'string' ? record.hypothesisType : null,
        productFitHypothesis:
          typeof record?.productFitHypothesis === 'string' ? record.productFitHypothesis : null,
        riskFlags: Array.isArray(record?.riskFlags)
          ? record.riskFlags.filter((flag): flag is string => typeof flag === 'string')
          : [],
      };
    })
    .filter((item): item is SerpHypothesisCandidate => item !== null);

  if (result.length === 0) {
    throw new SeoBriefKeywordHypothesesNotFoundError(runId);
  }

  return result;
}

function readSerpEnrichmentCount(artifacts: SeoBriefArtifact[], hypothesisCount: number): number {
  const normalizedInput = [...artifacts]
    .reverse()
    .find((artifact) => artifact.artifactType === 'normalized_input');
  const payload =
    normalizedInput?.payload &&
    typeof normalizedInput.payload === 'object' &&
    !Array.isArray(normalizedInput.payload)
      ? (normalizedInput.payload as Record<string, SeoBriefJsonValue>)
      : null;
  const value = payload?.serpEnrichmentCount;
  const requested = typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : 10;
  return Math.min(requested, hypothesisCount);
}

function selectHypothesesForSerp(
  hypotheses: SerpHypothesisCandidate[],
  requestedCount: number,
): SerpSelectedHypothesis[] {
  if (hypotheses.length <= requestedCount) {
    return hypotheses.map((item) => ({
      ...item,
      selectionScore: scoreHypothesisForSerp(item),
      selectionReason: 'Selected because total hypotheses count is within SERP enrichment limit.',
    }));
  }

  const selected = new Map<string, SerpSelectedHypothesis>();
  const sorted = [...hypotheses].sort(compareHypothesesForSerp);
  const primaryTypes = ['pain', 'action', 'ecosystem'];
  const secondaryTypes = ['comparison', 'education', 'risk'];

  const selectOneByType = (type: string): void => {
    if (selected.size >= requestedCount) {
      return;
    }
    const candidate = sorted.find(
      (item) => item.hypothesisType === type && !selected.has(item.keyword.toLowerCase()),
    );
    if (!candidate) {
      return;
    }
    selected.set(candidate.keyword.toLowerCase(), {
      ...candidate,
      selectionScore: scoreHypothesisForSerp(candidate),
      selectionReason: `Selected to preserve ${type} hypothesis coverage.`,
    });
  };

  for (const type of primaryTypes) {
    selectOneByType(type);
  }
  for (const type of secondaryTypes) {
    selectOneByType(type);
  }

  for (const candidate of sorted) {
    if (selected.size >= requestedCount) {
      break;
    }
    const key = candidate.keyword.toLowerCase();
    if (selected.has(key)) {
      continue;
    }
    selected.set(key, {
      ...candidate,
      selectionScore: scoreHypothesisForSerp(candidate),
      selectionReason: candidate.riskFlags.length
        ? 'Selected as fallback despite risk flags because SERP enrichment slots remained.'
        : 'Selected by product fit, low noise, and original hypothesis quality.',
    });
  }

  return [...selected.values()].sort((left, right) => left.index - right.index);
}

function compareHypothesesForSerp(
  left: SerpHypothesisCandidate,
  right: SerpHypothesisCandidate,
): number {
  return scoreHypothesisForSerp(right) - scoreHypothesisForSerp(left) || left.index - right.index;
}

function scoreHypothesisForSerp(item: SerpHypothesisCandidate): number {
  return (
    productFitScore(item.productFitHypothesis) +
    typeDiversityScore(item.hypothesisType) -
    riskPenalty(item.riskFlags)
  );
}

function productFitScore(value: string | null): number {
  if (value === 'direct_solution') {
    return 50;
  }
  if (value === 'alternative_solution' || value === 'workflow_bridge') {
    return 42;
  }
  if (value === 'education_bridge') {
    return 34;
  }
  if (value === 'weak') {
    return 10;
  }
  return 20;
}

function typeDiversityScore(value: string | null): number {
  if (value === 'pain' || value === 'action' || value === 'ecosystem') {
    return 20;
  }
  if (value === 'comparison') {
    return 16;
  }
  if (value === 'education' || value === 'risk') {
    return 12;
  }
  return 0;
}

function riskPenalty(flags: string[]): number {
  return flags.length > 0 ? 40 : 0;
}
