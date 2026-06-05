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
  SeoResearchPort,
  type SeoOnPageContentParsingResult,
  type SeoOnPageInstantPagesResult,
} from '../../ports/seo-research.port.js';
import { FetchSelectedClusterOnPageCommand } from './fetch-selected-cluster-onpage.command.js';

type JsonRecord = Record<string, unknown>;

type OnPageTargetRole =
  | 'closest_intent_match'
  | 'strong_competitor'
  | 'local_or_forum_context'
  | 'supporting_cluster';

interface OnPageTargetCandidate {
  domain: string;
  isForum: boolean;
  isLocal: boolean;
  rankAbsolute: number | null;
  role: OnPageTargetRole;
  score: number;
  selectionReason: string;
  sourceClusterName: string | null;
  sourceQuery: string | null;
  sourceType: 'cluster_competitor_url' | 'keyword_serp_snapshot' | 'serp_domain_aggregation';
  title: string | null;
  url: string;
}

interface OnPageTargetPage {
  contentParsing: SeoOnPageContentParsingResult | null;
  errorMessage: string | null;
  instantPage: SeoOnPageInstantPagesResult | null;
  target: OnPageTargetCandidate;
}

export interface FetchSelectedClusterOnPageResult {
  artifactType: 'onpage_research_snapshot';
  failedPageCount: number;
  runId: string;
  successfulPageCount: number;
  targetCount: number;
}

@CommandHandler(FetchSelectedClusterOnPageCommand)
export class FetchSelectedClusterOnPageHandler
  implements ICommandHandler<FetchSelectedClusterOnPageCommand, FetchSelectedClusterOnPageResult>
{
  constructor(
    @Inject(SeoBriefRunRepository)
    private readonly runRepository: SeoBriefRunRepository,
    @Inject(SeoBriefRunStepRepository)
    private readonly stepRepository: SeoBriefRunStepRepository,
    @Inject(SeoBriefArtifactRepository)
    private readonly artifactRepository: SeoBriefArtifactRepository,
    @Inject(SeoResearchPort)
    private readonly seoResearch: SeoResearchPort,
  ) {}

  async execute(
    command: FetchSelectedClusterOnPageCommand,
  ): Promise<FetchSelectedClusterOnPageResult> {
    const run = await this.runRepository.findById(command.runId as never);
    if (!run) {
      throw new SeoBriefRunNotFoundError(command.runId);
    }

    const artifacts = await this.artifactRepository.findByRunId(run.id);
    const selection = readLatestObjectArtifact(artifacts, 'cluster_selection_snapshot');
    if (!selection) {
      throw new Error('Select main SEO brief cluster before fetching on-page evidence');
    }

    const targets = selectOnPageTargets(
      selection,
      readLatestObjectArtifact(artifacts, 'serp_domain_aggregation'),
      readLatestObjectArtifact(artifacts, 'keyword_serp_preview_snapshots') ??
        readLatestObjectArtifact(artifacts, 'first_keyword_serp_preview_snapshot'),
    );
    if (targets.length === 0) {
      throw new Error('Cluster selection does not contain usable on-page URLs');
    }

    const step = SeoBriefRunStep.create({
      runId: run.id,
      stage: 'onpage_research',
      status: 'running',
      attemptNumber: nextAttemptNumber(artifacts, 'onpage_research_snapshot'),
    });
    await this.stepRepository.save(step);

    try {
      const pages: OnPageTargetPage[] = [];
      for (const target of targets) {
        try {
          const [contentParsing, instantPage] = await Promise.all([
            this.seoResearch.getOnPageContentParsing({
              runId: run.id,
              stepId: step.id,
              url: target.url,
              markdownView: true,
            }),
            this.seoResearch.getOnPageInstantPages({
              runId: run.id,
              stepId: step.id,
              url: target.url,
            }),
          ]);

          pages.push({
            target,
            contentParsing,
            instantPage,
            errorMessage: null,
          });
        } catch (error) {
          pages.push({
            target,
            contentParsing: null,
            instantPage: null,
            errorMessage: error instanceof Error ? error.message : 'On-page fetch failed',
          });
        }
      }

      const successfulPages = pages.filter((page) => !page.errorMessage);
      if (successfulPages.length === 0) {
        throw new Error('On-page evidence fetch failed for all selected URLs');
      }

      const payload: SeoBriefJsonObject = {
        artifactVersion: 'selected_cluster_onpage_v1',
        sourceArtifactTypes: ['cluster_selection_snapshot', 'serp_domain_aggregation'],
        targetCount: targets.length,
        successfulPageCount: successfulPages.length,
        failedPageCount: pages.length - successfulPages.length,
        selectionRules: {
          targetRange: '3-5 URLs when enough usable SERP URLs exist',
          closestIntentMatches: '1-2 URLs from the selected main cluster',
          fallbackWhenNoMainCluster:
            'If no approved main cluster exists, use the first supporting cluster as the OnPage target.',
          strongCompetitor: 'best remaining non-video competitor URL',
          localOrForumContext: 'local or forum/discussion URL only when useful and parseable',
          serpSnapshotFallback:
            'If selected clusters have no usable URLs, use saved organic URLs from SERP snapshots.',
          excluded: [
            'youtube.com',
            'youtu.be',
            'tiktok.com',
            'instagram.com',
            'facebook.com',
            'x.com',
            'twitter.com',
            'login/signup/download/homepage URLs',
          ],
        },
        notes: [
          'This step does not rerun SERP; it uses URLs already saved from SERP evidence.',
          'YouTube and social/video URLs are excluded from on-page evidence.',
          'A supporting cluster fallback is technical only; it does not mean Product Fit approved it as a main cluster.',
          'Raw DataForSEO responses are preserved per page; UI shows compact normalized fields.',
        ],
        targets: targets.map(toTargetJson) as unknown as SeoBriefJsonValue,
        pages: pages.map(toPageJson) as unknown as SeoBriefJsonValue,
      };

      await this.artifactRepository.save(
        SeoBriefArtifact.create({
          runId: run.id,
          stage: 'onpage_research',
          artifactType: 'onpage_research_snapshot',
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
        artifactType: 'onpage_research_snapshot',
        targetCount: targets.length,
        successfulPageCount: successfulPages.length,
        failedPageCount: pages.length - successfulPages.length,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Selected cluster on-page fetch failed';
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
  return artifact?.payload && typeof artifact.payload === 'object' && !Array.isArray(artifact.payload)
    ? (artifact.payload as SeoBriefJsonObject)
    : null;
}

function selectOnPageTargets(
  selection: SeoBriefJsonObject,
  aggregation: SeoBriefJsonObject | null,
  serpSnapshots: SeoBriefJsonObject | null,
): OnPageTargetCandidate[] {
  const main = asObject(selection.mainCluster);
  const supporting = readObjectArray(selection.supportingClusters);
  const targetSelectionItem = main ?? supporting[0] ?? null;
  if (!targetSelectionItem) {
    return [];
  }

  const supportingItems = main ? supporting : supporting.slice(1);
  const targetSourceCluster = asObject(targetSelectionItem.sourceCluster);
  const mainQueries = new Set(
    readClusterQueries(targetSelectionItem, targetSourceCluster).map(normalizeText),
  );
  const candidates: OnPageTargetCandidate[] = [];

  for (const candidate of readClusterUrlCandidates(
    targetSelectionItem,
    targetSourceCluster,
    'closest_intent_match',
  )) {
    candidates.push(candidate);
  }

  for (const item of supportingItems) {
    const sourceCluster = asObject(item.sourceCluster);
    for (const candidate of readClusterUrlCandidates(item, sourceCluster, 'supporting_cluster')) {
      candidates.push(candidate);
    }
  }

  candidates.push(...readAggregationCandidates(aggregation, mainQueries));
  candidates.push(...readSerpSnapshotCandidates(serpSnapshots, mainQueries));
  const usableCandidates = dedupeCandidates(candidates).filter(isUsableOnPageTarget).map(scoreCandidate);
  const selected: OnPageTargetCandidate[] = [];

  addTopCandidates(selected, usableCandidates, (item) => item.role === 'closest_intent_match', 2);
  addTopCandidates(selected, usableCandidates, (item) => item.role === 'strong_competitor', 1);
  addTopCandidates(selected, usableCandidates, (item) => item.isLocal || item.isForum, 1);
  addTopCandidates(selected, usableCandidates, () => true, 5 - selected.length);

  return selected.slice(0, 5);
}

function readSerpSnapshotCandidates(
  serpSnapshots: SeoBriefJsonObject | null,
  mainQueries: Set<string>,
): OnPageTargetCandidate[] {
  if (!serpSnapshots) {
    return [];
  }

  const snapshotItems =
    readObjectArray(serpSnapshots.items).length > 0
      ? readObjectArray(serpSnapshots.items)
      : [{ keyword: readString(serpSnapshots.keyword), snapshot: serpSnapshots }];

  return snapshotItems.flatMap((item) => {
    const keyword = readString(item.keyword);
    const normalizedQuery = normalizeText(keyword ?? '');
    const snapshot = asObject(item.snapshot) ?? item;
    const queryMatchesMain = mainQueries.size === 0 || mainQueries.has(normalizedQuery);

    return readObjectArray(snapshot.organicResults).flatMap((organicResult) => {
      const url = readString(organicResult.url);
      const domain = normalizeDomain(readString(organicResult.domain) ?? domainFromUrl(url));
      if (!url || !domain) {
        return [];
      }

      const isForum = isForumDomain(domain);
      const isLocal = isLocalTarget(domain, url);
      const role: OnPageTargetRole = queryMatchesMain
        ? 'closest_intent_match'
        : isForum || isLocal
          ? 'local_or_forum_context'
          : 'strong_competitor';

      return [
        {
          role,
          sourceType: 'keyword_serp_snapshot',
          sourceClusterName: null,
          sourceQuery: keyword,
          domain,
          url,
          title: readString(organicResult.title),
          rankAbsolute:
            readNumber(organicResult.rankAbsolute) ?? readNumber(organicResult.rank_absolute),
          isForum,
          isLocal,
          selectionReason: queryMatchesMain
            ? 'Organic URL from saved SERP snapshot for the selected cluster query.'
            : isForum || isLocal
              ? 'Local/forum organic URL from saved SERP snapshot for extra page-format context.'
              : 'Strong organic URL from saved SERP snapshot.',
          score: 0,
        },
      ];
    });
  });
}

function readClusterUrlCandidates(
  selectionItem: JsonRecord | null,
  sourceCluster: JsonRecord | null,
  role: OnPageTargetRole,
): OnPageTargetCandidate[] {
  const sourceClusterName =
    readString(selectionItem?.clusterName) ?? readString(sourceCluster?.clusterName);
  const sourceQuery =
    readString(selectionItem?.primaryKeyword) ??
    readString(sourceCluster?.primaryKeywordCandidate) ??
    readString(sourceCluster?.primaryKeyword);

  return readObjectArray(sourceCluster?.competitorUrls).flatMap((item) => {
    const url = readString(item.url);
    const domain = normalizeDomain(readString(item.domain) ?? domainFromUrl(url));
    if (!url || !domain) {
      return [];
    }

    return [
      {
        role,
        sourceType: 'cluster_competitor_url',
        sourceClusterName,
        sourceQuery,
        domain,
        url,
        title: readString(item.title),
        rankAbsolute: readNumber(item.rankAbsolute) ?? readNumber(item.rank_absolute),
        isForum: isForumDomain(domain),
        isLocal: isLocalTarget(domain, url),
        selectionReason:
          role === 'closest_intent_match'
            ? 'SERP URL attached to the selected main cluster.'
            : 'SERP URL attached to a selected supporting cluster.',
        score: 0,
      },
    ];
  });
}

function readAggregationCandidates(
  aggregation: SeoBriefJsonObject | null,
  mainQueries: Set<string>,
): OnPageTargetCandidate[] {
  if (!aggregation) {
    return [];
  }

  return readObjectArray(aggregation.domains).flatMap((domainEntry) => {
    const domain = normalizeDomain(readString(domainEntry.domain));
    if (!domain) {
      return [];
    }

    return readObjectArray(domainEntry.ranking_urls).flatMap((item) => {
      const url = readString(item.url);
      if (!url) {
        return [];
      }
      const normalizedQuery = normalizeText(readString(item.query) ?? '');
      const rankAbsolute = readNumber(item.rank_absolute) ?? readNumber(item.rankAbsolute);
      const isForum = isForumDomain(domain);
      const isLocal = isLocalTarget(domain, url);
      const queryMatchesMain = mainQueries.size === 0 || mainQueries.has(normalizedQuery);
      const role: OnPageTargetRole = queryMatchesMain
        ? 'closest_intent_match'
        : isForum || isLocal
          ? 'local_or_forum_context'
          : 'strong_competitor';

      return [
        {
          role,
          sourceType: 'serp_domain_aggregation',
          sourceClusterName: null,
          sourceQuery: readString(item.query),
          domain,
          url,
          title: readString(item.title),
          rankAbsolute,
          isForum,
          isLocal,
          selectionReason: queryMatchesMain
            ? 'Ranking URL from saved SERP aggregation for the selected cluster query.'
            : isForum || isLocal
              ? 'Local/forum style URL from saved SERP aggregation for extra page-format context.'
              : 'Strong remaining ranking URL from saved SERP aggregation.',
          score: 0,
        },
      ];
    });
  });
}

function readClusterQueries(
  selectionItem: JsonRecord | null,
  sourceCluster: JsonRecord | null,
): string[] {
  return uniqueStrings([
    readString(selectionItem?.primaryKeyword),
    readString(sourceCluster?.primaryKeywordCandidate),
    readString(sourceCluster?.primaryKeyword),
    ...readStringArray(sourceCluster?.keywords),
    ...readStringArray(sourceCluster?.secondaryKeywords),
    ...readStringArray(sourceCluster?.questions),
    ...readStringArray(sourceCluster?.supportingItems),
  ]);
}

function scoreCandidate(candidate: OnPageTargetCandidate): OnPageTargetCandidate {
  const roleScore = {
    closest_intent_match: 100,
    strong_competitor: 84,
    local_or_forum_context: 74,
    supporting_cluster: 64,
  } satisfies Record<OnPageTargetRole, number>;
  const rankScore =
    candidate.rankAbsolute === null ? 12 : Math.max(0, 24 - Math.min(candidate.rankAbsolute, 24));
  const sourceScore =
    candidate.sourceType === 'cluster_competitor_url'
      ? 16
      : candidate.sourceType === 'keyword_serp_snapshot'
        ? 12
        : 8;
  const contextScore = candidate.isLocal || candidate.isForum ? 4 : 0;

  return {
    ...candidate,
    score: roleScore[candidate.role] + rankScore + sourceScore + contextScore,
  };
}

function addTopCandidates(
  selected: OnPageTargetCandidate[],
  candidates: OnPageTargetCandidate[],
  predicate: (candidate: OnPageTargetCandidate) => boolean,
  limit: number,
): void {
  if (limit <= 0) {
    return;
  }

  const selectedUrls = new Set(selected.map((item) => normalizeUrlKey(item.url)));
  const next = candidates
    .filter((candidate) => predicate(candidate) && !selectedUrls.has(normalizeUrlKey(candidate.url)))
    .sort(compareCandidates)
    .slice(0, limit);

  selected.push(...next);
}

function compareCandidates(left: OnPageTargetCandidate, right: OnPageTargetCandidate): number {
  if (right.score !== left.score) {
    return right.score - left.score;
  }

  return (left.rankAbsolute ?? Number.MAX_SAFE_INTEGER) -
    (right.rankAbsolute ?? Number.MAX_SAFE_INTEGER);
}

function dedupeCandidates(candidates: OnPageTargetCandidate[]): OnPageTargetCandidate[] {
  const byUrl = new Map<string, OnPageTargetCandidate>();
  for (const candidate of candidates) {
    const key = normalizeUrlKey(candidate.url);
    const existing = byUrl.get(key);
    if (!existing || compareCandidates(scoreCandidate(candidate), scoreCandidate(existing)) < 0) {
      byUrl.set(key, candidate);
    }
  }

  return [...byUrl.values()];
}

function isUsableOnPageTarget(candidate: OnPageTargetCandidate): boolean {
  const url = candidate.url.trim();
  const domain = candidate.domain.trim().toLowerCase();
  if (!url || !domain) {
    return false;
  }
  if (
    [
      'youtube.com',
      'youtu.be',
      'tiktok.com',
      'instagram.com',
      'facebook.com',
      'x.com',
      'twitter.com',
      'linkedin.com',
      'pinterest.com',
    ].some((blockedDomain) => domain === blockedDomain || domain.endsWith(`.${blockedDomain}`))
  ) {
    return false;
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  const path = parsed.pathname.toLowerCase();
  if (!path || path === '/') {
    return false;
  }

  return !/(^|\/)(login|signin|sign-in|signup|sign-up|register|download|downloads|app|apps|apk)(\/|$)/u.test(
    path,
  );
}

function toTargetJson(target: OnPageTargetCandidate): SeoBriefJsonObject {
  return {
    role: target.role,
    sourceType: target.sourceType,
    sourceClusterName: target.sourceClusterName,
    sourceQuery: target.sourceQuery,
    domain: target.domain,
    url: target.url,
    title: target.title,
    rankAbsolute: target.rankAbsolute,
    isLocal: target.isLocal,
    isForum: target.isForum,
    selectionReason: target.selectionReason,
    score: target.score,
  };
}

function toPageJson(page: OnPageTargetPage): SeoBriefJsonObject {
  const content = page.contentParsing;
  const instant = page.instantPage;
  return {
    ...toTargetJson(page.target),
    status: page.errorMessage ? 'failed' : 'completed',
    errorMessage: page.errorMessage,
    title: content?.title ?? instant?.title ?? page.target.title,
    metaDescription: instant?.metaDescription ?? null,
    canonical: instant?.canonical ?? null,
    statusCode: instant?.statusCode ?? null,
    h1: content?.h1 ?? [],
    h2: content?.h2 ?? [],
    h3: content?.h3 ?? [],
    textBlocks: content?.textBlocks.slice(0, 12) ?? [],
    markdownPreview: compactText(content?.markdown ?? null, 4_000),
    linkCount: content?.links.length ?? 0,
    importantLinks: (content?.links.slice(0, 20) ?? []) as unknown as SeoBriefJsonValue,
    technicalChecks: (instant?.technicalChecks ?? {}) as SeoBriefJsonValue,
    rawResponses: {
      contentParsing: content?.rawResponse ?? null,
      instantPages: instant?.rawResponse ?? null,
    },
  };
}

function normalizeUrlKey(value: string): string {
  try {
    const url = new URL(value);
    url.hash = '';
    return url.toString().replace(/\/$/u, '').toLowerCase();
  } catch {
    return value.trim().replace(/\/$/u, '').toLowerCase();
  }
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

function isForumDomain(domain: string): boolean {
  return /(^|\.)((reddit|quora|medium)\.com|stackexchange\.com)$/u.test(domain) ||
    domain.includes('forum') ||
    domain.includes('community');
}

function isLocalTarget(domain: string, url: string): boolean {
  const normalized = `${domain} ${url}`.toLowerCase();
  return domain.endsWith('.ng') || normalized.includes('nigeria') || normalized.includes('naira');
}

function asObject(value: unknown): JsonRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function readObjectArray(value: unknown): JsonRecord[] {
  return Array.isArray(value)
    ? value.map(asObject).filter((item): item is JsonRecord => item !== null)
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

function uniqueStrings(values: Array<string | null>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const normalized = value?.trim();
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function compactText(value: string | null, maxLength: number): string | null {
  const normalized = value?.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return null;
  }

  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength - 1).trim()}...`
    : normalized;
}
