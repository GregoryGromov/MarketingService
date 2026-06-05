import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { SeoBriefArtifact } from '../../domain/seo-brief-artifact.entity.js';
import { SeoBriefArtifactRepository } from '../../domain/seo-brief-artifact.repository.js';
import { SeoBriefRunRepository } from '../../domain/seo-brief-run.repository.js';
import type { SeoBriefJsonObject, SeoBriefJsonValue } from '../../domain/seo-briefing.types.js';
import { SeoBriefRunNotFoundError } from '../../errors/seo-brief-run-not-found.error.js';
import { MatchCompetitorKeywordsCommand } from './match-competitor-keywords.command.js';

type CandidateOriginType =
  | 'ai_hypothesis'
  | 'serp_people_also_ask'
  | 'serp_people_also_search'
  | 'serp_related_search'
  | 'selected_related_query';

type MatchType =
  | 'exact_match'
  | 'near_match'
  | 'same_intent'
  | 'semantic_related'
  | 'no_match';

interface CandidateQuery {
  intent: string | null;
  normalizedText: string;
  originType: CandidateOriginType;
  productFitHypothesis: string | null;
  reason: string | null;
  riskFlags: string[];
  sourceKeyword: string | null;
  sourceText: string | null;
  text: string;
}

interface CompetitorKeyword {
  competitorEvidence: SeoBriefJsonObject | null;
  metrics: SeoBriefJsonObject | null;
  normalizedText: string;
  serpEvidence: SeoBriefJsonObject | null;
  sourceDomain: string | null;
  text: string;
}

interface KeywordMatch {
  competitorEvidence: SeoBriefJsonValue | null;
  competitorKeyword: string;
  competitorKeywordScore: number;
  matchConfidence: number;
  matchScore: number;
  matchType: MatchType;
  metrics: SeoBriefJsonValue | null;
  proxyContribution: number;
  serpEvidence: SeoBriefJsonValue | null;
  sourceDomain: string | null;
  useAsProxy: boolean;
  why: string;
}

interface CompetitorProxyEvaluation {
  baseProxyScore: number;
  bestMatchType: MatchType;
  competitorMatchScore: number;
  matchingDomainCount: number;
  matchingDomains: string[];
  multiCompetitorBoost: number;
  proxyDemandScore: number;
  semanticMatches: KeywordMatch[];
}

interface CompetitorKeywordMatchedCandidate {
  candidateScore: number;
  candidateScoreComponents: SeoBriefJsonValue;
  intent: string | null;
  normalizedText: string;
  originType: CandidateOriginType;
  productFitHypothesis: string | null;
  proxyEvaluation: CompetitorProxyEvaluation;
  reason: string | null;
  riskFlags: string[];
  riskLabel: 'exclude' | 'risky_requires_review' | 'safe';
  sourceKeyword: string | null;
  sourceText: string | null;
  text: string;
}

export interface MatchCompetitorKeywordsResult {
  artifactType: 'competitor_keyword_matches';
  averageProxyDemandScore: number;
  candidateCount: number;
  competitorKeywordCount: number;
  matchedCandidateCount: number;
  runId: string;
}

const IMPORTANT_TOKEN_PHRASES = [
  'bank account',
  'trust wallet',
  'cash out',
  'binance p2p',
  'save money',
  'make money',
  'passive income',
  'stablecoin earn',
];

const IMPORTANT_TOKENS = new Set([
  'usdt',
  'p2p',
  'naira',
  'bank',
  'account',
  'cash',
  'withdraw',
  'trust',
  'wallet',
  'binance',
  'trc20',
  'bep20',
  'dollar',
  'dollars',
  'save',
  'saving',
  'savings',
  'earn',
  'yield',
  'interest',
  'safe',
  'risk',
  'nigeria',
  'nigerian',
]);

const HARD_EXCLUDE = [
  'login',
  'log in',
  'logo',
  'download',
  'apk',
  'api',
  'support',
  'authenticator',
  'customer service',
  'word of the day',
  'square',
  'fake screenshot',
  'seed phrase generator',
  'private key',
  'with balance',
  'flasher',
  'pi network',
  'bee network',
  'contract address',
];

const MATCH_WEIGHT: Record<MatchType, number> = {
  exact_match: 1,
  near_match: 0.85,
  same_intent: 0.7,
  semantic_related: 0.45,
  no_match: 0,
};

@CommandHandler(MatchCompetitorKeywordsCommand)
export class MatchCompetitorKeywordsHandler
  implements ICommandHandler<MatchCompetitorKeywordsCommand, MatchCompetitorKeywordsResult>
{
  constructor(
    @Inject(SeoBriefRunRepository)
    private readonly runRepository: SeoBriefRunRepository,
    @Inject(SeoBriefArtifactRepository)
    private readonly artifactRepository: SeoBriefArtifactRepository,
  ) {}

  async execute(command: MatchCompetitorKeywordsCommand): Promise<MatchCompetitorKeywordsResult> {
    const run = await this.runRepository.findById(command.runId as never);
    if (!run) {
      throw new SeoBriefRunNotFoundError(command.runId);
    }

    const artifacts = await this.artifactRepository.findByRunId(run.id);
    if (!hasLatestObjectArtifact(artifacts, 'keyword_serp_derived_keywords')) {
      throw new Error('Extract SERP candidates before matching competitor keywords');
    }

    const candidateQueries = collectCandidateQueries(artifacts);
    if (candidateQueries.length === 0) {
      throw new Error('Generate keyword hypotheses before matching competitor keywords');
    }

    const competitorKeywords = collectCompetitorKeywords(artifacts);
    if (competitorKeywords.length === 0) {
      throw new Error('Build competitor keyword map before matching competitor keywords');
    }

    const candidates = candidateQueries.map((candidate) =>
      matchCandidateToCompetitors(candidate, competitorKeywords),
    );
    const matchedCandidateCount = candidates.filter(
      (candidate) => candidate.proxyEvaluation.semanticMatches.length > 0,
    ).length;
    const averageProxyDemandScore = candidates.length
      ? roundScore(
          candidates.reduce(
            (sum, candidate) => sum + candidate.proxyEvaluation.proxyDemandScore,
            0,
          ) / candidates.length,
        )
      : 0;

    const artifact = SeoBriefArtifact.create({
      runId: run.id,
      stage: 'keyword_research',
      artifactType: 'competitor_keyword_matches',
      payload: {
        artifactVersion: 'competitor_keyword_matches_v1',
        sourceArtifactTypes: [
          'keyword_hypotheses',
          'keyword_serp_derived_keywords',
          'keyword_related_query_selections',
          'competitor_keyword_map',
          'ranked_keywords_universe',
        ],
        notes: [
          'This step matches candidate queries against competitor ranked keywords.',
          'Competitor search volume is not assigned to candidate queries.',
          'proxyDemandScore is a demand proxy based on match type, competitor volume, rank, estimated traffic, and multi-domain evidence.',
          'Matching is deterministic in this MVP: exact, substring, important-token, and token-overlap signals.',
        ],
        candidateCount: candidates.length,
        competitorKeywordCount: competitorKeywords.length,
        matchedCandidateCount,
        averageProxyDemandScore,
        candidates: candidates as unknown as SeoBriefJsonValue,
      },
    });
    await this.artifactRepository.save(artifact);
    run.awaitConfirmation();
    await this.runRepository.save(run);

    return {
      runId: run.id,
      artifactType: 'competitor_keyword_matches',
      candidateCount: candidates.length,
      competitorKeywordCount: competitorKeywords.length,
      matchedCandidateCount,
      averageProxyDemandScore,
    };
  }
}

function hasLatestObjectArtifact(artifacts: SeoBriefArtifact[], artifactType: string): boolean {
  return readLatestObjectArtifact(artifacts, artifactType) !== null;
}

function collectCandidateQueries(artifacts: SeoBriefArtifact[]): CandidateQuery[] {
  const candidates = new Map<string, CandidateQuery>();

  for (const candidate of [
    ...collectKeywordHypothesisCandidates(artifacts),
    ...collectSerpDerivedCandidates(artifacts),
    ...collectSelectedRelatedQueryCandidates(artifacts),
  ]) {
    if (!candidate.normalizedText) {
      continue;
    }

    const existing = candidates.get(candidate.normalizedText);
    if (!existing) {
      candidates.set(candidate.normalizedText, candidate);
      continue;
    }

    existing.originType =
      existing.originType === 'ai_hypothesis' ? existing.originType : candidate.originType;
    existing.sourceKeyword = existing.sourceKeyword ?? candidate.sourceKeyword;
    existing.sourceText = existing.sourceText ?? candidate.sourceText;
    existing.reason = existing.reason ?? candidate.reason;
    existing.intent = existing.intent ?? candidate.intent;
    existing.productFitHypothesis = existing.productFitHypothesis ?? candidate.productFitHypothesis;
    existing.riskFlags = [...new Set([...existing.riskFlags, ...candidate.riskFlags])];
  }

  return [...candidates.values()];
}

function collectKeywordHypothesisCandidates(artifacts: SeoBriefArtifact[]): CandidateQuery[] {
  const payload = readLatestObjectArtifact(artifacts, 'keyword_hypotheses');
  const hypotheses = Array.isArray(payload?.hypotheses)
    ? payload.hypotheses
    : Array.isArray(payload?.searchHypotheses)
      ? payload.searchHypotheses
      : [];

  return hypotheses
    .map((item) => {
      const record = asObject(item);
      const text = readString(record?.keyword) ?? readString(record?.query);
      if (!text) {
        return null;
      }

      return createCandidateQuery({
        text,
        originType: 'ai_hypothesis',
        intent: readString(record?.intentHint) ?? readString(record?.intent_hint),
        productFitHypothesis:
          readString(record?.productFitHypothesis) ?? readString(record?.product_fit_hypothesis),
        reason: readString(record?.reason) ?? readString(record?.whyGenerated) ?? readString(record?.why_generated),
        riskFlags: readStringArray(record?.riskFlags ?? record?.risk_flags),
        sourceKeyword: null,
        sourceText: text,
      });
    })
    .filter((item): item is CandidateQuery => item !== null);
}

function collectSerpDerivedCandidates(artifacts: SeoBriefArtifact[]): CandidateQuery[] {
  const payload =
    readLatestObjectArtifact(artifacts, 'keyword_serp_derived_keywords') ??
    readLatestObjectArtifact(artifacts, 'first_keyword_serp_derived_keywords');
  const items = Array.isArray(payload?.items) ? payload.items : payload ? [payload] : [];
  const result: CandidateQuery[] = [];

  for (const item of items) {
    const record = asObject(item);
    const sourceKeyword = readString(record?.keyword);
    const queries = Array.isArray(record?.similarSearchQueries)
      ? record.similarSearchQueries
      : [];

    for (const queryItem of queries) {
      const query = asObject(queryItem);
      const text = readString(query?.query);
      if (!text) {
        continue;
      }

      result.push(
        createCandidateQuery({
          text,
          originType: mapSerpCandidateOrigin(readString(query?.source)),
          intent: null,
          productFitHypothesis: null,
          reason: readString(query?.reason),
          riskFlags: [],
          sourceKeyword,
          sourceText: readString(query?.sourceText) ?? text,
        }),
      );
    }
  }

  return result;
}

function collectSelectedRelatedQueryCandidates(artifacts: SeoBriefArtifact[]): CandidateQuery[] {
  const payload =
    readLatestObjectArtifact(artifacts, 'keyword_related_query_selections') ??
    readLatestObjectArtifact(artifacts, 'first_keyword_related_query_selection');
  const items = Array.isArray(payload?.items) ? payload.items : payload ? [payload] : [];
  const result: CandidateQuery[] = [];

  for (const item of items) {
    const record = asObject(item);
    const sourceKeyword = readString(record?.keyword);
    const selected = Array.isArray(record?.selected) ? record.selected : [];

    for (const selectedItem of selected) {
      const query = asObject(selectedItem);
      const text = readString(query?.keyword) ?? readString(query?.query);
      if (!text) {
        continue;
      }

      result.push(
        createCandidateQuery({
          text,
          originType: 'selected_related_query',
          intent: null,
          productFitHypothesis: null,
          reason: readString(query?.reason),
          riskFlags: [],
          sourceKeyword,
          sourceText: readString(query?.sourceText) ?? text,
        }),
      );
    }
  }

  return result;
}

function collectCompetitorKeywords(artifacts: SeoBriefArtifact[]): CompetitorKeyword[] {
  const payload =
    readLatestObjectArtifact(artifacts, 'competitor_keyword_map') ??
    readLatestObjectArtifact(artifacts, 'ranked_keywords_universe');
  const items = Array.isArray(payload?.items) ? payload.items : [];
  const result: CompetitorKeyword[] = [];

  for (const item of items) {
    const record = asObject(item);
    const text = readString(record?.text);
    if (!text) {
      continue;
    }

    result.push({
      text: normalizeDisplayText(text),
      normalizedText: normalizeKeywordText(text),
      sourceDomain: readString(record?.sourceDomain),
      metrics: asJsonObject(record?.metrics),
      competitorEvidence: asJsonObject(record?.competitorEvidence),
      serpEvidence: asJsonObject(record?.serpEvidence),
    });
  }

  return result;
}

function matchCandidateToCompetitors(
  candidate: CandidateQuery,
  competitorKeywords: CompetitorKeyword[],
): CompetitorKeywordMatchedCandidate {
  const possibleMatches = competitorKeywords
    .map((keyword) => createKeywordMatch(candidate, keyword))
    .filter((match) => match.matchType !== 'no_match')
    .sort((left, right) => {
      if (right.proxyContribution !== left.proxyContribution) {
        return right.proxyContribution - left.proxyContribution;
      }

      return right.matchScore - left.matchScore;
    })
    .slice(0, 10);
  const matchingDomains = [
    ...new Set(
      possibleMatches
        .map((match) => match.sourceDomain)
        .filter((domain): domain is string => Boolean(domain)),
    ),
  ];
  const baseProxyScore = possibleMatches.reduce(
    (max, match) => Math.max(max, match.proxyContribution),
    0,
  );
  const multiCompetitorBoost = Math.min(15, 5 * matchingDomains.length);
  const proxyDemandScore = roundScore(Math.min(100, baseProxyScore + multiCompetitorBoost));
  const riskPenalty = calculateRiskPenalty(candidate);
  const candidateScoreComponents = {
    proxyDemandScore,
    serpEnrichmentScore: calculateSerpEnrichmentScore(candidate),
    intentQualityScore: calculateIntentQualityScore(candidate),
    productFitHypothesisScore: calculateProductFitHypothesisScore(candidate),
    sourceConfidenceScore: calculateSourceConfidenceScore(candidate, possibleMatches),
    riskPenalty,
  };
  const candidateScore = roundScore(
    Math.max(
      0,
      proxyDemandScore * 0.35 +
        candidateScoreComponents.serpEnrichmentScore * 0.2 +
        candidateScoreComponents.intentQualityScore * 0.2 +
        candidateScoreComponents.productFitHypothesisScore * 0.2 +
        candidateScoreComponents.sourceConfidenceScore * 0.05 -
        riskPenalty,
    ),
  );

  return {
    text: candidate.text,
    normalizedText: candidate.normalizedText,
    originType: candidate.originType,
    sourceKeyword: candidate.sourceKeyword,
    sourceText: candidate.sourceText,
    intent: candidate.intent,
    productFitHypothesis: candidate.productFitHypothesis,
    riskFlags: candidate.riskFlags,
    reason: candidate.reason,
    proxyEvaluation: {
      semanticMatches: possibleMatches,
      proxyDemandScore,
      competitorMatchScore: possibleMatches[0]?.matchScore ?? 0,
      bestMatchType: possibleMatches[0]?.matchType ?? 'no_match',
      matchingDomainCount: matchingDomains.length,
      matchingDomains,
      multiCompetitorBoost,
      baseProxyScore: roundScore(baseProxyScore),
    },
    candidateScoreComponents: candidateScoreComponents as unknown as SeoBriefJsonValue,
    candidateScore,
    riskLabel: riskPenalty >= 100 ? 'exclude' : riskPenalty > 0 ? 'risky_requires_review' : 'safe',
  };
}

function createKeywordMatch(
  candidate: CandidateQuery,
  keyword: CompetitorKeyword,
): KeywordMatch {
  const matchSignal = classifyMatch(candidate.normalizedText, keyword.normalizedText);
  const competitorKeywordScore = calculateCompetitorKeywordScore(keyword);
  const proxyContribution = roundScore(
    competitorKeywordScore * MATCH_WEIGHT[matchSignal.matchType],
  );

  return {
    competitorKeyword: keyword.text,
    sourceDomain: keyword.sourceDomain,
    matchType: matchSignal.matchType,
    matchConfidence: matchSignal.confidence,
    matchScore: matchSignal.score,
    why: matchSignal.why,
    useAsProxy: matchSignal.matchType !== 'no_match',
    competitorKeywordScore,
    proxyContribution,
    metrics: keyword.metrics as SeoBriefJsonValue | null,
    competitorEvidence: keyword.competitorEvidence as SeoBriefJsonValue | null,
    serpEvidence: keyword.serpEvidence as SeoBriefJsonValue | null,
  };
}

function classifyMatch(candidateText: string, competitorText: string): {
  confidence: number;
  matchType: MatchType;
  score: number;
  why: string;
} {
  if (candidateText === competitorText) {
    return { matchType: 'exact_match', confidence: 1, score: 100, why: 'Exact normalized query match.' };
  }

  const candidateTokens = importantTokenAwareTokens(candidateText);
  const competitorTokens = importantTokenAwareTokens(competitorText);
  const tokenJaccard = jaccard(candidateTokens, competitorTokens);
  const importantOverlap = countImportantOverlap(candidateText, competitorText);
  const substringMatch =
    candidateText.includes(competitorText) || competitorText.includes(candidateText);

  if (substringMatch && Math.min(candidateText.length, competitorText.length) >= 8) {
    return {
      matchType: 'near_match',
      confidence: 0.88,
      score: 88,
      why: 'One normalized query contains the other with meaningful length.',
    };
  }

  if (tokenJaccard >= 0.72 || (importantOverlap >= 3 && tokenJaccard >= 0.45)) {
    return {
      matchType: 'near_match',
      confidence: roundConfidence(Math.max(0.82, tokenJaccard)),
      score: roundScore(Math.max(82, tokenJaccard * 100)),
      why: 'High overlap of meaningful query tokens.',
    };
  }

  if (tokenJaccard >= 0.5 || (importantOverlap >= 2 && tokenJaccard >= 0.3)) {
    return {
      matchType: 'same_intent',
      confidence: roundConfidence(Math.max(0.7, tokenJaccard)),
      score: roundScore(Math.max(70, tokenJaccard * 100)),
      why: 'Shared intent-bearing tokens suggest the same search situation.',
    };
  }

  if (tokenJaccard >= 0.28 || importantOverlap >= 1) {
    return {
      matchType: 'semantic_related',
      confidence: roundConfidence(Math.max(0.48, tokenJaccard)),
      score: roundScore(Math.max(45, tokenJaccard * 100)),
      why: 'Weak but useful overlap with at least one important market/product token.',
    };
  }

  return {
    matchType: 'no_match',
    confidence: 0,
    score: 0,
    why: 'No meaningful lexical overlap.',
  };
}

function calculateCompetitorKeywordScore(keyword: CompetitorKeyword): number {
  const metrics = keyword.metrics;
  const evidence = keyword.competitorEvidence;
  const volumeScore = calculateVolumeScore(readNumber(metrics?.searchVolume));
  const rankScore = calculateRankScore(readNumber(evidence?.rankAbsolute));
  const etvScore = calculateEstimatedTrafficScore(
    readNumber(evidence?.estimatedTraffic) ?? readNumber(metrics?.estimatedTraffic),
  );

  return roundScore(volumeScore * 0.45 + rankScore * 0.3 + etvScore * 0.25);
}

function calculateVolumeScore(volume: number | null): number {
  if (volume == null) return 0;
  if (volume >= 10000) return 100;
  if (volume >= 1000) return 80;
  if (volume >= 100) return 60;
  if (volume >= 10) return 35;
  if (volume === 0) return 5;
  return 0;
}

function calculateRankScore(rankAbsolute: number | null): number {
  if (rankAbsolute == null) return 30;
  if (rankAbsolute <= 3) return 100;
  if (rankAbsolute <= 10) return 75;
  if (rankAbsolute <= 20) return 50;
  return 25;
}

function calculateEstimatedTrafficScore(estimatedTraffic: number | null): number {
  if (estimatedTraffic == null) return 0;
  if (estimatedTraffic >= 1000) return 100;
  if (estimatedTraffic >= 100) return 80;
  if (estimatedTraffic >= 10) return 50;
  if (estimatedTraffic > 0) return 25;
  return 0;
}

function calculateSerpEnrichmentScore(candidate: CandidateQuery): number {
  if (candidate.originType === 'ai_hypothesis') return 45;
  if (candidate.originType === 'selected_related_query') return 85;
  return 75;
}

function calculateIntentQualityScore(candidate: CandidateQuery): number {
  const normalized = candidate.normalizedText;
  if (containsHardExclude(normalized)) return 0;
  const tokens = importantTokenAwareTokens(normalized);
  if (tokens.length >= 3 && tokens.length <= 9) return 85;
  if (tokens.length >= 2 && tokens.length <= 12) return 70;
  return 50;
}

function calculateProductFitHypothesisScore(candidate: CandidateQuery): number {
  switch (candidate.productFitHypothesis) {
    case 'direct_solution':
      return 100;
    case 'alternative_solution':
      return 80;
    case 'workflow_bridge':
      return 70;
    case 'education_bridge':
      return 60;
    case 'weak':
      return 25;
    default:
      return 50;
  }
}

function calculateSourceConfidenceScore(
  candidate: CandidateQuery,
  matches: KeywordMatch[],
): number {
  if (matches.length >= 3 && candidate.originType !== 'ai_hypothesis') return 90;
  if (matches.length >= 2) return 80;
  if (matches.length >= 1) return 65;
  if (candidate.originType !== 'ai_hypothesis') return 55;
  return 45;
}

function calculateRiskPenalty(candidate: CandidateQuery): number {
  if (containsHardExclude(candidate.normalizedText)) return 100;
  if (candidate.riskFlags.length > 0) return 20;
  return 0;
}

function containsHardExclude(normalizedText: string): boolean {
  return HARD_EXCLUDE.some((term) => normalizedText.includes(term));
}

function createCandidateQuery(params: {
  intent: string | null;
  originType: CandidateOriginType;
  productFitHypothesis: string | null;
  reason: string | null;
  riskFlags: string[];
  sourceKeyword: string | null;
  sourceText: string | null;
  text: string;
}): CandidateQuery {
  return {
    ...params,
    text: normalizeDisplayText(params.text),
    normalizedText: normalizeKeywordText(params.text),
  };
}

function mapSerpCandidateOrigin(source: string | null): CandidateOriginType {
  if (source === 'people_also_ask') return 'serp_people_also_ask';
  if (source === 'people_also_search') return 'serp_people_also_search';
  if (source === 'related_search') return 'serp_related_search';
  return 'serp_related_search';
}

function importantTokenAwareTokens(text: string): string[] {
  const normalized = normalizeKeywordText(text);
  const words = normalized
    .split(' ')
    .filter((token) => token.length > 1 && !isStopWord(token));
  const phraseTokens = IMPORTANT_TOKEN_PHRASES.filter((phrase) => normalized.includes(phrase));

  return [...new Set([...words, ...phraseTokens])];
}

function countImportantOverlap(left: string, right: string): number {
  let count = 0;
  for (const token of IMPORTANT_TOKENS) {
    if (left.includes(token) && right.includes(token)) {
      count += 1;
    }
  }

  for (const phrase of IMPORTANT_TOKEN_PHRASES) {
    if (left.includes(phrase) && right.includes(phrase)) {
      count += 2;
    }
  }

  return count;
}

function jaccard(left: string[], right: string[]): number {
  if (left.length === 0 || right.length === 0) {
    return 0;
  }

  const leftSet = new Set(left);
  const rightSet = new Set(right);
  const intersection = [...leftSet].filter((item) => rightSet.has(item)).length;
  const union = new Set([...leftSet, ...rightSet]).size;

  return union ? intersection / union : 0;
}

function isStopWord(token: string): boolean {
  return new Set([
    'a',
    'an',
    'and',
    'are',
    'best',
    'can',
    'for',
    'from',
    'how',
    'in',
    'is',
    'it',
    'my',
    'of',
    'on',
    'or',
    'the',
    'to',
    'what',
    'which',
    'with',
  ]).has(token);
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

function normalizeDisplayText(value: string): string {
  return value.replace(/\s+/gu, ' ').replace(/[?!.\u3002\uff01\uff1f]+$/u, '').trim();
}

function normalizeKeywordText(value: string): string {
  return normalizeDisplayText(value)
    .toLowerCase()
    .replace(/[-_/]+/gu, ' ')
    .replace(/[^\p{L}\p{N}\s$]+/gu, '')
    .replace(/\s+/gu, ' ')
    .trim();
}

function asObject(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asJsonObject(value: unknown): SeoBriefJsonObject | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as SeoBriefJsonObject)
    : null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => readString(item)).filter((item): item is string => Boolean(item))
    : [];
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function roundScore(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundConfidence(value: number): number {
  return Math.round(Math.max(0, Math.min(1, value)) * 100) / 100;
}
