import type { SeoBriefRunId } from '../domain/seo-brief-run.aggregate.js';
import type { SeoBriefRunStepId } from '../domain/seo-brief-run-step.entity.js';
import type {
  SeoBriefBrandMemorySnapshot,
  SeoBriefJsonObject,
} from '../domain/seo-briefing.types.js';
import type { SeoResearchMarket } from './seo-research.port.js';

export type SeoBriefAiKeywordIntent =
  | 'informational'
  | 'commercial'
  | 'transactional'
  | 'navigational';

export type SeoBriefAiJourneyStage = 'awareness' | 'consideration' | 'decision';
export type SeoBriefAiProductFit = 'strong' | 'moderate' | 'weak';
export type SeoBriefAiModelMode = 'flash' | 'pro' | 'pro_thinking';
export type SeoBriefPromptInstructionOverrides = Record<string, string>;

export interface SeoBriefAiRequestContext {
  runId: SeoBriefRunId;
  stepId?: SeoBriefRunStepId | null;
  modelMode?: SeoBriefAiModelMode | null;
  timeoutMs?: number | null;
  promptInstructionOverrides?: SeoBriefPromptInstructionOverrides | null;
}

export interface ExtractSeoBriefContextParams {
  contextText: string;
  modelMode?: SeoBriefAiModelMode | null;
  timeoutMs?: number | null;
  promptInstructionOverrides?: SeoBriefPromptInstructionOverrides | null;
}

export interface ExtractedSeoBriefContext {
  topicHint?: string | null;
  topicSeed?: string | null;
  country?: string | null;
  language?: string | null;
  audience?: string | null;
  userPains?: string[];
  userScenarios?: string[];
  productName?: string | null;
  productDescription?: string | null;
  keyMessage?: string | null;
  audienceBefore?: string | null;
  audienceAfter?: string | null;
  cta?: string | null;
  knownCompetitors?: string[];
  brandConstraints?: string[];
  claimsConstraints?: string[];
  preferredAngle?: string | null;
  excludedTopics?: string[];
  temporaryConstraints: string[];
  missingFields: string[];
  notes: string[];
}

export type SeoBriefPainProductConnection =
  | 'direct'
  | 'alternative'
  | 'workflow'
  | 'education'
  | 'weak';
export type SeoBriefScenarioType = 'pain' | 'action' | 'ecosystem';
export type SeoBriefProductFitHypothesis =
  | 'direct_solution'
  | 'alternative_solution'
  | 'workflow_bridge'
  | 'education_bridge'
  | 'weak';
export type SeoBriefSearchHypothesisType =
  | 'pain'
  | 'action'
  | 'ecosystem'
  | 'comparison'
  | 'education'
  | 'risk';

export interface ExtractUserPainScenariosParams extends SeoBriefAiRequestContext {
  topicSeed: string;
  market: SeoResearchMarket;
  audience: string;
  productName: string;
  productDescription?: string | null;
  keyMessage?: string | null;
  seoProductContext?: SeoBriefJsonObject | null;
  brandMemorySnapshot?: SeoBriefBrandMemorySnapshot | null;
}

export interface SeoBriefUserPain {
  pain: string;
  whyRelevant: string;
  productConnection: SeoBriefPainProductConnection;
}

export interface SeoBriefUserScenario {
  scenario: string;
  type: SeoBriefScenarioType;
  whyCheck: string;
  productFitHypothesis: SeoBriefProductFitHypothesis;
}

export interface ExtractUserPainScenariosResult {
  topicHintInterpretation: string;
  userPains: SeoBriefUserPain[];
  userScenarios: SeoBriefUserScenario[];
  riskNotes: string[];
}

export interface ExpandKeywordsParams extends SeoBriefAiRequestContext {
  topicSeed: string;
  market: SeoResearchMarket;
  audience: string;
  productName: string;
  productDescription?: string | null;
  keyMessage?: string | null;
  audienceBefore?: string | null;
  audienceAfter?: string | null;
  campaignContext?: string | null;
  brandMemorySnapshot?: SeoBriefBrandMemorySnapshot | null;
  seoProductContext?: SeoBriefJsonObject | null;
  userPainScenarios?: ExtractUserPainScenariosResult | null;
  keywordExpansionPrompt?: string | null;
  limit?: number;
}

export interface SeoBriefKeywordHypothesis {
  keyword: string;
  intent: SeoBriefAiKeywordIntent;
  rationale: string;
  audienceFit: string;
  groupId?: string | null;
  groupLabel?: string | null;
  hypothesisType?: SeoBriefSearchHypothesisType | null;
  productFitHypothesis?: SeoBriefProductFitHypothesis | null;
  riskFlags?: string[];
}

export interface SeoBriefKeywordHypothesisGroup {
  groupId: string;
  label: string;
  purpose: string;
  hypotheses: SeoBriefKeywordHypothesis[];
}

export interface ExpandKeywordsResult {
  hypotheses: SeoBriefKeywordHypothesis[];
  groups?: SeoBriefKeywordHypothesisGroup[];
}

export interface TriageKeywordCandidate {
  keyword: string;
  searchVolume?: number | null;
  competition?: number | null;
}

export interface TriageKeywordsParams extends SeoBriefAiRequestContext {
  topicSeed: string;
  audience: string;
  productName: string;
  productDescription?: string | null;
  keywords: TriageKeywordCandidate[];
  brandMemorySnapshot?: SeoBriefBrandMemorySnapshot | null;
}

export interface TriageAcceptedKeyword {
  keyword: string;
  intent: SeoBriefAiKeywordIntent;
  stage: SeoBriefAiJourneyStage;
  reason: string;
}

export interface TriageRejectedKeyword {
  keyword: string;
  reason: string;
}

export interface TriageKeywordsResult {
  accepted: TriageAcceptedKeyword[];
  rejected: TriageRejectedKeyword[];
}

export type SeoBriefClusterSourceConfidence = 'low' | 'medium' | 'high';

export interface ClusterKeywordCompetitorUrl {
  domain: string;
  rankAbsolute?: number | null;
  title?: string | null;
  url: string;
}

export interface ClusterKeywordCandidateInput {
  competitorUrls: ClusterKeywordCompetitorUrl[];
  evidenceNotes: string[];
  fit: KeywordCandidateFitBreakdown;
  intent: SeoBriefAiKeywordIntent;
  keyword: string;
  metrics: {
    bestRankAbsolute?: number | null;
    candidateScore?: number | null;
    competitorMatchScore?: number | null;
    cpc?: number | null;
    intent?: string | null;
    keywordDifficulty?: number | null;
    proxyDemandScore?: number | null;
    searchVolume?: number | null;
    sourceHypothesisSerpDomainConcentrationLabel?: string | null;
    sourceHypothesisSerpDomainHhi?: number | null;
    sourceHypothesisSerpDominantDomain?: string | null;
    sourceHypothesisSerpDominantDomainShare?: number | null;
    sourceHypothesisSerpResultCount?: number | null;
    sourceHypothesisSerpUniqueDomainCount?: number | null;
  };
  reasons: string[];
  riskFlags: string[];
  scores: KeywordCandidateScoreBreakdown;
  sources: string[];
  stage: SeoBriefAiJourneyStage;
  status: 'accepted' | 'maybe';
  totalScore: number;
}

export interface ClusterKeywordsParams extends SeoBriefAiRequestContext {
  audience?: string | null;
  brandMemorySnapshot?: SeoBriefBrandMemorySnapshot | null;
  candidates?: ClusterKeywordCandidateInput[];
  keywords: string[];
  market?: SeoResearchMarket | null;
  productDescription?: string | null;
  productName?: string | null;
  rejectedKeywords?: string[];
  seoProductContext?: SeoBriefJsonObject | null;
  topicSeed: string;
  userPainScenarios?: ExtractUserPainScenariosResult | null;
}

export interface SeoKeywordCluster {
  competitorUrls?: ClusterKeywordCompetitorUrl[];
  evidenceSummary?: string | null;
  label: string;
  primaryKeyword: string;
  intent: SeoBriefAiKeywordIntent;
  keywords: string[];
  questions?: string[];
  rationale: string;
  secondaryKeywords?: string[];
  sourceConfidence?: SeoBriefClusterSourceConfidence;
  supportingItems?: string[];
  userIntent?: string | null;
}

export interface ClusterKeywordsResult {
  clusters: SeoKeywordCluster[];
}

export interface SelectRelatedKeywordCandidateInput {
  query: string;
  reason: string;
  source: string;
  sourceText: string;
}

export interface SelectRelatedKeywordsParams extends SeoBriefAiRequestContext {
  seedKeyword: string;
  candidates: SelectRelatedKeywordCandidateInput[];
  limit?: number;
}

export interface SelectedRelatedKeyword {
  keyword: string;
  reason: string;
  source: string;
  sourceText: string;
}

export interface RejectedRelatedKeyword {
  query: string;
  reason: string;
}

export interface SelectRelatedKeywordsResult {
  selected: SelectedRelatedKeyword[];
  rejected: RejectedRelatedKeyword[];
}

export type SeoBriefRankedKeywordsDomainType =
  | 'wallet'
  | 'cex_p2p'
  | 'local_fintech'
  | 'crypto_education'
  | 'other';
export type SeoBriefOnPageDomainType = 'media' | 'bank' | 'broad_blog' | 'other';
export type SeoBriefPainSignalDomainType = 'forum' | 'community' | 'social';
export type SeoBriefDomainPriority = 'high' | 'medium' | 'low';

export interface ClassifySerpDomainsParams extends SeoBriefAiRequestContext {
  audience: string;
  brandMemorySnapshot?: SeoBriefBrandMemorySnapshot | null;
  market: SeoResearchMarket;
  productDescription?: string | null;
  productName: string;
  seoProductContext?: SeoBriefJsonObject | null;
  serpDomainAggregation: SeoBriefJsonObject;
  topicSeed: string;
  userPainScenarios?: ExtractUserPainScenariosResult | null;
}

export interface RankedKeywordsTargetDomain {
  domain: string;
  domainType: SeoBriefRankedKeywordsDomainType;
  priority: SeoBriefDomainPriority;
  reason: string;
}

export interface OnPageOnlyTargetDomain {
  domain: string;
  domainType: SeoBriefOnPageDomainType;
  reason: string;
}

export interface PainSignalTargetDomain {
  domain: string;
  domainType: SeoBriefPainSignalDomainType;
  reason: string;
}

export interface IgnoredSerpDomain {
  domain: string;
  reason: string;
}

export interface ClassifySerpDomainsResult {
  ignoredTargets: IgnoredSerpDomain[];
  onpageOnlyTargets: OnPageOnlyTargetDomain[];
  painSignalTargets: PainSignalTargetDomain[];
  rankedKeywordsTargets: RankedKeywordsTargetDomain[];
}

export type KeywordCandidateScoringStatus = 'accepted' | 'maybe' | 'rejected';
export type KeywordCandidateFitLevel = 'strong' | 'moderate' | 'weak' | 'none';

export interface ScoreDirtyKeywordCandidateInput {
  evidenceCount: number;
  evidenceSummary: string[];
  flags: {
    hasRankedKeywordEvidence: boolean;
    hasSearchVolume: boolean;
    hasSelectedRelatedQuery: boolean;
    hasCompetitorKeywordMatch?: boolean;
    isInitialHypothesis: boolean;
  };
  keyword: string;
  metrics: {
    bestRankAbsolute?: number | null;
    candidateScore?: number | null;
    competitorMatchScore?: number | null;
    cpc?: number | null;
    intent?: string | null;
    keywordDifficulty?: number | null;
    proxyDemandScore?: number | null;
    searchVolume?: number | null;
    sourceHypothesisSerpDomainConcentrationLabel?: string | null;
    sourceHypothesisSerpDomainHhi?: number | null;
    sourceHypothesisSerpDominantDomain?: string | null;
    sourceHypothesisSerpDominantDomainShare?: number | null;
    sourceHypothesisSerpResultCount?: number | null;
    sourceHypothesisSerpUniqueDomainCount?: number | null;
  };
  normalizedText: string;
  sources: string[];
}

export interface ScoreDirtyKeywordCandidatesParams extends SeoBriefAiRequestContext {
  audience: string;
  brandMemorySnapshot?: SeoBriefBrandMemorySnapshot | null;
  candidates: ScoreDirtyKeywordCandidateInput[];
  keyMessage?: string | null;
  market: SeoResearchMarket;
  productDescription?: string | null;
  productName: string;
  seoProductContext?: SeoBriefJsonObject | null;
  topicSeed: string;
  userPainScenarios?: ExtractUserPainScenariosResult | null;
}

export interface KeywordCandidateScoreBreakdown {
  audienceFit: number;
  evidence: number;
  intentFit: number;
  productFit: number;
  riskCompliance: number;
  topicFit: number;
}

export interface KeywordCandidateFitBreakdown {
  audienceFit: KeywordCandidateFitLevel;
  evidence: KeywordCandidateFitLevel;
  intentFit: KeywordCandidateFitLevel;
  productFit: KeywordCandidateFitLevel;
  riskCompliance: KeywordCandidateFitLevel;
  topicFit: KeywordCandidateFitLevel;
}

export interface ScoredDirtyKeywordCandidate {
  evidenceNotes: string[];
  fit: KeywordCandidateFitBreakdown;
  intent: SeoBriefAiKeywordIntent;
  keyword: string;
  reasons: string[];
  riskFlags: string[];
  scores: KeywordCandidateScoreBreakdown;
  stage: SeoBriefAiJourneyStage;
  status: KeywordCandidateScoringStatus;
  totalScore: number;
}

export interface ScoreDirtyKeywordCandidatesResult {
  accepted: ScoredDirtyKeywordCandidate[];
  maybe: ScoredDirtyKeywordCandidate[];
  rejected: ScoredDirtyKeywordCandidate[];
  summary: {
    acceptedCount: number;
    maybeCount: number;
    notes: string[];
    rejectedCount: number;
  };
}

export type AiCompetitorKeywordMatchType =
  | 'exact_match'
  | 'near_match'
  | 'same_intent'
  | 'semantic_related'
  | 'no_match';

export interface AiCompetitorKeywordCandidateInput {
  candidateId: string;
  intent?: string | null;
  keyword: string;
  originType: string;
  productFitHypothesis?: string | null;
  reason?: string | null;
  riskFlags: string[];
  sourceKeyword?: string | null;
  sourceText?: string | null;
}

export interface AiCompetitorKeywordEvidenceInput {
  competitorEvidence?: SeoBriefJsonObject | null;
  evidenceId: string;
  keyword: string;
  metrics?: SeoBriefJsonObject | null;
  serpEvidence?: SeoBriefJsonObject | null;
  sourceDomain?: string | null;
}

export interface EvaluateCompetitorKeywordMatchesParams extends SeoBriefAiRequestContext {
  audience?: string | null;
  candidates: AiCompetitorKeywordCandidateInput[];
  competitorEvidence: AiCompetitorKeywordEvidenceInput[];
  market?: SeoResearchMarket | null;
  productDescription?: string | null;
  productName?: string | null;
  topicSeed: string;
}

export interface AiCompetitorKeywordMarketBucket {
  bucketId: string;
  description: string;
  evidenceIds: string[];
  name: string;
  representativeKeywords: string[];
}

export interface AiCompetitorKeywordSemanticMatch {
  competitorKeyword: string;
  evidenceId: string;
  evidenceStrength: number;
  matchConfidence: number;
  matchScore: number;
  matchType: AiCompetitorKeywordMatchType;
  sourceDomain?: string | null;
  why: string;
}

export interface AiCompetitorKeywordMatchedCandidate {
  bestMatchType: AiCompetitorKeywordMatchType;
  bucketId?: string | null;
  candidateId: string;
  candidateScore: number;
  keyword: string;
  matchedEvidenceIds: string[];
  matchingDomains: string[];
  proxyDemandScore: number;
  reason: string;
  riskLabel: 'exclude' | 'risky_requires_review' | 'safe';
  semanticMatches: AiCompetitorKeywordSemanticMatch[];
}

export interface EvaluateCompetitorKeywordMatchesResult {
  buckets: AiCompetitorKeywordMarketBucket[];
  candidates: AiCompetitorKeywordMatchedCandidate[];
  summary: {
    notes: string[];
  };
}

export interface GroupCompetitorKeywordEvidenceParams extends SeoBriefAiRequestContext {
  audience?: string | null;
  competitorEvidence: AiCompetitorKeywordEvidenceInput[];
  market?: SeoResearchMarket | null;
  maxBuckets?: number;
  productDescription?: string | null;
  productName?: string | null;
  topicSeed: string;
}

export interface GroupCompetitorKeywordEvidenceResult {
  buckets: AiCompetitorKeywordMarketBucket[];
  summary: {
    notes: string[];
  };
}

export interface AiCandidateKeywordBucket {
  bucketId: string;
  candidateIds: string[];
  description: string;
  name: string;
  representativeKeywords: string[];
}

export interface GroupCandidateKeywordsParams extends SeoBriefAiRequestContext {
  audience?: string | null;
  candidates: AiCompetitorKeywordCandidateInput[];
  market?: SeoResearchMarket | null;
  maxBuckets?: number;
  productDescription?: string | null;
  productName?: string | null;
  topicSeed: string;
}

export interface GroupCandidateKeywordsResult {
  buckets: AiCandidateKeywordBucket[];
  summary: {
    notes: string[];
  };
}

export type AiKeywordGroupMatchType = 'direct' | 'adjacent' | 'weak' | 'none';

export interface AiKeywordGroupMatch {
  candidateBucketId: string;
  competitorBucketIds: string[];
  matchStrength: number;
  matchType: AiKeywordGroupMatchType;
  reason: string;
}

export interface MatchKeywordGroupsParams extends SeoBriefAiRequestContext {
  candidateBuckets: AiCandidateKeywordBucket[];
  competitorBuckets: AiCompetitorKeywordMarketBucket[];
  market?: SeoResearchMarket | null;
  productDescription?: string | null;
  productName?: string | null;
  topicSeed: string;
}

export interface MatchKeywordGroupsResult {
  matches: AiKeywordGroupMatch[];
  summary: {
    notes: string[];
  };
}

export interface ScoreCompetitorKeywordCandidateGroupParams extends SeoBriefAiRequestContext {
  audience?: string | null;
  candidateBucket: AiCandidateKeywordBucket;
  candidates: AiCompetitorKeywordCandidateInput[];
  competitorBuckets: AiCompetitorKeywordMarketBucket[];
  competitorEvidence: AiCompetitorKeywordEvidenceInput[];
  market?: SeoResearchMarket | null;
  productDescription?: string | null;
  productName?: string | null;
  topicSeed: string;
}

export interface ScoreCompetitorKeywordCandidateGroupResult {
  candidates: AiCompetitorKeywordMatchedCandidate[];
  summary: {
    notes: string[];
  };
}

export interface BuildProductBridgeParams extends SeoBriefAiRequestContext {
  clusterLabel: string;
  primaryKeyword: string;
  intent: SeoBriefAiKeywordIntent;
  audience: string;
  productName: string;
  productDescription?: string | null;
  brandMemorySnapshot?: SeoBriefBrandMemorySnapshot | null;
}

export interface BuildProductBridgeResult {
  fit: SeoBriefAiProductFit;
  summary: string;
  positioningAngle: string;
  cta: string;
  talkingPoints: string[];
  risks: string[];
}

export type SeoBriefClusterProductFitType =
  | 'direct_solution'
  | 'alternative_solution'
  | 'workflow_bridge'
  | 'education_bridge'
  | 'no_fit';
export type SeoBriefClusterProductFitDecision = 'approve' | 'reject' | 'supporting_only';

export interface ProductFitReviewSupportingItemDetail {
  candidateScore?: number | null;
  metrics?: {
    bestRankAbsolute?: number | null;
    candidateScore?: number | null;
    competitorMatchScore?: number | null;
    cpc?: number | null;
    intent?: string | null;
    keywordDifficulty?: number | null;
    proxyDemandScore?: number | null;
    searchVolume?: number | null;
  };
  originType?: string | null;
  sourceCandidate?: SeoBriefJsonObject | null;
  sources: string[];
  text: string;
  whyInCluster?: string | null;
}

export interface ProductFitReviewClusterInput {
  clusterName: string;
  competitorUrls: ClusterKeywordCompetitorUrl[];
  evidenceSummary?: string | null;
  intent: SeoBriefAiKeywordIntent;
  keywords: string[];
  primaryKeywordCandidate: string;
  questions: string[];
  secondaryKeywords: string[];
  sourceConfidence?: SeoBriefClusterSourceConfidence | null;
  supportingItemDetails: ProductFitReviewSupportingItemDetail[];
  supportingItems: string[];
  userIntent?: string | null;
}

export interface ReviewClusterProductFitParams extends SeoBriefAiRequestContext {
  audience: string;
  brandMemorySnapshot?: SeoBriefBrandMemorySnapshot | null;
  clusters: ProductFitReviewClusterInput[];
  keyMessage?: string | null;
  market: SeoResearchMarket;
  productDescription?: string | null;
  productName: string;
  seoProductContext?: SeoBriefJsonObject | null;
  topicSeed: string;
  userPainScenarios?: ExtractUserPainScenariosResult | null;
}

export interface ClusterProductFitReview {
  clusterName: string;
  decision: SeoBriefClusterProductFitDecision;
  productFitScore: number;
  productFitType: SeoBriefClusterProductFitType;
  productInsertionAngle: string;
  reason: string;
  whatNotToClaim: string[];
  whereToInsert: string;
}

export interface ReviewClusterProductFitResult {
  clusterProductFit: ClusterProductFitReview[];
}

export interface ClusterSelectionCandidateExplanation {
  label: string;
  primaryKeyword: string;
  seoScore: number;
  productScore: number;
  totalScore: number;
  notes?: string[] | null;
}

export interface ExplainClusterSelectionParams extends SeoBriefAiRequestContext {
  selectedClusterLabel: string;
  candidates: ClusterSelectionCandidateExplanation[];
}

export interface RejectedClusterExplanation {
  label: string;
  reason: string;
}

export interface ExplainClusterSelectionResult {
  summary: string;
  reasons: string[];
  rejectedClusters: RejectedClusterExplanation[];
}

export interface SeoBriefSerpInsight {
  title: string;
  url: string | null;
  observation: string;
}

export interface SeoBriefOutlineSection {
  heading: string;
  h2?: string;
  h3?: string[];
  notes?: string;
  purpose: string;
  keyPoints: string[];
}

export interface SeoBriefFaqItem {
  question: string;
  answer: string;
  answerDirection?: string;
}

export interface SeoBriefProductPlacementPlan {
  summary: string;
  cta: string;
  sections: string[];
}

export interface SynthesizeOnPagePageInput {
  canonical?: string | null;
  domain: string;
  h1: string[];
  h2: string[];
  h3: string[];
  importantLinks: SeoBriefJsonObject[];
  markdownPreview?: string | null;
  metaDescription?: string | null;
  role?: string | null;
  sourceQuery?: string | null;
  textBlocks: string[];
  title?: string | null;
  url: string;
}

export interface SynthesizeOnPageParams extends SeoBriefAiRequestContext {
  audience: string;
  brandMemorySnapshot?: SeoBriefBrandMemorySnapshot | null;
  clusterSelection: SeoBriefJsonObject;
  competitorKeywordEvidence?: SeoBriefJsonObject | null;
  keyMessage?: string | null;
  market: SeoResearchMarket;
  onPagePages: SynthesizeOnPagePageInput[];
  productDescription?: string | null;
  productName: string;
  seoProductContext?: SeoBriefJsonObject | null;
  serpEnrichmentContext?: SeoBriefJsonObject | null;
  topicSeed: string;
}

export interface OnPageCompetitorStructureSummary {
  commonContentBlocks: string[];
  commonFaqQuestions: string[];
  commonH2Patterns: string[];
  commonTablesOrComparisons: string[];
  contentGaps: string[];
}

export interface RecommendedOnPageSection {
  heading: string;
  purpose: string;
  subpoints: string[];
}

export interface RecommendedArticleStructure {
  faq: string[];
  h1: string;
  h2: RecommendedOnPageSection[];
}

export interface OnPageProductInsertionPlan {
  angle: string;
  avoid: string[];
  do: string[];
  section: string;
}

export interface SynthesizeOnPageResult {
  competitorStructureSummary: OnPageCompetitorStructureSummary;
  productInsertion: OnPageProductInsertionPlan;
  recommendedArticleStructure: RecommendedArticleStructure;
  riskAndComplianceNotes: string[];
}

export interface GenerateSeoBriefParams extends SeoBriefAiRequestContext {
  primaryKeyword: string;
  clusterLabel: string;
  intent: SeoBriefAiKeywordIntent;
  audience: string;
  productName: string;
  productDescription?: string | null;
  market: SeoResearchMarket;
  productBridge: BuildProductBridgeResult;
  serpInsights?: SeoBriefSerpInsight[];
  constraints?: string[];
  brandMemorySnapshot?: SeoBriefBrandMemorySnapshot | null;
  clusterSelection?: SeoBriefJsonObject | null;
  competitorKeywordEvidence?: SeoBriefJsonObject | null;
  keywordCandidateScoring?: SeoBriefJsonObject | null;
  onPageSynthesis?: SeoBriefJsonObject | null;
  productFitReview?: SeoBriefJsonObject | null;
  seoProductContext?: SeoBriefJsonObject | null;
  serpEnrichmentContext?: SeoBriefJsonObject | null;
  supportingClusters?: SeoBriefJsonObject[] | null;
  topicHint?: string | null;
}

export interface GenerateSeoBriefResult {
  competitorGapsToFill?: string[];
  contentType?: 'pillar guide' | 'comparison' | 'how-to' | 'educational guide';
  cta?: string;
  externalSourcesNeeded?: string[];
  title: string;
  metaTitle: string;
  metaDescription: string;
  angle: string;
  internalLinks?: string[];
  mainCluster?: string;
  outline: SeoBriefOutlineSection[];
  primaryKeyword?: string;
  productInsertion?: {
    avoid: string[];
    how: string;
    sampleAngle: string;
    where: string;
  };
  faq: SeoBriefFaqItem[];
  productPlacement: SeoBriefProductPlacementPlan;
  recommendedH1?: string;
  recommendedMetaDescription?: string;
  recommendedMetaTitle?: string;
  recommendedTitle?: string;
  riskNotes?: string[];
  searchIntent?: string;
  secondaryKeywords?: string[];
  supportingClusters?: string[];
  targetReader?: string;
  topicHint?: string;
}

export interface DraftLongreadArticleParams extends SeoBriefAiRequestContext {
  finalSeoBrief: SeoBriefJsonObject;
  productProfile: SeoBriefJsonObject;
  claimsPolicy: SeoBriefJsonObject;
  brandVoice: SeoBriefJsonObject;
  targetLength: string;
  publishingFormat: string;
}

export interface DraftLongreadArticleResult {
  draftArticleMarkdown: string;
}

export type ArticleCleanupStatus =
  | 'passed'
  | 'passed_with_warnings'
  | 'revised'
  | 'needs_human_review';
export type ArticleCleanupWarningType =
  | 'claims'
  | 'compliance'
  | 'seo'
  | 'product_insertion'
  | 'factual_check'
  | 'tone'
  | 'structure';
export type ArticleCleanupWarningSeverity = 'blocker' | 'warning' | 'note';

export interface ArticleCleanupWarning {
  type: ArticleCleanupWarningType;
  severity: ArticleCleanupWarningSeverity;
  message: string;
}

export interface CleanupLongreadArticleParams extends SeoBriefAiRequestContext {
  draftArticleMarkdown: string;
  finalSeoBrief: SeoBriefJsonObject;
  productProfile: SeoBriefJsonObject;
  claimsPolicy: SeoBriefJsonObject;
  brandVoice: SeoBriefJsonObject;
  reviewAttempt?: number | null;
  previousReviewFindings?: SeoBriefJsonObject[] | null;
}

export interface CleanupLongreadArticleResult {
  status: ArticleCleanupStatus;
  warnings: ArticleCleanupWarning[];
  changesMade: string[];
  articleMarkdown: string;
}

export interface PackageLongreadArticleParams extends SeoBriefAiRequestContext {
  reviewedArticleMarkdown: string;
  finalSeoBrief: SeoBriefJsonObject;
  cleanupWarnings: CleanupLongreadArticleResult['warnings'];
  productProfile: SeoBriefJsonObject;
}

export interface PackageLongreadArticleResult {
  article: {
    title: string;
    slug: string;
    metaTitle: string;
    metaDescription: string;
    h1: string;
    bodyMarkdown: string;
  };
  seo: {
    primaryKeyword: string;
    secondaryKeywordsUsed: string[];
    searchIntent: string;
    contentType: string;
    faqIncluded: boolean;
    internalLinks: string[];
    externalSourcesNeeded: string[];
  };
  productInsertion: {
    whereInserted: string;
    angleUsed: string;
    forced: boolean;
  };
  claimsReview: {
    status: ArticleCleanupStatus;
    warnings: string[];
  };
  publishingChecklist: {
    readyToPublish: boolean;
    needsExternalFactCheck: boolean;
    needsComplianceReview: boolean;
    notes: string[];
  };
}

export abstract class SeoBriefAiPort {
  abstract extractContext(params: ExtractSeoBriefContextParams): Promise<ExtractedSeoBriefContext>;
  abstract extractUserPainScenarios(
    params: ExtractUserPainScenariosParams,
  ): Promise<ExtractUserPainScenariosResult>;
  abstract expandKeywords(params: ExpandKeywordsParams): Promise<ExpandKeywordsResult>;
  abstract triageKeywords(params: TriageKeywordsParams): Promise<TriageKeywordsResult>;
  abstract clusterKeywords(params: ClusterKeywordsParams): Promise<ClusterKeywordsResult>;
  abstract selectRelatedKeywords(
    params: SelectRelatedKeywordsParams,
  ): Promise<SelectRelatedKeywordsResult>;
  abstract classifySerpDomains(
    params: ClassifySerpDomainsParams,
  ): Promise<ClassifySerpDomainsResult>;
  abstract scoreDirtyKeywordCandidates(
    params: ScoreDirtyKeywordCandidatesParams,
  ): Promise<ScoreDirtyKeywordCandidatesResult>;
  evaluateCompetitorKeywordMatches(
    _params: EvaluateCompetitorKeywordMatchesParams,
  ): Promise<EvaluateCompetitorKeywordMatchesResult> {
    throw new Error('Not implemented');
  }
  groupCompetitorKeywordEvidence(
    _params: GroupCompetitorKeywordEvidenceParams,
  ): Promise<GroupCompetitorKeywordEvidenceResult> {
    throw new Error('Not implemented');
  }
  groupCandidateKeywords(
    _params: GroupCandidateKeywordsParams,
  ): Promise<GroupCandidateKeywordsResult> {
    throw new Error('Not implemented');
  }
  matchKeywordGroups(_params: MatchKeywordGroupsParams): Promise<MatchKeywordGroupsResult> {
    throw new Error('Not implemented');
  }
  scoreCompetitorKeywordCandidateGroup(
    _params: ScoreCompetitorKeywordCandidateGroupParams,
  ): Promise<ScoreCompetitorKeywordCandidateGroupResult> {
    throw new Error('Not implemented');
  }
  reviewClusterProductFit(
    _params: ReviewClusterProductFitParams,
  ): Promise<ReviewClusterProductFitResult> {
    throw new Error('Not implemented');
  }
  abstract buildProductBridge(params: BuildProductBridgeParams): Promise<BuildProductBridgeResult>;
  abstract explainClusterSelection(
    params: ExplainClusterSelectionParams,
  ): Promise<ExplainClusterSelectionResult>;
  synthesizeOnPage(_params: SynthesizeOnPageParams): Promise<SynthesizeOnPageResult> {
    throw new Error('Not implemented');
  }
  abstract generateSeoBrief(params: GenerateSeoBriefParams): Promise<GenerateSeoBriefResult>;
  draftLongreadArticle(_params: DraftLongreadArticleParams): Promise<DraftLongreadArticleResult> {
    throw new Error('Not implemented');
  }
  cleanupLongreadArticle(
    _params: CleanupLongreadArticleParams,
  ): Promise<CleanupLongreadArticleResult> {
    throw new Error('Not implemented');
  }
  packageLongreadArticle(
    _params: PackageLongreadArticleParams,
  ): Promise<PackageLongreadArticleResult> {
    throw new Error('Not implemented');
  }
}
