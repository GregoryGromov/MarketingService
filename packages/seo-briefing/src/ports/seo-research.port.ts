import type { SeoBriefRunId } from '../domain/seo-brief-run.aggregate.js';
import type { SeoBriefRunStepId } from '../domain/seo-brief-run-step.entity.js';
import type { SeoBriefJsonValue } from '../domain/seo-briefing.types.js';

export interface SeoResearchMarket {
  country: string;
  language: string;
  locationName?: string | null;
}

export interface SeoResearchRequestContext {
  runId: SeoBriefRunId;
  stepId?: SeoBriefRunStepId | null;
}

export interface GetSearchVolumeParams extends SeoResearchRequestContext {
  keywords: string[];
  market: SeoResearchMarket;
}

export interface SeoSearchVolumeMonthlySearch {
  month: number;
  searchVolume: number;
  year: number;
}

export interface SeoSearchVolumeItem {
  keyword: string;
  competition: number | null;
  cpc: number | null;
  highTopBid: number | null;
  lowTopBid: number | null;
  monthlySearches: SeoSearchVolumeMonthlySearch[];
  searchVolume: number | null;
}

export interface SeoSearchVolumeResult {
  items: SeoSearchVolumeItem[];
  market: SeoResearchMarket;
  provider: 'dataforseo';
}

export interface GetKeywordSuggestionsParams extends SeoResearchRequestContext {
  includeSeedKeyword?: boolean;
  keyword: string;
  limit?: number;
  market: SeoResearchMarket;
}

export interface SeoKeywordSuggestionItem {
  keyword: string;
  competition: number | null;
  cpc: number | null;
  relevance: number | null;
  searchVolume: number | null;
}

export interface SeoKeywordSuggestionsResult {
  items: SeoKeywordSuggestionItem[];
  market: SeoResearchMarket;
  provider: 'dataforseo';
  seedKeyword: string;
}

export interface GetOrganicSerpParams extends SeoResearchRequestContext {
  depth?: number;
  device?: 'desktop' | 'mobile';
  keyword: string;
  market: SeoResearchMarket;
}

export interface GetOrganicSerpSnapshotParams extends SeoResearchRequestContext {
  depth?: number;
  device?: 'desktop' | 'mobile';
  keyword: string;
  market: SeoResearchMarket;
  os?: string;
}

export interface SeoOrganicSerpItem {
  description: string | null;
  domain: string | null;
  rankAbsolute: number | null;
  rankGroup: number | null;
  title: string | null;
  type: string;
  url: string | null;
}

export interface SeoOrganicSerpResult {
  checkUrl: string | null;
  items: SeoOrganicSerpItem[];
  keyword: string;
  market: SeoResearchMarket;
  provider: 'dataforseo';
  totalCount: number | null;
}

export interface SeoNormalizedSerpOrganicResult {
  position: number;
  rankGroup?: number | null;
  rankAbsolute?: number | null;
  domain: string;
  url: string;
  title?: string | null;
  snippet?: string | null;
}

export interface SeoNormalizedSerpPeopleAlsoAskItem {
  answerSnippet?: string | null;
  question: string;
  sourceDomain?: string | null;
  sourceTitle?: string | null;
  sourceUrl?: string | null;
}

export interface SeoNormalizedSerpAiOverviewReference {
  domain?: string | null;
  snippet?: string | null;
  source?: string | null;
  title?: string | null;
  url?: string | null;
}

export interface SeoNormalizedSerpAiOverviewElement {
  links?: SeoNormalizedSerpAiOverviewReference[];
  text: string;
  title?: string | null;
}

export interface SeoNormalizedSerpAiOverview {
  elements: SeoNormalizedSerpAiOverviewElement[];
  references: SeoNormalizedSerpAiOverviewReference[];
  text: string | null;
}

export interface SeoNormalizedSerpSpecialBlock {
  currencyContext?: string | null;
  displayedPrice?: string | null;
  sourceDomain?: string | null;
  subtitle?: string | null;
  title?: string | null;
  type: string;
}

export interface SeoNormalizedSerpSnapshot {
  aiOverview?: SeoNormalizedSerpAiOverview | null;
  checkUrl?: string | null;
  cost?: number | null;
  datetime?: string | null;
  device?: string | null;
  keyword: string;
  languageCode?: string | null;
  languageName?: string | null;
  locationCode?: number | null;
  locationName?: string | null;
  organicResults: SeoNormalizedSerpOrganicResult[];
  os?: string | null;
  peopleAlsoAsk: SeoNormalizedSerpPeopleAlsoAskItem[];
  relatedSearches: string[];
  serpFeatures: string[];
  specialBlocks: SeoNormalizedSerpSpecialBlock[];
}

export interface SeoOrganicSerpSnapshotResult {
  provider: 'dataforseo';
  rawResponse: SeoBriefJsonValue;
  snapshot: SeoNormalizedSerpSnapshot;
}

export interface GetDomainMetricsParams extends SeoResearchRequestContext {
  market: SeoResearchMarket;
  target: string;
}

export interface SeoDomainMetricsResult {
  market: SeoResearchMarket;
  organicKeywords: number | null;
  organicTraffic: number | null;
  organicTrafficCost: number | null;
  paidKeywords: number | null;
  paidTraffic: number | null;
  paidTrafficCost: number | null;
  provider: 'dataforseo';
  target: string;
}

export interface GetOnPageParseParams extends SeoResearchRequestContext {
  enableJavascript?: boolean;
  maxCrawlPages?: number;
  pollAttempts?: number;
  pollDelayMs?: number;
  startUrl?: string | null;
  target: string;
}

export interface SeoOnPageParseResult {
  brokenPages: number | null;
  crawlProgress: string | null;
  duplicateDescriptionPages: number | null;
  duplicateTitlePages: number | null;
  onpageScore: number | null;
  pageCount: number | null;
  provider: 'dataforseo';
  providerTaskId: string;
  target: string;
}

export abstract class SeoResearchPort {
  abstract getDomainMetrics(params: GetDomainMetricsParams): Promise<SeoDomainMetricsResult>;
  abstract getKeywordSuggestions(
    params: GetKeywordSuggestionsParams,
  ): Promise<SeoKeywordSuggestionsResult>;
  abstract getOnPageParse(params: GetOnPageParseParams): Promise<SeoOnPageParseResult>;
  abstract getOrganicSerp(params: GetOrganicSerpParams): Promise<SeoOrganicSerpResult>;
  abstract getOrganicSerpSnapshot(
    params: GetOrganicSerpSnapshotParams,
  ): Promise<SeoOrganicSerpSnapshotResult>;
  abstract getSearchVolume(params: GetSearchVolumeParams): Promise<SeoSearchVolumeResult>;
}
