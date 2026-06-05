import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { SeoBriefArtifact } from '../../domain/seo-brief-artifact.entity.js';
import { SeoBriefArtifactRepository } from '../../domain/seo-brief-artifact.repository.js';
import { SeoBriefRunRepository } from '../../domain/seo-brief-run.repository.js';
import type { SeoBriefJsonObject, SeoBriefJsonValue } from '../../domain/seo-briefing.types.js';
import { SeoBriefRunNotFoundError } from '../../errors/seo-brief-run-not-found.error.js';
import { SeoResearchPort, type SeoRankedKeywordItem } from '../../ports/seo-research.port.js';
import { FetchRankedKeywordsCommand } from './fetch-ranked-keywords.command.js';

export interface FetchRankedKeywordsResult {
  artifactType: 'ranked_keywords_universe';
  itemCount: number;
  runId: string;
  targetCount: number;
  targets: string[];
}

@CommandHandler(FetchRankedKeywordsCommand)
export class FetchRankedKeywordsHandler
  implements ICommandHandler<FetchRankedKeywordsCommand, FetchRankedKeywordsResult>
{
  constructor(
    @Inject(SeoBriefRunRepository)
    private readonly runRepository: SeoBriefRunRepository,
    @Inject(SeoBriefArtifactRepository)
    private readonly artifactRepository: SeoBriefArtifactRepository,
    @Inject(SeoResearchPort)
    private readonly seoResearch: SeoResearchPort,
  ) {}

  async execute(command: FetchRankedKeywordsCommand): Promise<FetchRankedKeywordsResult> {
    const run = await this.runRepository.findById(command.runId as never);
    if (!run) {
      throw new SeoBriefRunNotFoundError(command.runId);
    }

    const artifacts = await this.artifactRepository.findByRunId(run.id);
    const classification = readLatestObjectArtifact(artifacts, 'serp_domain_classification');
    if (!classification) {
      throw new Error('Classify SERP domains before fetching ranked keywords');
    }

    const targets = readRankedKeywordsTargets(classification).slice(0, 6);
    if (targets.length === 0) {
      throw new Error('No Ranked Keywords target domains found in SERP domain classification');
    }

    const targetResults = [];
    const rawResponses = [];
    const items: SeoRankedKeywordItem[] = [];

    for (const target of targets) {
      const result = await this.seoResearch.getRankedKeywords({
        runId: run.id,
        target,
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

    const artifact = SeoBriefArtifact.create({
      runId: run.id,
      stage: 'keyword_research',
      artifactType: 'ranked_keywords_universe',
      payload: {
        artifactVersion: 'ranked_keywords_universe_v1',
        sourceArtifactType: 'serp_domain_classification',
        endpoint: '/v3/dataforseo_labs/google/ranked_keywords/live',
        requestDefaults: {
          limit: 100,
          historicalSerpMode: 'live',
          loadRankAbsolute: false,
          ignoreSynonyms: false,
          includeClickstreamData: false,
        },
        notes: [
          'Ranked Keywords were fetched only for domains classified as rankedKeywordsTargets.',
          'Ignored, pain-signal, and on-page-only domains are not queried here.',
          'This step collects competitor keyword evidence only; Product Fit filtering happens later.',
        ],
        targets,
        targetCount: targets.length,
        itemCount: items.length,
        targetResults,
        items: items as unknown as SeoBriefJsonValue,
        rawResponses,
      },
    });
    await this.artifactRepository.save(artifact);
    run.awaitConfirmation();
    await this.runRepository.save(run);

    return {
      runId: run.id,
      artifactType: 'ranked_keywords_universe',
      targetCount: targets.length,
      targets,
      itemCount: items.length,
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

function readRankedKeywordsTargets(classification: SeoBriefJsonObject): string[] {
  const targets = Array.isArray(classification.rankedKeywordsTargets)
    ? classification.rankedKeywordsTargets
    : [];
  const seen = new Set<string>();
  const result: string[] = [];

  for (const target of targets) {
    const domain = readDomain(target);
    if (!domain || seen.has(domain)) {
      continue;
    }
    seen.add(domain);
    result.push(domain);
  }

  return result;
}

function readDomain(value: unknown): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const domain = (value as { domain?: unknown }).domain;
  if (typeof domain !== 'string') {
    return null;
  }

  const normalized = domain.trim().toLowerCase().replace(/^www\./u, '');
  return normalized || null;
}
