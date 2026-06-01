import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { SeoBriefArtifact } from '../../domain/seo-brief-artifact.entity.js';
import { SeoBriefArtifactRepository } from '../../domain/seo-brief-artifact.repository.js';
import { SeoBriefRunRepository } from '../../domain/seo-brief-run.repository.js';
import type { SeoBriefJsonValue } from '../../domain/seo-briefing.types.js';
import { SeoBriefRunNotFoundError } from '../../errors/seo-brief-run-not-found.error.js';
import { SeoResearchPort } from '../../ports/seo-research.port.js';
import {
  buildSerpDerivedKeywordsPayload,
  readKeywordsFromHypotheses,
} from '../fetch-first-keyword-serp-preview/fetch-first-keyword-serp-preview.handler.js';
import { FetchKeywordSerpPreviewsCommand } from './fetch-keyword-serp-previews.command.js';

export interface FetchKeywordSerpPreviewsResult {
  derivedKeywordsArtifactId: string;
  keywordCount: number;
  keywords: string[];
  rawArtifactId: string;
  snapshotArtifactId: string;
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
    const keywords = readKeywordsFromHypotheses(keywordHypothesesArtifact?.payload ?? null, run.id);
    const rawItems: SeoBriefJsonValue[] = [];
    const snapshotItems: SeoBriefJsonValue[] = [];
    const derivedItems: SeoBriefJsonValue[] = [];

    for (const [index, keyword] of keywords.entries()) {
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
        index,
        keyword,
        rawResponse: serpPreview.rawResponse as unknown as SeoBriefJsonValue,
      });
      snapshotItems.push({
        index,
        keyword,
        snapshot: serpPreview.snapshot as unknown as SeoBriefJsonValue,
      });
      derivedItems.push({
        index,
        ...(buildSerpDerivedKeywordsPayload({
          keyword,
          snapshot: serpPreview.snapshot as unknown as SeoBriefJsonValue,
        }) as Record<string, SeoBriefJsonValue>),
      });
    }

    const rawArtifact = SeoBriefArtifact.create({
      runId: run.id,
      stage: 'keyword_expansion',
      artifactType: 'keyword_serp_preview_raw_responses',
      payload: {
        items: rawItems,
      },
    });
    const snapshotArtifact = SeoBriefArtifact.create({
      runId: run.id,
      stage: 'keyword_expansion',
      artifactType: 'keyword_serp_preview_snapshots',
      payload: {
        items: snapshotItems,
      },
    });
    const derivedKeywordsArtifact = SeoBriefArtifact.create({
      runId: run.id,
      stage: 'keyword_expansion',
      artifactType: 'keyword_serp_derived_keywords',
      payload: {
        items: derivedItems,
        notes: [
          'One SERP request is executed per generated keyword hypothesis.',
          'Similar search queries are extracted from People Also Ask and related searches per keyword.',
        ],
      },
    });

    await this.artifactRepository.save(rawArtifact);
    await this.artifactRepository.save(snapshotArtifact);
    await this.artifactRepository.save(derivedKeywordsArtifact);

    return {
      derivedKeywordsArtifactId: derivedKeywordsArtifact.id,
      keywordCount: keywords.length,
      keywords,
      rawArtifactId: rawArtifact.id,
      snapshotArtifactId: snapshotArtifact.id,
    };
  }
}
