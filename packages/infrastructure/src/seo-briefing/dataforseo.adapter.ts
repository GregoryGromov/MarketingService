import {
  type CompleteSeoBriefExternalCallLogParams,
  type FailSeoBriefExternalCallLogParams,
  type GetDomainMetricsParams,
  type GetKeywordSuggestionsParams,
  type GetOnPageContentParsingParams,
  type GetOnPageInstantPagesParams,
  type GetOnPageParseParams,
  type GetOrganicSerpParams,
  type GetOrganicSerpSnapshotParams,
  type GetRankedKeywordsParams,
  type GetSearchVolumeParams,
  SeoBriefExternalCallLog,
  SeoBriefExternalCallLogRepository,
  type SeoBriefJsonObject,
  type SeoBriefJsonValue,
  type SeoBriefRunId,
  type SeoBriefRunStepId,
  type SeoDomainMetricsResult,
  type SeoKeywordSuggestionsResult,
  type SeoNormalizedSerpAiOverview,
  type SeoNormalizedSerpAiOverviewElement,
  type SeoNormalizedSerpAiOverviewReference,
  type SeoNormalizedSerpOrganicResult,
  type SeoNormalizedSerpPeopleAlsoAskItem,
  type SeoNormalizedSerpSnapshot,
  type SeoNormalizedSerpSpecialBlock,
  type SeoOnPageContentParsingResult,
  type SeoOnPageInstantPagesResult,
  type SeoOnPageParseResult,
  type SeoOrganicSerpResult,
  type SeoOrganicSerpSnapshotResult,
  type SeoRankedKeywordItem,
  type SeoRankedKeywordMonthlySearch,
  type SeoRankedKeywordsResult,
  SeoResearchTransportError,
  SeoResearchValidationError,
  type SeoSearchVolumeResult,
  type StartSeoBriefExternalCallLogParams,
} from '@marketing-service/seo-briefing';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataForSeoHttpClientPort } from './dataforseo-http-client.port.js';
import { DataForSeoMemoryCacheService } from './dataforseo-memory-cache.service.js';

interface DataForSeoTaskEnvelope {
  cost?: number;
  id?: string;
  result?: unknown[];
  status_code?: number;
  status_message?: string;
}

interface DataForSeoResponseEnvelope {
  tasks?: DataForSeoTaskEnvelope[];
}

interface CachedSeoResearchResponse<TResult> {
  normalized: TResult;
  rawPayload: SeoBriefJsonValue;
}

interface SeoResearchLogContext {
  runId: SeoBriefRunId;
  stepId?: SeoBriefRunStepId | null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asObject(value: unknown): Record<string, unknown> | null {
  return isObject(value) ? value : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }

  return typeof value === 'string' && value.trim() ? [value] : [];
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function normalizeKeyword(value: string): string {
  const nextValue = value.trim().toLowerCase();
  if (nextValue.length === 0) {
    throw new SeoResearchValidationError('Keyword must not be empty', 'input', 'dataforseo');
  }

  return nextValue;
}

function normalizeTarget(value: string): string {
  const nextValue = value.trim().toLowerCase();
  if (nextValue.length === 0) {
    throw new SeoResearchValidationError('Target must not be empty', 'input', 'dataforseo');
  }

  return nextValue;
}

function normalizeUrl(value: string): string {
  const nextValue = value.trim();
  if (nextValue.length === 0) {
    throw new SeoResearchValidationError('URL must not be empty', 'input', 'dataforseo');
  }

  return nextValue;
}

function normalizeNullableDomain(value: string | null): string | null {
  const normalized = value?.trim().toLowerCase().replace(/^www\./u, '');
  return normalized || null;
}

function dedupeStrings(values: Array<string | null>): string[] {
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

function readOnPageLinks(value: unknown): Array<{ anchor?: string | null; url: string }> {
  return asArray(value)
    .map(asObject)
    .filter((item): item is Record<string, unknown> => item !== null)
    .map((item) => ({
      url: asString(item.url) ?? asString(item.href) ?? '',
      anchor: asString(item.anchor) ?? asString(item.text),
    }))
    .filter((item) => item.url.trim().length > 0)
    .slice(0, 120);
}

const DATAFORSEO_LANGUAGE_BY_INPUT = new Map<string, { code: string; name: string }>(
  [
    ['arabic', 'ar'],
    ['chinese', 'zh'],
    ['english', 'en'],
    ['filipino', 'tl'],
    ['french', 'fr'],
    ['german', 'de'],
    ['hindi', 'hi'],
    ['indonesian', 'id'],
    ['italian', 'it'],
    ['japanese', 'ja'],
    ['korean', 'ko'],
    ['portuguese', 'pt'],
    ['russian', 'ru'],
    ['spanish', 'es'],
    ['tagalog', 'tl'],
    ['thai', 'th'],
    ['turkish', 'tr'],
    ['ukrainian', 'uk'],
    ['vietnamese', 'vi'],
  ].flatMap(([name, code]) => [
    [name, { code, name: name[0]?.toUpperCase() + name.slice(1) }],
    [code, { code, name: name[0]?.toUpperCase() + name.slice(1) }],
  ]),
);

function normalizeDataForSeoLanguagePayload(language: string): SeoBriefJsonObject {
  const value = language.trim();
  if (value.length === 0) {
    throw new SeoResearchValidationError('Language must not be empty', 'input', 'dataforseo');
  }

  const normalized = value.toLowerCase().replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim();
  const directMatch = DATAFORSEO_LANGUAGE_BY_INPUT.get(normalized);
  if (directMatch) {
    return {
      language_code: directMatch.code,
      language_name: directMatch.name,
    };
  }

  for (const [key, languageEntry] of DATAFORSEO_LANGUAGE_BY_INPUT.entries()) {
    if (key.length > 2 && normalized.includes(key)) {
      return {
        language_code: languageEntry.code,
        language_name: languageEntry.name,
      };
    }
  }

  const codeMatch = normalized.match(/^[a-z]{2}(?:\s|$)/u);
  if (codeMatch) {
    return {
      language_code: codeMatch[0].trim(),
    };
  }

  return {
    language_name: value,
  };
}

function normalizeMarketPayload(params: {
  country: string;
  language: string;
  locationName?: string | null;
}): SeoBriefJsonObject {
  return {
    ...normalizeDataForSeoLanguagePayload(params.language),
    location_name: params.locationName?.trim() || params.country.trim(),
  };
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  if (isObject(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
}

function createCacheKey(endpoint: string, payload: SeoBriefJsonValue): string {
  return `${endpoint}:${stableStringify(payload)}`;
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

function collectNestedObjects(value: unknown, maxDepth: number): Record<string, unknown>[] {
  if (maxDepth < 0) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => collectNestedObjects(entry, maxDepth));
  }

  const object = asObject(value);
  if (!object) {
    return [];
  }

  return [
    object,
    ...collectNestedObjects(object.references, maxDepth - 1),
    ...collectNestedObjects(object.links, maxDepth - 1),
    ...collectNestedObjects(object.expanded_element, maxDepth - 1),
    ...collectNestedObjects(object.items, maxDepth - 1),
  ];
}

function isRelatedSearchHeading(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return (
    normalized === 'people also search for' ||
    normalized === 'find related products & services' ||
    normalized === 'related searches' ||
    normalized === 'people also search'
  );
}

function dedupeReferences(
  references: SeoNormalizedSerpAiOverviewReference[],
): SeoNormalizedSerpAiOverviewReference[] {
  const seen = new Set<string>();
  const result: SeoNormalizedSerpAiOverviewReference[] = [];

  for (const reference of references) {
    const key = reference.url ?? reference.domain ?? reference.title ?? reference.snippet;
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(reference);
  }

  return result.slice(0, 20);
}

@Injectable()
export class DataForSeoAdapter {
  private readonly logger = new Logger(DataForSeoAdapter.name);

  constructor(
    @Inject(ConfigService)
    private readonly config: ConfigService,
    @Inject(DataForSeoHttpClientPort)
    private readonly httpClient: DataForSeoHttpClientPort,
    @Inject(DataForSeoMemoryCacheService)
    private readonly cache: DataForSeoMemoryCacheService,
    @Inject(SeoBriefExternalCallLogRepository)
    private readonly externalCallLogRepository: SeoBriefExternalCallLogRepository,
  ) {}

  async getSearchVolume(params: GetSearchVolumeParams): Promise<SeoSearchVolumeResult> {
    const payload: SeoBriefJsonObject = {
      ...normalizeMarketPayload(params.market),
      keywords: params.keywords.map((keyword) => normalizeKeyword(keyword)),
    };

    return this.runCachedOperation(
      params,
      '/v3/keywords_data/google/search_volume/live',
      payload,
      (rawPayload) => this.parseSearchVolume(rawPayload, params),
    );
  }

  async getKeywordSuggestions(
    params: GetKeywordSuggestionsParams,
  ): Promise<SeoKeywordSuggestionsResult> {
    const payload: SeoBriefJsonObject = {
      ...normalizeMarketPayload(params.market),
      include_seed_keyword: params.includeSeedKeyword ?? false,
      keyword: normalizeKeyword(params.keyword),
      limit: params.limit ?? 20,
    };

    return this.runCachedOperation(
      params,
      '/v3/dataforseo_labs/google/related_keywords/live',
      payload,
      (rawPayload) => this.parseKeywordSuggestions(rawPayload, params),
    );
  }

  async getOrganicSerp(params: GetOrganicSerpParams): Promise<SeoOrganicSerpResult> {
    const payload = this.createOrganicSerpPayload({
      keyword: params.keyword,
      market: params.market,
      depth: params.depth,
      device: params.device,
    });

    return this.runCachedOperation(
      params,
      '/v3/serp/google/organic/live/advanced',
      payload,
      (rawPayload) => this.parseOrganicSerp(rawPayload, params),
    );
  }

  async getOrganicSerpSnapshot(
    params: GetOrganicSerpSnapshotParams,
  ): Promise<SeoOrganicSerpSnapshotResult> {
    const endpoint = '/v3/serp/google/organic/live/advanced';
    const payload = this.createOrganicSerpPayload({
      keyword: params.keyword,
      market: params.market,
      depth: params.depth ?? 10,
      device: params.device ?? 'mobile',
      os: params.os ?? 'android',
    });
    const cacheKey = createCacheKey(`${endpoint}:snapshot`, payload);
    const cached = this.cache.get<CachedSeoResearchResponse<SeoNormalizedSerpSnapshot>>(cacheKey);
    if (cached) {
      await this.logCacheHit(params, endpoint, payload, cached.rawPayload);
      return {
        provider: 'dataforseo',
        rawResponse: cached.rawPayload,
        snapshot: cached.normalized,
      };
    }

    const rawPayload = await this.requestAndLog(params, endpoint, payload);
    const snapshot = this.parseOrganicSerpSnapshot(rawPayload, params);
    this.cache.set(cacheKey, { normalized: snapshot, rawPayload }, this.getCacheTtlMs());

    return {
      provider: 'dataforseo',
      rawResponse: rawPayload,
      snapshot,
    };
  }

  async getDomainMetrics(params: GetDomainMetricsParams): Promise<SeoDomainMetricsResult> {
    const payload: SeoBriefJsonObject = {
      ...normalizeMarketPayload(params.market),
      target: normalizeTarget(params.target),
    };

    return this.runCachedOperation(
      params,
      '/v3/dataforseo_labs/google/domain_rank_overview/live',
      payload,
      (rawPayload) => this.parseDomainMetrics(rawPayload, params),
    );
  }

  async getRankedKeywords(params: GetRankedKeywordsParams): Promise<SeoRankedKeywordsResult> {
    const endpoint = '/v3/dataforseo_labs/google/ranked_keywords/live';
    const payload: SeoBriefJsonObject = {
      ...normalizeMarketPayload(params.market),
      target: normalizeTarget(params.target),
      limit: params.limit ?? 100,
      historical_serp_mode: params.historicalSerpMode ?? 'live',
      load_rank_absolute: params.loadRankAbsolute ?? false,
      ignore_synonyms: params.ignoreSynonyms ?? false,
      include_clickstream_data: params.includeClickstreamData ?? false,
    };

    return this.runCachedOperation(params, endpoint, payload, (rawPayload) =>
      this.parseRankedKeywords(rawPayload, params),
    );
  }

  async getOnPageContentParsing(
    params: GetOnPageContentParsingParams,
  ): Promise<SeoOnPageContentParsingResult> {
    const endpoint = '/v3/on_page/content_parsing/live';
    const payload: SeoBriefJsonObject = {
      url: normalizeUrl(params.url),
      markdown_view: params.markdownView ?? true,
    };

    return this.runCachedOperation(params, endpoint, payload, (rawPayload) =>
      this.parseOnPageContentParsing(rawPayload, params),
    );
  }

  async getOnPageInstantPages(
    params: GetOnPageInstantPagesParams,
  ): Promise<SeoOnPageInstantPagesResult> {
    const endpoint = '/v3/on_page/instant_pages';
    const payload: SeoBriefJsonObject = {
      url: normalizeUrl(params.url),
    };

    return this.runCachedOperation(params, endpoint, payload, (rawPayload) =>
      this.parseOnPageInstantPages(rawPayload, params),
    );
  }

  async getOnPageParse(params: GetOnPageParseParams): Promise<SeoOnPageParseResult> {
    const payload: SeoBriefJsonObject = {
      target: normalizeTarget(params.target),
      max_crawl_pages: params.maxCrawlPages ?? 1,
      enable_javascript: params.enableJavascript ?? false,
      ...(params.startUrl?.trim() ? { start_url: params.startUrl.trim() } : {}),
    };
    const cacheKey = createCacheKey('on_page_parse', payload);
    const cached = this.cache.get<CachedSeoResearchResponse<SeoOnPageParseResult>>(cacheKey);
    if (cached) {
      await this.logCacheHit(params, 'on_page_parse', payload, cached.rawPayload);
      return cached.normalized;
    }

    const taskPostPayload = await this.requestAndLog(params, '/v3/on_page/task_post', payload);
    const task = this.getSingleTask(taskPostPayload, '/v3/on_page/task_post');
    const taskId = asString(task.id);
    if (!taskId) {
      throw new SeoResearchValidationError(
        'DataForSEO on_page/task_post response does not contain task id',
        '/v3/on_page/task_post',
        'dataforseo',
        taskPostPayload,
      );
    }

    const summaryPayload = await this.pollOnPageSummary(taskId, params);
    const normalized = this.parseOnPageSummary(summaryPayload, taskId, params);
    this.cache.set(cacheKey, { normalized, rawPayload: summaryPayload }, this.getCacheTtlMs());
    return normalized;
  }

  private async runCachedOperation<TResult>(
    params: SeoResearchLogContext,
    endpoint: string,
    payload: SeoBriefJsonObject,
    parser: (rawPayload: SeoBriefJsonValue) => TResult,
  ): Promise<TResult> {
    const cacheKey = createCacheKey(endpoint, payload);
    const cached = this.cache.get<CachedSeoResearchResponse<TResult>>(cacheKey);
    if (cached) {
      await this.logCacheHit(params, endpoint, payload, cached.rawPayload);
      return cached.normalized;
    }

    const rawPayload = await this.requestAndLog(params, endpoint, payload);
    const normalized = parser(rawPayload);
    this.cache.set(cacheKey, { normalized, rawPayload }, this.getCacheTtlMs());
    return normalized;
  }

  private createOrganicSerpPayload(params: {
    keyword: string;
    market: {
      country: string;
      language: string;
      locationName?: string | null;
    };
    depth?: number;
    device?: 'desktop' | 'mobile';
    os?: string;
  }): SeoBriefJsonObject {
    return {
      ...normalizeMarketPayload(params.market),
      depth: params.depth ?? 10,
      keyword: normalizeKeyword(params.keyword),
      device: params.device ?? 'desktop',
      ...(params.os ? { os: params.os } : {}),
    };
  }

  private async requestAndLog(
    params: SeoResearchLogContext,
    endpoint: string,
    payload: SeoBriefJsonObject,
  ): Promise<SeoBriefJsonValue> {
    const log = await this.startLog({
      runId: params.runId,
      stepId: params.stepId ?? null,
      provider: 'dataforseo',
      endpoint,
      requestPayload: payload,
    });

    try {
      const response = await this.executeWithRetry(endpoint, () =>
        this.httpClient.request({
          method: 'POST',
          path: endpoint,
          payload,
          timeoutMs: this.getTimeoutMs(),
        }),
      );
      const task = this.getSingleTask(response.payload, endpoint);

      await this.completeLog(log, {
        responsePayload: response.payload,
        estimatedCost: task.cost ?? 0,
        cacheHit: false,
      });

      return response.payload;
    } catch (error) {
      await this.failLog(log, {
        errorMessage: this.describeError(error),
        responsePayload:
          error instanceof SeoResearchTransportError || error instanceof SeoResearchValidationError
            ? error.responsePayload
            : null,
        estimatedCost: 0,
        cacheHit: false,
      });
      throw error;
    }
  }

  private async logCacheHit(
    params: SeoResearchLogContext,
    endpoint: string,
    payload: SeoBriefJsonObject,
    responsePayload: SeoBriefJsonValue,
  ): Promise<void> {
    const log = await this.startLog({
      runId: params.runId,
      stepId: params.stepId ?? null,
      provider: 'dataforseo',
      endpoint,
      requestPayload: payload,
    });

    await this.completeLog(log, {
      responsePayload,
      estimatedCost: 0,
      cacheHit: true,
    });
  }

  private async pollOnPageSummary(
    taskId: string,
    params: Pick<GetOnPageParseParams, 'runId' | 'stepId' | 'pollAttempts' | 'pollDelayMs'>,
  ): Promise<SeoBriefJsonValue> {
    const attempts = params.pollAttempts ?? this.getOnPagePollAttempts();
    const delayMs = params.pollDelayMs ?? this.getOnPagePollDelayMs();
    const endpoint = `/v3/on_page/summary/${taskId}`;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const log = await this.startLog({
        runId: params.runId,
        stepId: params.stepId ?? null,
        provider: 'dataforseo',
        endpoint,
        requestPayload: { taskId },
      });

      try {
        const response = await this.executeWithRetry(endpoint, () =>
          this.httpClient.request({
            method: 'GET',
            path: endpoint,
            timeoutMs: this.getTimeoutMs(),
          }),
        );
        const task = this.getSingleTask(response.payload, endpoint);
        const result = asObject(task.result?.[0]);
        const crawlProgress = asString(result?.crawl_progress);

        await this.completeLog(log, {
          responsePayload: response.payload,
          estimatedCost: task.cost ?? 0,
          cacheHit: false,
        });

        if (!crawlProgress || crawlProgress === 'finished' || crawlProgress === '100%') {
          return response.payload;
        }

        if (attempt < attempts) {
          await this.delay(delayMs);
        }
      } catch (error) {
        await this.failLog(log, {
          errorMessage: this.describeError(error),
          responsePayload:
            error instanceof SeoResearchTransportError ||
            error instanceof SeoResearchValidationError
              ? error.responsePayload
              : null,
          estimatedCost: 0,
          cacheHit: false,
        });
        throw error;
      }
    }

    throw new SeoResearchValidationError(
      `OnPage summary did not finish within ${attempts} polling attempts`,
      '/v3/on_page/summary',
      'dataforseo',
    );
  }

  private async executeWithRetry<T>(endpoint: string, operation: () => Promise<T>): Promise<T> {
    const maxAttempts = this.getMaxAttempts();
    const retryDelayMs = this.getRetryDelayMs();

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        const retryable = this.isRetryableError(error);
        if (attempt < maxAttempts && retryable) {
          this.logger.warn(
            `${endpoint} failed on attempt ${attempt}/${maxAttempts}: ${this.describeError(error)}. Retrying in ${retryDelayMs}ms`,
          );
          await this.delay(retryDelayMs);
          continue;
        }

        throw error;
      }
    }

    throw new SeoResearchTransportError(
      `DataForSEO request failed after ${maxAttempts} attempts`,
      endpoint,
      'dataforseo',
      null,
    );
  }

  private getSingleTask(payload: SeoBriefJsonValue, endpoint: string): DataForSeoTaskEnvelope {
    const envelope = asObject(payload) as DataForSeoResponseEnvelope | null;
    const tasks = envelope?.tasks;
    if (!Array.isArray(tasks) || tasks.length === 0) {
      throw new SeoResearchValidationError(
        'DataForSEO response does not contain tasks',
        endpoint,
        'dataforseo',
        payload,
      );
    }

    const task = (tasks[0] ?? null) as DataForSeoTaskEnvelope | null;
    if (!task || !isObject(task)) {
      throw new SeoResearchValidationError(
        'DataForSEO response contains invalid task payload',
        endpoint,
        'dataforseo',
        payload,
      );
    }

    if ((task.status_code ?? 0) !== 20000) {
      throw new SeoResearchTransportError(
        asString(task.status_message) ?? `DataForSEO task failed for ${endpoint}`,
        endpoint,
        'dataforseo',
        typeof task.status_code === 'number' ? task.status_code : null,
        payload,
      );
    }

    return task;
  }

  private parseSearchVolume(
    payload: SeoBriefJsonValue,
    params: GetSearchVolumeParams,
  ): SeoSearchVolumeResult {
    const task = this.getSingleTask(payload, '/v3/keywords_data/google/search_volume/live');
    const items = (task.result ?? []).flatMap((item) =>
      asArray(asObject(item)?.items).map((entry) => {
        const normalized = asObject(entry);
        return {
          keyword: asString(normalized?.keyword) ?? '',
          searchVolume: asNumber(normalized?.search_volume),
          competition: asNumber(normalized?.competition),
          cpc: asNumber(normalized?.cpc),
          lowTopBid: asNumber(normalized?.low_top_of_page_bid),
          highTopBid: asNumber(normalized?.high_top_of_page_bid),
          monthlySearches: asArray(normalized?.monthly_searches)
            .map((monthItem) => {
              const month = asObject(monthItem);
              const year = asNumber(month?.year);
              const monthNumber = asNumber(month?.month);
              const searchVolume = asNumber(month?.search_volume);

              if (year == null || monthNumber == null || searchVolume == null) {
                return null;
              }

              return {
                year,
                month: monthNumber,
                searchVolume,
              };
            })
            .filter((monthItem): monthItem is NonNullable<typeof monthItem> => monthItem !== null),
        };
      }),
    );

    return {
      provider: 'dataforseo',
      market: params.market,
      items,
    };
  }

  private parseKeywordSuggestions(
    payload: SeoBriefJsonValue,
    params: GetKeywordSuggestionsParams,
  ): SeoKeywordSuggestionsResult {
    const task = this.getSingleTask(payload, '/v3/dataforseo_labs/google/related_keywords/live');
    const result = asObject(task.result?.[0]);
    const items = asArray(result?.items).map((entry) => {
      const normalized = asObject(entry);
      return {
        keyword: asString(normalized?.keyword) ?? '',
        searchVolume:
          asNumber(asObject(normalized?.keyword_info)?.search_volume) ??
          asNumber(normalized?.search_volume),
        competition:
          asNumber(asObject(normalized?.keyword_info)?.competition) ??
          asNumber(normalized?.competition),
        cpc: asNumber(asObject(normalized?.keyword_info)?.cpc) ?? asNumber(normalized?.cpc),
        relevance: asNumber(normalized?.relevance),
      };
    });

    return {
      provider: 'dataforseo',
      seedKeyword: normalizeKeyword(params.keyword),
      market: params.market,
      items,
    };
  }

  private parseOrganicSerp(
    payload: SeoBriefJsonValue,
    params: GetOrganicSerpParams,
  ): SeoOrganicSerpResult {
    const task = this.getSingleTask(payload, '/v3/serp/google/organic/live/advanced');
    const result = asObject(task.result?.[0]);
    const items = asArray(result?.items).map((entry) => {
      const normalized = asObject(entry);
      return {
        type: asString(normalized?.type) ?? 'unknown',
        rankGroup: asNumber(normalized?.rank_group),
        rankAbsolute: asNumber(normalized?.rank_absolute),
        title: asString(normalized?.title),
        url: asString(normalized?.url),
        domain: asString(normalized?.domain),
        description: asString(normalized?.description),
      };
    });

    return {
      provider: 'dataforseo',
      keyword: normalizeKeyword(params.keyword),
      market: params.market,
      totalCount: asNumber(result?.se_results_count),
      checkUrl: asString(result?.check_url),
      items,
    };
  }

  private parseOrganicSerpSnapshot(
    payload: SeoBriefJsonValue,
    params: GetOrganicSerpSnapshotParams,
  ): SeoNormalizedSerpSnapshot {
    const task = this.getSingleTask(payload, '/v3/serp/google/organic/live/advanced');
    const result = asObject(task.result?.[0]);
    const items = asArray(result?.items)
      .map((entry) => asObject(entry))
      .filter(Boolean);
    const serpFeatures = asArray(result?.item_types)
      .map((item) => asString(item))
      .filter((item): item is string => Boolean(item));
    const organicResults = items
      .filter((item) => asString(item?.type) === 'organic')
      .map((item, index) => this.toNormalizedOrganicResult(item, index))
      .filter((item): item is SeoNormalizedSerpOrganicResult => item !== null);
    const aiOverview = this.toAiOverview(
      items.find((item) => asString(item?.type) === 'ai_overview'),
    );
    const peopleAlsoAsk = items
      .filter((item) => asString(item?.type) === 'people_also_ask')
      .flatMap((item) => this.toPeopleAlsoAskItems(item))
      .filter((item): item is SeoNormalizedSerpPeopleAlsoAskItem => item !== null);
    const relatedSearches = [
      ...items
        .filter((item) => this.isRelatedSearchBlock(asString(item?.type)))
        .flatMap((item) => this.toRelatedSearches(item)),
      ...items.flatMap((item) => this.toExtendedPeopleAlsoSearch(item)),
    ];
    const specialBlocks = items
      .filter((item) => {
        const type = asString(item?.type);
        return type !== 'organic' && type !== 'people_also_ask' && !this.isRelatedSearchBlock(type);
      })
      .map((item) => this.toSpecialSerpBlock(item))
      .filter((item): item is SeoNormalizedSerpSpecialBlock => item !== null);

    return {
      keyword: normalizeKeyword(params.keyword),
      locationName:
        asString(result?.location_name) ?? params.market.locationName ?? params.market.country,
      locationCode: asNumber(result?.location_code),
      languageName: asString(result?.language_name) ?? params.market.language,
      languageCode:
        asString(result?.language_code) ?? params.market.language.trim().toLowerCase().slice(0, 2),
      device: asString(result?.device) ?? params.device ?? 'mobile',
      os: asString(result?.os) ?? params.os ?? 'android',
      datetime: asString(result?.datetime),
      checkUrl: asString(result?.check_url),
      cost: task.cost ?? null,
      aiOverview,
      serpFeatures,
      organicResults,
      peopleAlsoAsk,
      relatedSearches: [
        ...new Set(relatedSearches.filter((item) => !isRelatedSearchHeading(item))),
      ],
      specialBlocks,
    };
  }

  private toNormalizedOrganicResult(
    item: Record<string, unknown> | null,
    index: number,
  ): SeoNormalizedSerpOrganicResult | null {
    const domain = asString(item?.domain);
    const url = asString(item?.url);
    if (!domain || !url) {
      return null;
    }

    const rankGroup = asNumber(item?.rank_group);
    const rankAbsolute = asNumber(item?.rank_absolute);

    return {
      position: rankGroup ?? rankAbsolute ?? index + 1,
      rankGroup,
      rankAbsolute,
      domain,
      url,
      title: asString(item?.title),
      snippet: asString(item?.description),
    };
  }

  private toAiOverview(
    item: Record<string, unknown> | null | undefined,
  ): SeoNormalizedSerpAiOverview | null {
    if (!item) {
      return null;
    }

    const elements = asArray(item.items)
      .map((entry) => asObject(entry))
      .filter((entry): entry is Record<string, unknown> => entry !== null)
      .map((entry) => this.toAiOverviewElement(entry))
      .filter((entry): entry is SeoNormalizedSerpAiOverviewElement => entry !== null);
    const references = [
      ...asArray(item.references),
      ...elements.flatMap((element) => element.links ?? []),
    ]
      .map((entry) => this.toAiOverviewReference(entry))
      .filter((entry): entry is SeoNormalizedSerpAiOverviewReference => entry !== null);
    const text =
      compactText(asString(item.markdown), 2_000) ??
      compactText(elements.map((element) => element.text).join('\n'), 2_000);

    return {
      text,
      elements,
      references: dedupeReferences(references),
    };
  }

  private toAiOverviewElement(
    item: Record<string, unknown> | null,
  ): SeoNormalizedSerpAiOverviewElement | null {
    const text = compactText(asString(item?.text) ?? asString(item?.markdown), 700);
    if (!text) {
      return null;
    }

    const links = asArray(item?.links)
      .map((entry) => this.toAiOverviewReference(entry))
      .filter((entry): entry is SeoNormalizedSerpAiOverviewReference => entry !== null);

    return {
      text,
      title: asString(item?.title),
      links,
    };
  }

  private toAiOverviewReference(item: unknown): SeoNormalizedSerpAiOverviewReference | null {
    const source = asObject(item);
    if (!source) {
      return null;
    }

    const url = asString(source.url);
    const domain = asString(source.domain);
    const title = asString(source.title);
    const snippet = compactText(asString(source.text) ?? asString(source.description), 500);
    const sourceName = asString(source.source);
    if (!url && !domain && !title && !snippet && !sourceName) {
      return null;
    }

    return {
      domain,
      url,
      title,
      snippet,
      source: sourceName,
    };
  }

  private toPeopleAlsoAskItems(
    item: Record<string, unknown> | null,
  ): SeoNormalizedSerpPeopleAlsoAskItem[] {
    const children = asArray(item?.items)
      .map((entry) => asObject(entry))
      .filter((entry): entry is Record<string, unknown> => entry !== null);
    if (children.length > 0) {
      return children
        .map((entry) => this.toPeopleAlsoAskItem(entry))
        .filter((entry): entry is SeoNormalizedSerpPeopleAlsoAskItem => entry !== null);
    }

    const single = this.toPeopleAlsoAskItem(item);
    return single ? [single] : [];
  }

  private toPeopleAlsoAskItem(
    item: Record<string, unknown> | null,
  ): SeoNormalizedSerpPeopleAlsoAskItem | null {
    const question = asString(item?.title) ?? asString(item?.question);
    if (!question) {
      return null;
    }

    const source = this.findFirstNestedSource(item);

    return {
      question,
      sourceDomain: source.domain,
      sourceUrl: source.url,
      sourceTitle: source.title,
      answerSnippet: source.snippet ?? asString(item?.description),
    };
  }

  private toRelatedSearches(item: Record<string, unknown> | null): string[] {
    const directTitle = asString(item?.title);
    const nestedItems = asArray(item?.items)
      .map((entry) => asObject(entry))
      .filter((entry): entry is Record<string, unknown> => entry !== null)
      .map((entry) => asString(entry.title) ?? asString(entry.keyword) ?? asString(entry.text))
      .filter((entry): entry is string => Boolean(entry))
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);

    return [
      ...(directTitle && nestedItems.length === 0 ? [directTitle.trim()] : []),
      ...nestedItems,
    ].filter((entry) => !isRelatedSearchHeading(entry));
  }

  private toExtendedPeopleAlsoSearch(item: Record<string, unknown> | null): string[] {
    return asArray(item?.extended_people_also_search)
      .map((entry) => asString(entry))
      .filter((entry): entry is string => Boolean(entry))
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0 && !isRelatedSearchHeading(entry));
  }

  private toSpecialSerpBlock(
    item: Record<string, unknown> | null,
  ): SeoNormalizedSerpSpecialBlock | null {
    const type = asString(item?.type);
    if (!type) {
      return null;
    }

    const source = this.findFirstNestedSource(item);
    const title = asString(item?.title) ?? source.title;
    const subtitle =
      asString(item?.subtitle) ??
      asString(item?.description) ??
      compactText(asString(item?.markdown), 700) ??
      compactText(asString(item?.text), 700);
    const displayedPrice =
      asString(item?.displayed_price) ??
      asString(item?.price) ??
      asString(asObject(item?.price_data)?.price) ??
      asString(asObject(item?.price_data)?.displayed_price);
    const currencyContext =
      asString(item?.currency) ??
      asString(item?.currency_context) ??
      asString(asObject(item?.price_data)?.currency);

    return {
      type,
      title,
      subtitle,
      displayedPrice,
      currencyContext,
      sourceDomain: asString(item?.domain) ?? source.domain,
    };
  }

  private findFirstNestedSource(item: Record<string, unknown> | null): {
    domain: string | null;
    snippet: string | null;
    title: string | null;
    url: string | null;
  } {
    const candidates = collectNestedObjects(item, 3);

    for (const candidate of candidates) {
      const url = asString(candidate.url);
      const domain = asString(candidate.domain);
      const title = asString(candidate.title);
      const snippet =
        compactText(asString(candidate.description), 500) ??
        compactText(asString(candidate.answer), 500) ??
        compactText(asString(candidate.text), 500);
      if (url || domain || snippet) {
        return {
          domain,
          url,
          title,
          snippet,
        };
      }
    }

    return {
      domain: null,
      url: null,
      title: null,
      snippet: null,
    };
  }

  private isRelatedSearchBlock(type: string | null): boolean {
    return (
      type === 'related_searches' ||
      type === 'people_also_search' ||
      type === 'people_also_search_for'
    );
  }

  private parseDomainMetrics(
    payload: SeoBriefJsonValue,
    params: GetDomainMetricsParams,
  ): SeoDomainMetricsResult {
    const task = this.getSingleTask(
      payload,
      '/v3/dataforseo_labs/google/domain_rank_overview/live',
    );
    const result = asObject(task.result?.[0]);
    const metrics = asObject(result?.metrics);
    const organic = asObject(metrics?.organic);
    const paid = asObject(metrics?.paid);

    return {
      provider: 'dataforseo',
      target: normalizeTarget(params.target),
      market: params.market,
      organicKeywords: asNumber(organic?.count),
      organicTraffic: asNumber(organic?.etv),
      organicTrafficCost: asNumber(organic?.estimated_paid_traffic_cost),
      paidKeywords: asNumber(paid?.count),
      paidTraffic: asNumber(paid?.etv),
      paidTrafficCost: asNumber(paid?.estimated_paid_traffic_cost),
    };
  }

  private parseRankedKeywords(
    payload: SeoBriefJsonValue,
    params: GetRankedKeywordsParams,
  ): SeoRankedKeywordsResult {
    const task = this.getSingleTask(
      payload,
      '/v3/dataforseo_labs/google/ranked_keywords/live',
    );
    const result = asObject(task.result?.[0]);
    const metrics = asObject(result?.metrics);
    const organic = asObject(metrics?.organic);
    const items = asArray(result?.items)
      .map((item) => this.parseRankedKeywordItem(item, params))
      .filter((item): item is SeoRankedKeywordItem => item !== null);

    return {
      provider: 'dataforseo',
      target: normalizeTarget(params.target),
      market: params.market,
      totalCount: asNumber(result?.total_count),
      itemsCount: asNumber(result?.items_count),
      metrics: {
        organicPos1: asNumber(organic?.pos_1),
        organicPos2To3: asNumber(organic?.pos_2_3),
        organicPos4To10: asNumber(organic?.pos_4_10),
        organicEtv: asNumber(organic?.etv),
      },
      rawResponse: payload,
      items,
    };
  }

  private parseRankedKeywordItem(
    value: unknown,
    params: GetRankedKeywordsParams,
  ): SeoRankedKeywordItem | null {
    const item = asObject(value);
    const keywordData = asObject(item?.keyword_data);
    const keywordInfo = asObject(keywordData?.keyword_info);
    const keywordProperties = asObject(keywordData?.keyword_properties);
    const searchIntentInfo = asObject(keywordData?.search_intent_info);
    const serpInfo = asObject(keywordData?.serp_info);
    const rankedSerpElement = asObject(item?.ranked_serp_element);
    const serpItem = asObject(rankedSerpElement?.serp_item);
    const text = compactText(asString(keywordData?.keyword), 220);
    if (!text) {
      return null;
    }

    const searchVolume = asNumber(keywordInfo?.search_volume);
    const keywordDifficulty =
      asNumber(keywordProperties?.keyword_difficulty) ??
      asNumber(rankedSerpElement?.keyword_difficulty);

    return {
      text,
      type: 'keyword',
      source: 'ranked_keywords',
      sourceDomain: normalizeTarget(params.target),
      metrics: {
        searchVolume,
        searchVolumeSource: searchVolume === null ? null : 'ranked_keywords',
        keywordDifficulty,
        cpc: asNumber(keywordInfo?.cpc),
        competitionLevel: asString(keywordInfo?.competition_level),
        intent: asString(searchIntentInfo?.main_intent),
        monthlySearches: this.parseRankedKeywordMonthlySearches(
          keywordInfo?.monthly_searches,
        ),
      },
      competitorEvidence: {
        domain: normalizeNullableDomain(asString(serpItem?.domain)),
        rankingUrl: asString(serpItem?.url),
        rankingTitle: compactText(asString(serpItem?.title), 500),
        rankAbsolute: asNumber(serpItem?.rank_absolute),
        estimatedTraffic: asNumber(serpItem?.etv) ?? asNumber(rankedSerpElement?.etv),
      },
      serpEvidence: {
        serpFeatures: dedupeStrings(asArray(serpInfo?.serp_item_types).map(asString)),
      },
    };
  }

  private parseRankedKeywordMonthlySearches(value: unknown): SeoRankedKeywordMonthlySearch[] {
    return asArray(value)
      .map((item) => {
        const record = asObject(item);
        const month = asNumber(record?.month);
        const year = asNumber(record?.year);
        const searchVolume = asNumber(record?.search_volume);
        if (month === null || year === null || searchVolume === null) {
          return null;
        }

        return {
          month,
          year,
          searchVolume,
        };
      })
      .filter((item): item is SeoRankedKeywordMonthlySearch => item !== null);
  }

  private parseOnPageSummary(
    payload: SeoBriefJsonValue,
    taskId: string,
    params: GetOnPageParseParams,
  ): SeoOnPageParseResult {
    const task = this.getSingleTask(payload, '/v3/on_page/summary');
    const result = asObject(task.result?.[0]);
    const checks = asObject(result?.checks);

    return {
      provider: 'dataforseo',
      providerTaskId: taskId,
      target: normalizeTarget(params.target),
      crawlProgress: asString(result?.crawl_progress),
      onpageScore: asNumber(result?.onpage_score),
      pageCount: asNumber(result?.page_count) ?? asNumber(result?.total_pages),
      brokenPages: asNumber(checks?.is_broken),
      duplicateTitlePages: asNumber(checks?.duplicate_title),
      duplicateDescriptionPages: asNumber(checks?.duplicate_description),
    };
  }

  private parseOnPageContentParsing(
    payload: SeoBriefJsonValue,
    params: GetOnPageContentParsingParams,
  ): SeoOnPageContentParsingResult {
    const task = this.getSingleTask(payload, '/v3/on_page/content_parsing/live');
    const result = asObject(task.result?.[0]) ?? {};
    const page = asObject(result.page) ?? result;
    const content = asObject(page.content) ?? asObject(result.content) ?? page;
    const headings = asObject(content.headings) ?? asObject(page.headings) ?? {};
    const textBlocks = dedupeStrings([
      ...asStringArray(content.text_blocks),
      ...asStringArray(content.textBlocks),
      ...asStringArray(content.paragraphs),
      asString(content.text),
      asString(page.text),
    ]).slice(0, 80);

    return {
      provider: 'dataforseo',
      rawResponse: payload,
      url: normalizeUrl(params.url),
      title: asString(page.title) ?? asString(result.title),
      h1: dedupeStrings([...asStringArray(headings.h1), ...asStringArray(content.h1)]),
      h2: dedupeStrings([...asStringArray(headings.h2), ...asStringArray(content.h2)]),
      h3: dedupeStrings([...asStringArray(headings.h3), ...asStringArray(content.h3)]),
      markdown: asString(content.markdown) ?? asString(page.markdown) ?? asString(result.markdown),
      textBlocks,
      tables: asArray(content.tables) as SeoBriefJsonValue[],
      links: readOnPageLinks(content.links ?? page.links ?? result.links),
    };
  }

  private parseOnPageInstantPages(
    payload: SeoBriefJsonValue,
    params: GetOnPageInstantPagesParams,
  ): SeoOnPageInstantPagesResult {
    const task = this.getSingleTask(payload, '/v3/on_page/instant_pages');
    const result = asObject(task.result?.[0]) ?? {};
    const page = asObject(result.page) ?? result;
    const meta = asObject(page.meta) ?? asObject(result.meta) ?? {};

    return {
      provider: 'dataforseo',
      rawResponse: payload,
      url: normalizeUrl(params.url),
      title: asString(page.title) ?? asString(result.title),
      metaDescription:
        asString(page.meta_description) ??
        asString(page.metaDescription) ??
        asString(meta.description) ??
        asString(result.meta_description),
      canonical: asString(page.canonical) ?? asString(result.canonical),
      statusCode: asNumber(page.status_code) ?? asNumber(page.statusCode) ?? asNumber(result.status_code),
      technicalChecks: (asObject(page.checks) ?? asObject(result.checks) ?? {}) as SeoBriefJsonObject,
    };
  }

  private isRetryableError(error: unknown): boolean {
    if (!(error instanceof SeoResearchTransportError)) {
      return false;
    }

    return error.status == null || error.status === 429 || error.status >= 500;
  }

  private describeError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown error';
  }

  private getTimeoutMs(): number {
    return Math.max(
      1000,
      Number.parseInt(this.config.get<string>('DATAFORSEO_TIMEOUT_MS') ?? '60000', 10),
    );
  }

  private getMaxAttempts(): number {
    return Math.max(
      1,
      Number.parseInt(this.config.get<string>('DATAFORSEO_MAX_ATTEMPTS') ?? '2', 10),
    );
  }

  private getRetryDelayMs(): number {
    return Math.max(
      0,
      Number.parseInt(this.config.get<string>('DATAFORSEO_RETRY_DELAY_MS') ?? '250', 10),
    );
  }

  private getCacheTtlMs(): number {
    return Math.max(
      0,
      Number.parseInt(this.config.get<string>('DATAFORSEO_CACHE_TTL_MS') ?? '300000', 10),
    );
  }

  private getOnPagePollAttempts(): number {
    return Math.max(
      1,
      Number.parseInt(this.config.get<string>('DATAFORSEO_ON_PAGE_POLL_ATTEMPTS') ?? '3', 10),
    );
  }

  private getOnPagePollDelayMs(): number {
    return Math.max(
      0,
      Number.parseInt(this.config.get<string>('DATAFORSEO_ON_PAGE_POLL_DELAY_MS') ?? '200', 10),
    );
  }

  private async delay(ms: number): Promise<void> {
    if (ms <= 0) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async startLog(params: StartSeoBriefExternalCallLogParams) {
    const log = SeoBriefExternalCallLog.start(params);
    await this.externalCallLogRepository.save(log);
    return log;
  }

  private async completeLog(
    log: SeoBriefExternalCallLog,
    params: CompleteSeoBriefExternalCallLogParams,
  ): Promise<void> {
    log.complete(params);
    await this.externalCallLogRepository.save(log);
  }

  private async failLog(
    log: SeoBriefExternalCallLog,
    params: FailSeoBriefExternalCallLogParams,
  ): Promise<void> {
    log.fail(params);
    await this.externalCallLogRepository.save(log);
  }
}
