import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { SeoBriefArtifact } from '../../domain/seo-brief-artifact.entity.js';
import { SeoBriefArtifactRepository } from '../../domain/seo-brief-artifact.repository.js';
import { SeoBriefRunRepository } from '../../domain/seo-brief-run.repository.js';
import { SeoBriefRunStep } from '../../domain/seo-brief-run-step.entity.js';
import { SeoBriefRunStepRepository } from '../../domain/seo-brief-run-step.repository.js';
import type { SeoBriefJsonObject, SeoBriefJsonValue } from '../../domain/seo-briefing.types.js';
import { SeoBriefRunNotFoundError } from '../../errors/seo-brief-run-not-found.error.js';
import {
  type SeoBriefAiModelMode,
  SeoBriefAiPort,
  type SynthesizeOnPagePageInput,
} from '../../ports/seo-brief-ai.port.js';
import { readSeoBriefAiModel } from '../seo-brief-ai-model-selection.js';
import { readPromptInstructionOverridesFromArtifacts } from '../seo-brief-prompt-instruction-overrides.js';
import { readRequestTimeoutMsFromArtifacts } from '../seo-brief-request-timeout.js';
import { SynthesizeOnPageCommand } from './synthesize-onpage.command.js';

type JsonRecord = Record<string, unknown>;

export interface SynthesizeOnPageUseCaseResult {
  artifactType: 'onpage_synthesis_snapshot';
  contentGapCount: number;
  pageCount: number;
  recommendedSectionCount: number;
  runId: string;
}

@CommandHandler(SynthesizeOnPageCommand)
export class SynthesizeOnPageHandler
  implements ICommandHandler<SynthesizeOnPageCommand, SynthesizeOnPageUseCaseResult>
{
  constructor(
    @Inject(SeoBriefRunRepository)
    private readonly runRepository: SeoBriefRunRepository,
    @Inject(SeoBriefRunStepRepository)
    private readonly stepRepository: SeoBriefRunStepRepository,
    @Inject(SeoBriefArtifactRepository)
    private readonly artifactRepository: SeoBriefArtifactRepository,
    @Inject(SeoBriefAiPort)
    private readonly ai: SeoBriefAiPort,
  ) {}

  async execute(command: SynthesizeOnPageCommand): Promise<SynthesizeOnPageUseCaseResult> {
    const run = await this.runRepository.findById(command.runId as never);
    if (!run) {
      throw new SeoBriefRunNotFoundError(command.runId);
    }

    const artifacts = await this.artifactRepository.findByRunId(run.id);
    const clusterSelection = readLatestObjectArtifact(artifacts, 'cluster_selection_snapshot');
    if (!clusterSelection) {
      throw new Error('Select main SEO brief cluster before synthesizing OnPage evidence');
    }

    const onPageResearch = readLatestObjectArtifact(artifacts, 'onpage_research_snapshot');
    if (!onPageResearch) {
      throw new Error('Fetch selected cluster OnPage evidence before synthesizing it');
    }

    const onPagePages = readCompletedOnPagePages(onPageResearch);
    if (onPagePages.length === 0) {
      throw new Error('OnPage research snapshot does not contain completed pages to synthesize');
    }

    const step = SeoBriefRunStep.create({
      runId: run.id,
      stage: 'brief_generation',
      status: 'running',
      attemptNumber: nextAttemptNumber(artifacts, 'onpage_synthesis_snapshot'),
    });
    await this.stepRepository.save(step);

    try {
      const aiResult = await this.ai.synthesizeOnPage({
        runId: run.id,
        stepId: step.id,
        model: readSeoBriefAiModel(artifacts),
        modelMode: readAiModelMode(artifacts),
        timeoutMs: readRequestTimeoutMsFromArtifacts(artifacts),
        promptInstructionOverrides: readPromptInstructionOverridesFromArtifacts(artifacts),
        topicSeed: run.topicSeed,
        market: {
          country: run.country,
          language: run.language,
          locationName: run.country,
        },
        audience: run.audience,
        productName: run.productName,
        productDescription: run.productDescription,
        keyMessage: run.keyMessage,
        seoProductContext: readLatestObjectArtifact(artifacts, 'seo_product_context'),
        brandMemorySnapshot: run.brandMemorySnapshot,
        clusterSelection: compactClusterSelection(clusterSelection),
        serpEnrichmentContext: buildSerpEnrichmentContext(artifacts),
        competitorKeywordEvidence: buildCompetitorKeywordEvidence(artifacts),
        onPagePages,
      });

      const payload: SeoBriefJsonObject = {
        artifactVersion: 'onpage_synthesis_v1',
        sourceArtifactTypes: [
          'cluster_selection_snapshot',
          'onpage_research_snapshot',
          'keyword_serp_derived_keywords',
          'competitor_keyword_matches',
        ],
        pageCount: onPagePages.length,
        pageUrls: onPagePages.map((page) => page.url) as unknown as SeoBriefJsonValue,
        competitorStructureSummary:
          aiResult.competitorStructureSummary as unknown as SeoBriefJsonValue,
        recommendedArticleStructure:
          aiResult.recommendedArticleStructure as unknown as SeoBriefJsonValue,
        productInsertion: aiResult.productInsertion as unknown as SeoBriefJsonValue,
        riskAndComplianceNotes: aiResult.riskAndComplianceNotes as unknown as SeoBriefJsonValue,
      };

      await this.artifactRepository.save(
        SeoBriefArtifact.create({
          runId: run.id,
          stage: 'brief_generation',
          artifactType: 'onpage_synthesis_snapshot',
          payload,
          attempt: step.attemptNumber,
        }),
      );

      step.complete();
      run.awaitConfirmation();
      await this.stepRepository.save(step);
      await this.runRepository.save(run);

      return {
        runId: run.id,
        artifactType: 'onpage_synthesis_snapshot',
        pageCount: onPagePages.length,
        recommendedSectionCount: aiResult.recommendedArticleStructure.h2.length,
        contentGapCount: aiResult.competitorStructureSummary.contentGaps.length,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'OnPage synthesis failed';
      step.fail(message);
      run.fail(message);
      await this.stepRepository.save(step);
      await this.runRepository.save(run);
      throw error;
    }
  }
}

function nextAttemptNumber(artifacts: SeoBriefArtifact[], artifactType: string): number {
  return artifacts.filter((artifact) => artifact.artifactType === artifactType).length + 1;
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

function readCompletedOnPagePages(payload: SeoBriefJsonObject): SynthesizeOnPagePageInput[] {
  return readObjectArray(payload.pages)
    .filter((page) => readString(page.status) === 'completed')
    .map((page) => ({
      domain: readString(page.domain) ?? domainFromUrl(readString(page.url)) ?? '',
      url: readString(page.url) ?? '',
      role: readString(page.role),
      sourceQuery: readString(page.sourceQuery),
      title: readString(page.title),
      metaDescription: readString(page.metaDescription),
      canonical: readString(page.canonical),
      h1: readStringArray(page.h1).slice(0, 4),
      h2: readStringArray(page.h2).slice(0, 14),
      h3: readStringArray(page.h3).slice(0, 10),
      textBlocks: readStringArray(page.textBlocks)
        .map((item) => compactText(item, 500))
        .filter((item): item is string => item !== null)
        .slice(0, 8),
      markdownPreview: compactText(readString(page.markdownPreview), 2_000),
      importantLinks: readObjectArray(page.importantLinks)
        .map(compactImportantLink)
        .filter((item): item is SeoBriefJsonObject => item !== null)
        .slice(0, 8),
    }))
    .filter((page) => page.domain && page.url);
}

function compactClusterSelection(selection: SeoBriefJsonObject): SeoBriefJsonObject {
  const mainCluster = asObject(selection.mainCluster);
  const supportingClusters = readObjectArray(selection.supportingClusters);
  const fallbackMainCluster = mainCluster ?? supportingClusters[0] ?? null;

  return {
    artifactVersion: selection.artifactVersion ?? null,
    mainCluster: compactSelectedCluster(fallbackMainCluster),
    mainClusterFallbackUsed: !mainCluster && !!fallbackMainCluster,
    supportingClusters: supportingClusters
      .map((item) => compactSelectedCluster(item))
      .slice(0, 3) as unknown as SeoBriefJsonValue,
  };
}

function compactSelectedCluster(cluster: JsonRecord | null): SeoBriefJsonObject | null {
  if (!cluster) {
    return null;
  }

  const sourceCluster = asObject(cluster.sourceCluster);
  return {
    clusterName: readString(cluster.clusterName) ?? readString(sourceCluster?.clusterName),
    primaryKeyword:
      readString(cluster.primaryKeyword) ??
      readString(sourceCluster?.primaryKeywordCandidate) ??
      readString(sourceCluster?.primaryKeyword),
    reason: readString(cluster.reason),
    productFitType: readString(cluster.productFitType),
    productFitDecision: readString(cluster.productFitDecision),
    keywords: uniqueStrings([
      ...readStringArray(sourceCluster?.keywords),
      ...readStringArray(sourceCluster?.secondaryKeywords),
      ...readStringArray(sourceCluster?.questions),
      ...readStringArray(sourceCluster?.supportingItems),
    ]).slice(0, 18) as unknown as SeoBriefJsonValue,
    competitorUrls: readObjectArray(sourceCluster?.competitorUrls)
      .map((url) => ({
        domain: readString(url.domain),
        url: readString(url.url),
        title: readString(url.title),
        rankAbsolute: readNumber(url.rankAbsolute) ?? readNumber(url.rank_absolute),
      }))
      .filter((url) => url.domain && url.url)
      .slice(0, 8) as unknown as SeoBriefJsonValue,
  };
}

function buildSerpEnrichmentContext(artifacts: SeoBriefArtifact[]): SeoBriefJsonObject | null {
  const candidates = readLatestObjectArtifact(artifacts, 'keyword_serp_derived_keywords');
  const aggregation = readLatestObjectArtifact(artifacts, 'serp_domain_aggregation');
  if (!candidates && !aggregation) {
    return null;
  }

  return {
    derivedCandidates: compactJson(candidates, { maxDepth: 4, maxArrayItems: 12 }),
    domainAggregation: compactJson(aggregation, { maxDepth: 4, maxArrayItems: 12 }),
  };
}

function buildCompetitorKeywordEvidence(artifacts: SeoBriefArtifact[]): SeoBriefJsonObject | null {
  const matches = readLatestObjectArtifact(artifacts, 'competitor_keyword_matches');
  const keywordMap = readLatestObjectArtifact(artifacts, 'competitor_keyword_map');
  const rankedUniverse = readLatestObjectArtifact(artifacts, 'ranked_keywords_universe');
  if (!matches && !keywordMap && !rankedUniverse) {
    return null;
  }

  return {
    competitorKeywordMatches: compactJson(matches, { maxDepth: 5, maxArrayItems: 18 }),
    competitorKeywordMap: compactJson(keywordMap, { maxDepth: 4, maxArrayItems: 10 }),
    rankedKeywordsUniverse: compactJson(rankedUniverse, { maxDepth: 4, maxArrayItems: 10 }),
  };
}

function compactJson(
  value: unknown,
  options: { maxArrayItems: number; maxDepth: number },
  depth = 0,
): SeoBriefJsonValue {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'string') {
    return compactText(value, 700);
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (Array.isArray(value)) {
    if (depth >= options.maxDepth) {
      return [`[truncated ${value.length} items]`];
    }
    return value
      .slice(0, options.maxArrayItems)
      .map((item) => compactJson(item, options, depth + 1)) as SeoBriefJsonValue;
  }
  if (typeof value === 'object') {
    if (depth >= options.maxDepth) {
      return '[truncated object]';
    }

    const output: SeoBriefJsonObject = {};
    for (const [key, item] of Object.entries(value)) {
      if (['rawResponse', 'rawResponses', 'rawPayload'].includes(key)) {
        continue;
      }
      output[key] = compactJson(item, options, depth + 1);
    }
    return output;
  }

  return null;
}

function compactImportantLink(value: JsonRecord): SeoBriefJsonObject | null {
  const url = readString(value.url);
  const text = readString(value.text) ?? readString(value.anchor) ?? readString(value.title);
  if (!url && !text) {
    return null;
  }

  return {
    url,
    text,
    domain: readString(value.domain) ?? domainFromUrl(url),
  };
}

function readAiModelMode(artifacts: SeoBriefArtifact[]): SeoBriefAiModelMode | null {
  const payload = readLatestObjectArtifact(artifacts, 'normalized_input');
  const mode = readString(payload?.aiModelMode);
  return mode === 'flash' || mode === 'pro' || mode === 'pro_thinking' ? mode : null;
}

function readObjectArray(value: unknown): JsonRecord[] {
  return Array.isArray(value)
    ? value.map(asObject).filter((item): item is JsonRecord => item !== null)
    : [];
}

function asObject(value: unknown): JsonRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function compactText(value: string | null, maxLength: number): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/\s+/gu, ' ').trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized;
}

function domainFromUrl(value: string | null): string | null {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).hostname.replace(/^www\./u, '').toLowerCase();
  } catch {
    return null;
  }
}

function uniqueStrings(items: (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    const normalized = item?.trim();
    const key = normalized?.toLowerCase();
    if (!normalized || !key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(normalized);
  }
  return result;
}
