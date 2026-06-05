import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { SeoBriefArtifact } from '../../domain/seo-brief-artifact.entity.js';
import { SeoBriefArtifactRepository } from '../../domain/seo-brief-artifact.repository.js';
import { SeoBriefRunRepository } from '../../domain/seo-brief-run.repository.js';
import type { SeoBriefJsonValue } from '../../domain/seo-briefing.types.js';
import { SeoBriefRunNotFoundError } from '../../errors/seo-brief-run-not-found.error.js';
import { buildSerpDerivedKeywordsPayload } from '../fetch-first-keyword-serp-preview/fetch-first-keyword-serp-preview.handler.js';
import { ExtractSerpDerivedCandidatesCommand } from './extract-serp-derived-candidates.command.js';

export interface ExtractSerpDerivedCandidatesResult {
  runId: string;
  artifactType: 'keyword_serp_derived_keywords';
  keywordCount: number;
  candidateQueryCount: number;
  themeCount: number;
}

@CommandHandler(ExtractSerpDerivedCandidatesCommand)
export class ExtractSerpDerivedCandidatesHandler
  implements ICommandHandler<ExtractSerpDerivedCandidatesCommand, ExtractSerpDerivedCandidatesResult>
{
  constructor(
    @Inject(SeoBriefRunRepository)
    private readonly runRepository: SeoBriefRunRepository,
    @Inject(SeoBriefArtifactRepository)
    private readonly artifactRepository: SeoBriefArtifactRepository,
  ) {}

  async execute(command: ExtractSerpDerivedCandidatesCommand): Promise<ExtractSerpDerivedCandidatesResult> {
    const run = await this.runRepository.findById(command.runId as never);
    if (!run) {
      throw new SeoBriefRunNotFoundError(command.runId);
    }

    const artifacts = await this.artifactRepository.findByRunId(run.id);
    const snapshots = readSnapshotItems(artifacts);
    if (snapshots.length === 0) {
      throw new Error('Fetch SERP snapshots before extracting SERP-derived candidates');
    }

    const items: Array<{
      index: number;
      keyword?: SeoBriefJsonValue;
      notes?: SeoBriefJsonValue;
      serpThemes?: SeoBriefJsonValue;
      similarSearchQueries?: SeoBriefJsonValue;
    }> = snapshots.map((item, index) => ({
      index: typeof item.index === 'number' ? item.index : index,
      ...(buildSerpDerivedKeywordsPayload({
        keyword: item.keyword,
        snapshot: item.snapshot as SeoBriefJsonValue,
      }) as Record<string, SeoBriefJsonValue>),
    }));
    const artifact = SeoBriefArtifact.create({
      runId: run.id,
      stage: 'keyword_expansion',
      artifactType: 'keyword_serp_derived_keywords',
      payload: {
        items: items as unknown as SeoBriefJsonValue,
        notes: [
          'Extracted from saved normalized SERP snapshots only.',
          'Similar search queries come from People Also Ask and related searches.',
          'Organic results and AI Overview are stored as content themes, not validated keywords.',
        ],
      },
    });
    await this.artifactRepository.save(artifact);

    return {
      runId: run.id,
      artifactType: 'keyword_serp_derived_keywords',
      keywordCount: items.length,
      candidateQueryCount: items.reduce(
        (sum, item) =>
          sum +
          (Array.isArray(item.similarSearchQueries) ? item.similarSearchQueries.length : 0),
        0,
      ),
      themeCount: items.reduce(
        (sum, item) => sum + (Array.isArray(item.serpThemes) ? item.serpThemes.length : 0),
        0,
      ),
    };
  }
}

function readSnapshotItems(
  artifacts: SeoBriefArtifact[],
): Array<{ index: number; keyword: string; snapshot: SeoBriefJsonValue }> {
  const artifact = [...artifacts]
    .reverse()
    .find((item) => item.artifactType === 'keyword_serp_preview_snapshots');
  if (!artifact?.payload || typeof artifact.payload !== 'object' || Array.isArray(artifact.payload)) {
    return [];
  }

  const rawItems = (artifact.payload as Record<string, unknown>).items;
  if (!Array.isArray(rawItems)) {
    return [];
  }

  return rawItems
    .map((item, index) => {
      const record = item && typeof item === 'object' && !Array.isArray(item)
        ? (item as Record<string, unknown>)
        : null;
      const keyword = typeof record?.keyword === 'string' ? record.keyword.trim() : '';
      if (!record || !keyword) {
        return null;
      }

      return {
        index: typeof record.index === 'number' ? record.index : index,
        keyword,
        snapshot: record.snapshot as SeoBriefJsonValue,
      };
    })
    .filter((item): item is { index: number; keyword: string; snapshot: SeoBriefJsonValue } =>
      Boolean(item),
    );
}
