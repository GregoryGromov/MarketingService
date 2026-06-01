import type { SeoBriefRunId } from '../domain/seo-brief-run.aggregate.js';
import type { SeoBriefRunStepId } from '../domain/seo-brief-run-step.entity.js';
import type { SeoBriefBrandMemorySnapshot } from '../domain/seo-briefing.types.js';
import type { SeoResearchMarket } from './seo-research.port.js';

export type SeoBriefAiKeywordIntent =
  | 'informational'
  | 'commercial'
  | 'transactional'
  | 'navigational';

export type SeoBriefAiJourneyStage = 'awareness' | 'consideration' | 'decision';
export type SeoBriefAiProductFit = 'strong' | 'moderate' | 'weak';

export interface SeoBriefAiRequestContext {
  runId: SeoBriefRunId;
  stepId?: SeoBriefRunStepId | null;
}

export interface ExpandKeywordsParams extends SeoBriefAiRequestContext {
  topicSeed: string;
  market: SeoResearchMarket;
  audience: string;
  productName: string;
  productDescription?: string | null;
  brandMemorySnapshot?: SeoBriefBrandMemorySnapshot | null;
  keywordExpansionPrompt?: string | null;
  limit?: number;
}

export interface SeoBriefKeywordHypothesis {
  keyword: string;
  intent: SeoBriefAiKeywordIntent;
  rationale: string;
  audienceFit: string;
}

export interface ExpandKeywordsResult {
  hypotheses: SeoBriefKeywordHypothesis[];
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

export interface ClusterKeywordsParams extends SeoBriefAiRequestContext {
  topicSeed: string;
  keywords: string[];
}

export interface SeoKeywordCluster {
  label: string;
  primaryKeyword: string;
  intent: SeoBriefAiKeywordIntent;
  keywords: string[];
  rationale: string;
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
  purpose: string;
  keyPoints: string[];
}

export interface SeoBriefFaqItem {
  question: string;
  answer: string;
}

export interface SeoBriefProductPlacementPlan {
  summary: string;
  cta: string;
  sections: string[];
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
}

export interface GenerateSeoBriefResult {
  title: string;
  metaTitle: string;
  metaDescription: string;
  angle: string;
  outline: SeoBriefOutlineSection[];
  faq: SeoBriefFaqItem[];
  productPlacement: SeoBriefProductPlacementPlan;
}

export abstract class SeoBriefAiPort {
  abstract expandKeywords(params: ExpandKeywordsParams): Promise<ExpandKeywordsResult>;
  abstract triageKeywords(params: TriageKeywordsParams): Promise<TriageKeywordsResult>;
  abstract clusterKeywords(params: ClusterKeywordsParams): Promise<ClusterKeywordsResult>;
  abstract selectRelatedKeywords(
    params: SelectRelatedKeywordsParams,
  ): Promise<SelectRelatedKeywordsResult>;
  abstract buildProductBridge(params: BuildProductBridgeParams): Promise<BuildProductBridgeResult>;
  abstract explainClusterSelection(
    params: ExplainClusterSelectionParams,
  ): Promise<ExplainClusterSelectionResult>;
  abstract generateSeoBrief(params: GenerateSeoBriefParams): Promise<GenerateSeoBriefResult>;
}
