import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { SeoBriefArtifact } from '../../domain/seo-brief-artifact.entity.js';
import { SeoBriefArtifactRepository } from '../../domain/seo-brief-artifact.repository.js';
import { SeoBriefRunRepository } from '../../domain/seo-brief-run.repository.js';
import { SeoBriefRunStep } from '../../domain/seo-brief-run-step.entity.js';
import { SeoBriefRunStepRepository } from '../../domain/seo-brief-run-step.repository.js';
import type { SeoBriefJsonObject, SeoBriefJsonValue } from '../../domain/seo-briefing.types.js';
import { SeoBriefRunNotFoundError } from '../../errors/seo-brief-run-not-found.error.js';
import { deriveRequiredTopicTerms } from '../../services/topic-hint-scope.service.js';
import { SelectSeoBriefClustersCommand } from './select-seo-brief-clusters.command.js';

type JsonRecord = Record<string, unknown>;
type SelectionDecision = 'main' | 'supporting' | 'rejected';

interface ClusterSelectionScore {
  competitorProxyDemandEvidence: number;
  intentRelevance: number;
  productFit: number;
  riskPenalty: number;
  serpEnrichmentSupport: number;
  sourceDiversityConfidence: number;
  topicScopeAlignment: number;
  weightedScoreBeforePenalty: number;
}

interface ClusterSelectionCandidate {
  clusterName: string;
  decision: SelectionDecision;
  primaryKeyword: string;
  priorityScore: number;
  productFitDecision: string;
  productFitReview: JsonRecord;
  productFitType: string;
  reason: string;
  role: string | null;
  scoreBreakdown: ClusterSelectionScore;
  sourceCluster: JsonRecord;
}

export interface SelectSeoBriefClustersResult {
  artifactType: 'cluster_selection_snapshot';
  mainClusterName: string | null;
  rejectedClusterCount: number;
  runId: string;
  supportingClusterCount: number;
}

@CommandHandler(SelectSeoBriefClustersCommand)
export class SelectSeoBriefClustersHandler
  implements ICommandHandler<SelectSeoBriefClustersCommand, SelectSeoBriefClustersResult>
{
  constructor(
    @Inject(SeoBriefRunRepository)
    private readonly runRepository: SeoBriefRunRepository,
    @Inject(SeoBriefRunStepRepository)
    private readonly stepRepository: SeoBriefRunStepRepository,
    @Inject(SeoBriefArtifactRepository)
    private readonly artifactRepository: SeoBriefArtifactRepository,
  ) {}

  async execute(command: SelectSeoBriefClustersCommand): Promise<SelectSeoBriefClustersResult> {
    const run = await this.runRepository.findById(command.runId as never);
    if (!run) {
      throw new SeoBriefRunNotFoundError(command.runId);
    }

    const artifacts = await this.artifactRepository.findByRunId(run.id);
    const productFitReview = readLatestObjectArtifact(artifacts, 'cluster_product_fit_review');
    if (!productFitReview) {
      throw new Error('Review cluster Product Fit before selecting SEO brief clusters');
    }

    const reviews = readProductFitReviews(productFitReview);
    if (reviews.length === 0) {
      throw new Error('Cluster Product Fit review does not contain clusters to select');
    }

    const step = SeoBriefRunStep.create({
      runId: run.id,
      stage: 'cluster_selection',
      status: 'running',
      attemptNumber: nextAttemptNumber(artifacts, 'cluster_selection_snapshot'),
    });
    await this.stepRepository.save(step);

    try {
      const requiredTopicTerms = deriveRequiredTopicTerms(run.topicSeed);
      const candidates = reviews
        .map((review) => toSelectionCandidate(review, requiredTopicTerms))
        .sort(compareSelectionCandidates);
      const selectedClusterName = normalizeClusterName(command.selectedClusterName);
      const mainCluster = selectedClusterName
        ? findManuallySelectedCluster(candidates, selectedClusterName)
        : null;
      const supportingClusters = candidates
        .filter((candidate) => candidate !== mainCluster && candidate.decision !== 'rejected')
        .slice(0, 3);
      const rejectedClusters = candidates.filter((candidate) => candidate.decision === 'rejected');

      const payload: SeoBriefJsonObject = {
        artifactVersion: 'cluster_selection_v2',
        sourceArtifactType: 'cluster_product_fit_review',
        inputClusterCount: candidates.length,
        selectionMode: mainCluster ? 'manual_selected' : 'manual_required',
        manualSelectionRequired: !mainCluster,
        selectedClusterName: mainCluster?.clusterName ?? null,
        weights: {
          productFit: 28,
          topicScopeAlignment: 22,
          competitorProxyDemandEvidence: 20,
          intentRelevance: 15,
          serpEnrichmentSupport: 10,
          sourceDiversityConfidence: 5,
          riskPenalty: 'subtract',
        },
        requiredTopicTerms,
        notes: [
          'Main cluster is selected manually by the operator from ranked approved/supporting clusters.',
          'Approved and supporting-only clusters can be selected manually; rejected clusters cannot.',
          'High competitor/proxy demand does not override bad Product Fit.',
          'Concrete topic hint terms are scored separately so generic adjacent clusters do not replace the requested scope.',
          'No direct volume does not kill a cluster when SERP, proxy, and Product Fit evidence are strong.',
        ],
        mainCluster: mainCluster ? toSelectedClusterJson(mainCluster) : null,
        supportingClusters: supportingClusters.map(toSupportingClusterJson) as unknown as SeoBriefJsonValue,
        rejectedClusters: rejectedClusters.map(toRejectedClusterJson) as unknown as SeoBriefJsonValue,
        rankedClusters: candidates.map(toRankedClusterJson) as unknown as SeoBriefJsonValue,
        selectedCluster: mainCluster ? toLegacySelectedClusterJson(mainCluster) : null,
      };

      await this.artifactRepository.save(
        SeoBriefArtifact.create({
          runId: run.id,
          stage: 'cluster_selection',
          artifactType: 'cluster_selection_snapshot',
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
        artifactType: 'cluster_selection_snapshot',
        mainClusterName: mainCluster?.clusterName ?? null,
        supportingClusterCount: supportingClusters.length,
        rejectedClusterCount: rejectedClusters.length,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'SEO brief cluster selection failed';
      step.fail(message);
      run.fail(message);
      await this.stepRepository.save(step);
      await this.runRepository.save(run);
      throw error;
    }
  }
}

function normalizeClusterName(value: string | null | undefined): string | null {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return normalized || null;
}

function findManuallySelectedCluster(
  candidates: ClusterSelectionCandidate[],
  selectedClusterName: string,
): ClusterSelectionCandidate {
  const candidate = candidates.find(
    (item) => item.clusterName.trim().toLowerCase() === selectedClusterName,
  );
  if (!candidate) {
    throw new Error(`Selected cluster "${selectedClusterName}" was not found in ranked clusters`);
  }
  if (candidate.decision === 'rejected') {
    throw new Error(`Selected cluster "${candidate.clusterName}" is rejected and cannot be used`);
  }

  return candidate;
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

function readProductFitReviews(payload: SeoBriefJsonObject): JsonRecord[] {
  return Array.isArray(payload.clusterProductFit)
    ? payload.clusterProductFit.map(asObject).filter((item): item is JsonRecord => item !== null)
    : [];
}

function toSelectionCandidate(
  review: JsonRecord,
  requiredTopicTerms: string[],
): ClusterSelectionCandidate {
  const sourceCluster = asObject(review.sourceCluster) ?? {};
  const clusterName = readString(review.clusterName) ?? readString(sourceCluster.clusterName) ?? '';
  const productFitDecision = readString(review.decision) ?? 'reject';
  const productFitType = readString(review.productFitType) ?? 'no_fit';
  const scoreBreakdown = calculateScoreBreakdown(review, sourceCluster, requiredTopicTerms);
  const priorityScore = clampScore(
    scoreBreakdown.weightedScoreBeforePenalty - scoreBreakdown.riskPenalty,
  );
  const primaryKeyword =
    readString(sourceCluster.primaryKeywordCandidate) ??
    readString(sourceCluster.primaryKeyword) ??
    readString(review.primaryKeyword) ??
    '';
  const eligibleForMain = productFitDecision === 'approve' && productFitType !== 'no_fit';
  const eligibleForSupporting =
    productFitDecision === 'supporting_only' ||
    (productFitDecision === 'approve' && productFitType !== 'no_fit');
  const decision: SelectionDecision = eligibleForMain
    ? 'main'
    : eligibleForSupporting
      ? 'supporting'
      : 'rejected';

  return {
    clusterName,
    decision,
    primaryKeyword,
    priorityScore,
    productFitDecision,
    productFitReview: review,
    productFitType,
    reason: buildSelectionReason(review, scoreBreakdown, decision),
    role: decision === 'supporting' ? 'supporting article / internal link' : null,
    scoreBreakdown,
    sourceCluster,
  };
}

function calculateScoreBreakdown(
  review: JsonRecord,
  sourceCluster: JsonRecord,
  requiredTopicTerms: string[],
): ClusterSelectionScore {
  const productFit = clampScore(readNumber(review.productFitScore) ?? 0);
  const topicScopeAlignment = calculateTopicScopeAlignment(review, sourceCluster, requiredTopicTerms);
  const competitorProxyDemandEvidence = calculateCompetitorProxyDemandEvidence(sourceCluster);
  const intentRelevance = calculateIntentRelevance(review, sourceCluster);
  const serpEnrichmentSupport = calculateSerpEnrichmentSupport(sourceCluster);
  const sourceDiversityConfidence = calculateSourceDiversityConfidence(sourceCluster);
  const riskPenalty = calculateRiskPenalty(review);
  const weightedScoreBeforePenalty =
    productFit * 0.28 +
    topicScopeAlignment * 0.22 +
    competitorProxyDemandEvidence * 0.2 +
    intentRelevance * 0.15 +
    serpEnrichmentSupport * 0.1 +
    sourceDiversityConfidence * 0.05;

  return {
    productFit,
    topicScopeAlignment,
    competitorProxyDemandEvidence,
    intentRelevance,
    serpEnrichmentSupport,
    sourceDiversityConfidence,
    riskPenalty,
    weightedScoreBeforePenalty: roundScore(weightedScoreBeforePenalty),
  };
}

function calculateTopicScopeAlignment(
  review: JsonRecord,
  sourceCluster: JsonRecord,
  requiredTopicTerms: string[],
): number {
  const anchorTerms = getConcreteAnchorTerms(requiredTopicTerms);
  if (anchorTerms.length === 0) {
    return 75;
  }

  const searchableText = [
    readString(sourceCluster.clusterName),
    readString(sourceCluster.primaryKeywordCandidate),
    readString(sourceCluster.primaryKeyword),
    readString(review.clusterName),
    readString(review.reason),
    ...readStringArray(sourceCluster.keywords),
    ...readStringArray(sourceCluster.secondaryKeywords),
    ...readStringArray(sourceCluster.questions),
    ...readStringArray(sourceCluster.supportingItems),
    ...readSupportingItemDetails(sourceCluster).flatMap((item) => [
      readString(item.text),
      readString(item.whyInCluster),
    ]),
  ]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join(' ')
    .toLowerCase();

  if (anchorTerms.some((term) => searchableText.includes(term))) {
    return 100;
  }

  const tokenMatches = anchorTerms.filter((term) =>
    term.split(/\s+/).some((token) => token.length >= 4 && searchableText.includes(token)),
  ).length;
  if (tokenMatches > 0) {
    return 55;
  }

  return 15;
}

function getConcreteAnchorTerms(requiredTopicTerms: string[]): string[] {
  const genericTerms = new Set([
    'crypto',
    'cryptocurrency',
    'earn',
    'earning',
    'interest',
    'market',
    'markets',
    'money',
    'tether',
    'usdt',
    'yield',
  ]);
  const concrete = requiredTopicTerms.filter((term) => !genericTerms.has(term));
  return concrete.length > 0 ? concrete : requiredTopicTerms;
}

function calculateCompetitorProxyDemandEvidence(sourceCluster: JsonRecord): number {
  const supportingDetails = readSupportingItemDetails(sourceCluster);
  const proxyScores = supportingDetails.flatMap((item) => [
    readNumber(asObject(item.metrics)?.proxyDemandScore),
    readNumber(asObject(item.metrics)?.competitorMatchScore),
    readNumber(asObject(item.metrics)?.candidateScore),
  ]).filter((value): value is number => value !== null);
  const searchVolumes = supportingDetails
    .map((item) => readNumber(asObject(item.metrics)?.searchVolume))
    .filter((value): value is number => value !== null);
  const volumeScore = searchVolumes.length
    ? Math.min(100, Math.max(...searchVolumes.map((volume) => Math.log10(volume + 1) * 25)))
    : 0;
  const proxyScore = proxyScores.length ? Math.max(...proxyScores) : 0;
  const competitorUrlScore = Math.min(100, readArray(sourceCluster.competitorUrls).length * 18);

  return clampScore(Math.max(proxyScore, volumeScore, competitorUrlScore));
}

function calculateIntentRelevance(review: JsonRecord, sourceCluster: JsonRecord): number {
  const decision = readString(review.decision);
  const intent = readString(sourceCluster.intent);
  const type = readString(review.productFitType);
  const base = decision === 'approve' ? 82 : decision === 'supporting_only' ? 62 : 15;
  const intentBonus =
    intent === 'commercial' || intent === 'transactional'
      ? 10
      : intent === 'informational'
        ? 6
        : -20;
  const typeBonus =
    type === 'direct_solution'
      ? 8
      : type === 'alternative_solution' || type === 'workflow_bridge'
        ? 5
        : type === 'education_bridge'
          ? 3
          : -25;

  return clampScore(base + intentBonus + typeBonus);
}

function calculateSerpEnrichmentSupport(sourceCluster: JsonRecord): number {
  const supportingDetails = readSupportingItemDetails(sourceCluster);
  const competitorUrlCount = readArray(sourceCluster.competitorUrls).length;
  const questionCount = readArray(sourceCluster.questions).length;
  const supportingCount = supportingDetails.length;
  const serpSourceCount = supportingDetails.filter((item) =>
    readStringArray(item.sources).some((source) => source.includes('serp') || source.includes('related')),
  ).length;

  return clampScore(
    Math.min(45, competitorUrlCount * 12) +
      Math.min(25, questionCount * 8) +
      Math.min(20, supportingCount * 5) +
      Math.min(20, serpSourceCount * 8),
  );
}

function calculateSourceDiversityConfidence(sourceCluster: JsonRecord): number {
  const supportingDetails = readSupportingItemDetails(sourceCluster);
  const sourceSet = new Set<string>();
  for (const item of supportingDetails) {
    for (const source of readStringArray(item.sources)) {
      sourceSet.add(source);
    }
  }
  if (readArray(sourceCluster.competitorUrls).length > 0) {
    sourceSet.add('competitor_urls');
  }
  const confidence = readString(sourceCluster.sourceConfidence);
  const confidenceScore = confidence === 'high' ? 35 : confidence === 'medium' ? 22 : 10;

  return clampScore(confidenceScore + Math.min(65, sourceSet.size * 16));
}

function calculateRiskPenalty(review: JsonRecord): number {
  const decision = readString(review.decision);
  const fitType = readString(review.productFitType);
  const notToClaimCount = readStringArray(review.whatNotToClaim).length;
  const text = [
    readString(review.reason),
    readString(review.productInsertionAngle),
    readString(review.whereToInsert),
    ...readStringArray(review.whatNotToClaim),
  ].join(' ').toLowerCase();
  const riskyWords = ['guaranteed', 'risk-free', 'no-risk', 'private key', 'seed phrase', 'cash-out tool'];
  const keywordPenalty = riskyWords.some((word) => text.includes(word)) ? 8 : 0;
  const rejectionPenalty = decision === 'reject' || fitType === 'no_fit' ? 100 : 0;

  return clampScore(rejectionPenalty + Math.min(20, notToClaimCount * 3) + keywordPenalty);
}

function buildSelectionReason(
  review: JsonRecord,
  score: ClusterSelectionScore,
  decision: SelectionDecision,
): string {
  if (decision === 'rejected') {
    return readString(review.reason) ?? 'Rejected by Product Fit review or risk policy.';
  }

  const parts = [
    `Product Fit ${score.productFit}/100`,
    `topic scope ${score.topicScopeAlignment}/100`,
    `proxy evidence ${score.competitorProxyDemandEvidence}/100`,
    `intent ${score.intentRelevance}/100`,
  ];
  const aiReason = readString(review.reason);
  return aiReason ? `${parts.join(', ')}. ${aiReason}` : parts.join(', ');
}

function compareSelectionCandidates(
  left: ClusterSelectionCandidate,
  right: ClusterSelectionCandidate,
): number {
  const order = { main: 0, supporting: 1, rejected: 2 } satisfies Record<SelectionDecision, number>;
  return order[left.decision] - order[right.decision] || right.priorityScore - left.priorityScore;
}

function toSelectedClusterJson(candidate: ClusterSelectionCandidate): SeoBriefJsonObject {
  return {
    clusterName: candidate.clusterName,
    primaryKeyword: candidate.primaryKeyword,
    productFitType: candidate.productFitType,
    productFitDecision: candidate.productFitDecision,
    priorityScore: candidate.priorityScore,
    reason: candidate.reason,
    scoreBreakdown: candidate.scoreBreakdown as unknown as SeoBriefJsonValue,
    productFitReview: candidate.productFitReview as unknown as SeoBriefJsonValue,
    sourceCluster: candidate.sourceCluster as unknown as SeoBriefJsonValue,
  };
}

function toSupportingClusterJson(candidate: ClusterSelectionCandidate): SeoBriefJsonObject {
  return {
    clusterName: candidate.clusterName,
    primaryKeyword: candidate.primaryKeyword,
    productFitType: candidate.productFitType,
    productFitDecision: candidate.productFitDecision,
    priorityScore: candidate.priorityScore,
    role: candidate.role ?? 'supporting article / internal link',
    reason: candidate.reason,
    scoreBreakdown: candidate.scoreBreakdown as unknown as SeoBriefJsonValue,
    sourceCluster: candidate.sourceCluster as unknown as SeoBriefJsonValue,
  };
}

function toRejectedClusterJson(candidate: ClusterSelectionCandidate): SeoBriefJsonObject {
  return {
    clusterName: candidate.clusterName,
    primaryKeyword: candidate.primaryKeyword,
    productFitType: candidate.productFitType,
    productFitDecision: candidate.productFitDecision,
    priorityScore: candidate.priorityScore,
    reason: candidate.reason,
    scoreBreakdown: candidate.scoreBreakdown as unknown as SeoBriefJsonValue,
  };
}

function toRankedClusterJson(candidate: ClusterSelectionCandidate): SeoBriefJsonObject {
  return {
    clusterName: candidate.clusterName,
    primaryKeyword: candidate.primaryKeyword,
    decision: candidate.decision,
    productFitType: candidate.productFitType,
    productFitDecision: candidate.productFitDecision,
    priorityScore: candidate.priorityScore,
    reason: candidate.reason,
    scoreBreakdown: candidate.scoreBreakdown as unknown as SeoBriefJsonValue,
  };
}

function toLegacySelectedClusterJson(candidate: ClusterSelectionCandidate): SeoBriefJsonObject {
  return {
    label: candidate.clusterName,
    intent: readString(candidate.sourceCluster.intent) ?? 'informational',
    primaryKeyword: candidate.primaryKeyword,
    representativeKeyword: candidate.primaryKeyword,
    keywords: readStringArray(candidate.sourceCluster.keywords),
    productScore: candidate.scoreBreakdown.productFit,
    finalScore: candidate.priorityScore,
    selectionReason: candidate.reason,
  };
}

function readSupportingItemDetails(sourceCluster: JsonRecord): JsonRecord[] {
  return readArray(sourceCluster.supportingItemDetails)
    .map(asObject)
    .filter((item): item is JsonRecord => item !== null);
}

function asObject(value: unknown): JsonRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, roundScore(value)));
}

function roundScore(value: number): number {
  return Math.round(value * 10) / 10;
}
