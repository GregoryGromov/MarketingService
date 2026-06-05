import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { SeoBriefArtifact } from '../../domain/seo-brief-artifact.entity.js';
import { SeoBriefArtifactRepository } from '../../domain/seo-brief-artifact.repository.js';
import { SeoBriefRunRepository } from '../../domain/seo-brief-run.repository.js';
import type { SeoBriefJsonValue } from '../../domain/seo-briefing.types.js';
import { SeoBriefRunNotFoundError } from '../../errors/seo-brief-run-not-found.error.js';
import { AggregateSerpDomainsCommand } from './aggregate-serp-domains.command.js';

type SnapshotItem = {
  index: number;
  keyword: string;
  snapshot: Record<string, unknown>;
};

type RankingUrlEvidence = {
  query: string;
  url: string | null;
  title: string | null;
  rank_absolute: number | null;
  type: 'organic' | 'ai_overview_reference';
};

type DomainAccumulator = {
  domain: string;
  queries: Set<string>;
  ranks: number[];
  rankingUrls: RankingUrlEvidence[];
  serpFeatureContext: Set<string>;
};

export interface AggregateSerpDomainsResult {
  runId: string;
  artifactType: 'serp_domain_aggregation';
  domainCount: number;
  queryCount: number;
  rankingUrlCount: number;
}

@CommandHandler(AggregateSerpDomainsCommand)
export class AggregateSerpDomainsHandler
  implements ICommandHandler<AggregateSerpDomainsCommand, AggregateSerpDomainsResult>
{
  constructor(
    @Inject(SeoBriefRunRepository)
    private readonly runRepository: SeoBriefRunRepository,
    @Inject(SeoBriefArtifactRepository)
    private readonly artifactRepository: SeoBriefArtifactRepository,
  ) {}

  async execute(command: AggregateSerpDomainsCommand): Promise<AggregateSerpDomainsResult> {
    const run = await this.runRepository.findById(command.runId as never);
    if (!run) {
      throw new SeoBriefRunNotFoundError(command.runId);
    }

    const artifacts = await this.artifactRepository.findByRunId(run.id);
    const snapshots = readSnapshotItems(artifacts);
    if (snapshots.length === 0) {
      throw new Error('Fetch SERP snapshots before aggregating SERP domains');
    }

    const aggregation = aggregateDomains(snapshots);
    const artifact = SeoBriefArtifact.create({
      runId: run.id,
      stage: 'serp_research',
      artifactType: 'serp_domain_aggregation',
      payload: aggregation as unknown as SeoBriefJsonValue,
    });
    await this.artifactRepository.save(artifact);

    return {
      runId: run.id,
      artifactType: 'serp_domain_aggregation',
      domainCount: aggregation.domains.length,
      queryCount: aggregation.queryCount,
      rankingUrlCount: aggregation.rankingUrlCount,
    };
  }
}

function aggregateDomains(snapshots: SnapshotItem[]) {
  const domainMap = new Map<string, DomainAccumulator>();
  const queryDomainMap: Array<{
    domains: RankingUrlEvidence[];
    query: string;
  }> = [];
  const formatSignals: Array<{
    query: string;
    sourceDomain: string | null;
    title: string | null;
    type: string;
  }> = [];

  for (const item of snapshots) {
    const query = item.keyword;
    const queryDomains: RankingUrlEvidence[] = [];
    const serpFeatures = readStringArray(item.snapshot.serpFeatures);

    for (const organicResult of readObjectArray(item.snapshot.organicResults)) {
      const rankAbsolute = readNumber(organicResult.rankAbsolute ?? organicResult.rank_absolute);
      if (rankAbsolute !== null && rankAbsolute > 10) {
        continue;
      }

      const url = readString(organicResult.url);
      const domain = normalizeDomain(readString(organicResult.domain) ?? domainFromUrl(url));
      if (!domain || !url) {
        continue;
      }

      const evidence: RankingUrlEvidence = {
        query,
        url,
        title: readString(organicResult.title),
        rank_absolute: rankAbsolute,
        type: 'organic',
      };
      queryDomains.push(evidence);
      addDomainEvidence(domainMap, domain, evidence, ['organic', ...serpFeatures]);
    }

    const aiOverview = readObject(item.snapshot.aiOverview);
    const aiReferences = readObjectArray(aiOverview?.references);
    for (const reference of aiReferences) {
      const url = readString(reference.url);
      const domain = normalizeDomain(readString(reference.domain) ?? domainFromUrl(url));
      if (!domain && !url) {
        continue;
      }

      const evidence: RankingUrlEvidence = {
        query,
        url,
        title: readString(reference.title),
        rank_absolute: null,
        type: 'ai_overview_reference',
      };
      if (domain) {
        queryDomains.push(evidence);
        addDomainEvidence(domainMap, domain, evidence, ['ai_overview_reference', ...serpFeatures]);
      }
    }

    for (const block of readObjectArray(item.snapshot.specialBlocks)) {
      const type = readString(block.type);
      if (!type || (type !== 'video' && type !== 'discussions_and_forums')) {
        continue;
      }

      formatSignals.push({
        query,
        type,
        title: readString(block.title),
        sourceDomain: normalizeDomain(readString(block.sourceDomain)),
      });
    }

    queryDomainMap.push({
      query,
      domains: dedupeRankingUrls(queryDomains),
    });
  }

  const domains = [...domainMap.values()]
    .map((entry) => {
      const ranks = entry.ranks;
      const bestRank = ranks.length ? Math.min(...ranks) : null;
      const avgRank = ranks.length
        ? Number((ranks.reduce((sum, rank) => sum + rank, 0) / ranks.length).toFixed(2))
        : null;

      return {
        domain: entry.domain,
        appearances: entry.queries.size,
        queries: [...entry.queries].sort(),
        best_rank: bestRank,
        avg_rank: avgRank,
        ranking_urls: dedupeRankingUrls(entry.rankingUrls).sort(compareRankingUrls),
        serp_feature_context: [...entry.serpFeatureContext].sort(),
      };
    })
    .sort((left, right) => {
      if (right.appearances !== left.appearances) {
        return right.appearances - left.appearances;
      }

      return (left.best_rank ?? Number.MAX_SAFE_INTEGER) -
        (right.best_rank ?? Number.MAX_SAFE_INTEGER);
    });

  return {
    artifactVersion: 'serp_domain_aggregation_v1',
    sourceArtifactType: 'keyword_serp_preview_snapshots',
    queryCount: snapshots.length,
    domainCount: domains.length,
    rankingUrlCount: domains.reduce((sum, domain) => sum + domain.ranking_urls.length, 0),
    notes: [
      'Organic results with rank_absolute <= 10 and AI Overview references are treated as ranking evidence.',
      'Videos and forum blocks are stored as format signals, not primary Ranked Keywords targets.',
      'This step does not classify domains or apply Product Fit.',
    ],
    queryDomainMap,
    domains,
    formatSignals,
  };
}

function addDomainEvidence(
  domainMap: Map<string, DomainAccumulator>,
  domain: string,
  evidence: RankingUrlEvidence,
  featureContext: string[],
): void {
  const existing = domainMap.get(domain) ?? {
    domain,
    queries: new Set<string>(),
    ranks: [],
    rankingUrls: [],
    serpFeatureContext: new Set<string>(),
  };
  existing.queries.add(evidence.query);
  if (typeof evidence.rank_absolute === 'number') {
    existing.ranks.push(evidence.rank_absolute);
  }
  existing.rankingUrls.push(evidence);
  featureContext.filter(Boolean).forEach((feature) => existing.serpFeatureContext.add(feature));
  domainMap.set(domain, existing);
}

function compareRankingUrls(left: RankingUrlEvidence, right: RankingUrlEvidence): number {
  const leftRank = left.rank_absolute ?? Number.MAX_SAFE_INTEGER;
  const rightRank = right.rank_absolute ?? Number.MAX_SAFE_INTEGER;
  if (leftRank !== rightRank) {
    return leftRank - rightRank;
  }

  return left.query.localeCompare(right.query);
}

function dedupeRankingUrls(items: RankingUrlEvidence[]): RankingUrlEvidence[] {
  const seen = new Set<string>();
  const result: RankingUrlEvidence[] = [];

  for (const item of items) {
    const key = [
      item.query.toLowerCase(),
      item.type,
      item.url ?? '',
      item.title ?? '',
      item.rank_absolute ?? '',
    ].join('|');
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(item);
  }

  return result;
}

function readSnapshotItems(artifacts: SeoBriefArtifact[]): SnapshotItem[] {
  const artifact = [...artifacts]
    .reverse()
    .find((item) => item.artifactType === 'keyword_serp_preview_snapshots');
  const payload = readObject(artifact?.payload);
  const rawItems = readObjectArray(payload?.items);

  return rawItems
    .map((item, index) => {
      const keyword = readString(item.keyword);
      const snapshot = readObject(item.snapshot);
      if (!keyword || !snapshot) {
        return null;
      }

      return {
        index: readNumber(item.index) ?? index,
        keyword,
        snapshot,
      };
    })
    .filter((item): item is SnapshotItem => Boolean(item));
}

function normalizeDomain(value: string | null): string | null {
  const domain = value
    ?.trim()
    .toLowerCase()
    .replace(/^https?:\/\//u, '')
    .replace(/^www\./u, '')
    .split('/')[0]
    ?.trim();

  return domain || null;
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

function readObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readObjectArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value
        .map((item) => readObject(item))
        .filter((item): item is Record<string, unknown> => item !== null)
    : [];
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
    : [];
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
