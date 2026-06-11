import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { SeoBriefArtifact } from '../../domain/seo-brief-artifact.entity.js';
import { SeoBriefArtifactRepository } from '../../domain/seo-brief-artifact.repository.js';
import { SeoBriefRunRepository } from '../../domain/seo-brief-run.repository.js';
import type { SeoBriefJsonObject, SeoBriefJsonValue } from '../../domain/seo-briefing.types.js';
import { SeoBriefRunNotFoundError } from '../../errors/seo-brief-run-not-found.error.js';
import { BuildCompetitorKeywordMapCommand } from './build-competitor-keyword-map.command.js';

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
  ) {}

  async execute(
    command: BuildCompetitorKeywordMapCommand,
  ): Promise<BuildCompetitorKeywordMapResult> {
    const run = await this.runRepository.findById(command.runId as never);
    if (!run) {
      throw new SeoBriefRunNotFoundError(command.runId);
    }

    const brandMemoryKeywordMap = run.brandMemorySnapshot.seoCompetitorKeywordMap;
    if (!brandMemoryKeywordMap || brandMemoryKeywordMap.items.length === 0) {
      throw new Error(
        'No Brand Memory competitor keyword map found. Open Brand Memory, add SEO competitor domains, and click Refresh Competitor Ranked Keywords before running Step 4.',
      );
    }

    const competitorKeywordsJsonId = brandMemoryKeywordMap.competitorKeywordsJsonId;
    const targetResults = brandMemoryKeywordMap.targetResults;
    const items = brandMemoryKeywordMap.items;
    const flatKeywords = brandMemoryKeywordMap.allKeywordsFlat;
    const targets = brandMemoryKeywordMap.targets;
    const sharedPayload = {
      sourceArtifactType: 'brand_memory_snapshot',
      competitorKeywordsJsonId,
      generatedAt: brandMemoryKeywordMap.generatedAt,
      endpoint: '/v3/dataforseo_labs/google/ranked_keywords/live',
      market: brandMemoryKeywordMap.market,
      requestDefaults: {
        limit: 100,
        historicalSerpMode: 'live',
        loadRankAbsolute: false,
        ignoreSynonyms: false,
        includeClickstreamData: false,
      },
      manualCompetitors: (run.brandMemorySnapshot.seoCompetitors ?? {
        mustInclude: [],
        optional: [],
        exclude: [],
      }) as unknown as SeoBriefJsonValue,
      notes: [
        'Ranked Keywords were pre-fetched and stored in Project Brand Memory.',
        'SEO brief Step 4 reads Brand Memory competitor evidence only and does not call DataForSEO.',
        'This is evidence collection only; dirty pool filtering and Product Fit happen later.',
      ],
      targets,
      targetCount: brandMemoryKeywordMap.targetCount,
      itemCount: brandMemoryKeywordMap.itemCount,
      deduplicatedKeywordCount: flatKeywords.length,
      targetResults,
      items: items as unknown as SeoBriefJsonValue,
      allKeywordsFlat: flatKeywords as unknown as SeoBriefJsonValue,
    } satisfies SeoBriefJsonObject;

    const competitorKeywordMapArtifact = SeoBriefArtifact.create({
      runId: run.id,
      stage: 'keyword_research',
      artifactType: 'competitor_keyword_map',
      payload: {
        artifactVersion: 'competitor_keyword_map_v1',
        ...sharedPayload,
      } as SeoBriefJsonObject,
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
      } as SeoBriefJsonObject,
    });
    await this.artifactRepository.save(rankedKeywordsUniverseArtifact);

    run.awaitConfirmation();
    await this.runRepository.save(run);

    return {
      runId: run.id,
      artifactType: 'competitor_keyword_map',
      competitorKeywordsJsonId,
      targetCount: targets.length,
      targets,
      itemCount: items.length,
      skippedCompetitorCount: 0,
      competitorKeywordMapArtifactId: competitorKeywordMapArtifact.id,
      rankedKeywordsUniverseArtifactId: rankedKeywordsUniverseArtifact.id,
    };
  }
}
