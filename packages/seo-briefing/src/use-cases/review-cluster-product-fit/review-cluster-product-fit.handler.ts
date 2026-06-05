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
  type ClusterKeywordCompetitorUrl,
  type ClusterProductFitReview,
  type ExtractUserPainScenariosResult,
  type ProductFitReviewClusterInput,
  type ProductFitReviewSupportingItemDetail,
  type SeoBriefAiKeywordIntent,
  type SeoBriefAiModelMode,
  type SeoBriefClusterSourceConfidence,
  SeoBriefAiPort,
} from '../../ports/seo-brief-ai.port.js';
import { ReviewClusterProductFitCommand } from './review-cluster-product-fit.command.js';

type ClusterRecord = Record<string, unknown>;

export interface ReviewClusterProductFitUseCaseResult {
  approvedCount: number;
  artifactType: 'cluster_product_fit_review';
  rejectedCount: number;
  reviewedClusterCount: number;
  runId: string;
  supportingOnlyCount: number;
}

@CommandHandler(ReviewClusterProductFitCommand)
export class ReviewClusterProductFitHandler
  implements ICommandHandler<ReviewClusterProductFitCommand, ReviewClusterProductFitUseCaseResult>
{
  constructor(
    @Inject(SeoBriefRunRepository)
    private readonly runRepository: SeoBriefRunRepository,
    @Inject(SeoBriefRunStepRepository)
    private readonly stepRepository: SeoBriefRunStepRepository,
    @Inject(SeoBriefArtifactRepository)
    private readonly artifactRepository: SeoBriefArtifactRepository,
    @Inject(SeoBriefAiPort)
    private readonly ai: SeoBriefAiPort,
  ) {}

  async execute(
    command: ReviewClusterProductFitCommand,
  ): Promise<ReviewClusterProductFitUseCaseResult> {
    const run = await this.runRepository.findById(command.runId as never);
    if (!run) {
      throw new SeoBriefRunNotFoundError(command.runId);
    }

    const artifacts = await this.artifactRepository.findByRunId(run.id);
    const clusterSnapshot = readLatestObjectArtifact(artifacts, 'cluster_snapshot');
    if (!clusterSnapshot) {
      throw new Error('Build intent clusters before Product Fit review');
    }

    const clusters = readClusterInputs(clusterSnapshot);
    if (clusters.length === 0) {
      throw new Error('Intent cluster snapshot does not contain clusters to review');
    }

    const step = SeoBriefRunStep.create({
      runId: run.id,
      stage: 'cluster_scoring',
      status: 'running',
      attemptNumber: nextAttemptNumber(artifacts, 'cluster_product_fit_review'),
    });
    await this.stepRepository.save(step);

    try {
      const aiResult = await this.ai.reviewClusterProductFit({
        runId: run.id,
        stepId: step.id,
        modelMode: readAiModelMode(artifacts),
        topicSeed: run.topicSeed,
        market: {
          country: run.country,
          language: run.language,
          locationName: run.country,
        },
        audience: run.audience,
        productName: run.productName,
        productDescription: run.productDescription,
        keyMessage: run.keyMessage,
        seoProductContext: readLatestObjectArtifact(artifacts, 'seo_product_context'),
        userPainScenarios: readUserPainScenarios(artifacts),
        brandMemorySnapshot: run.brandMemorySnapshot,
        clusters,
      });
      const normalized = normalizeProductFitReviews(clusters, aiResult.clusterProductFit);

      const payload: SeoBriefJsonObject = {
        artifactVersion: 'cluster_product_fit_review_v1',
        sourceArtifactType: 'cluster_snapshot',
        inputClusterCount: clusters.length,
        reviewedClusterCount: normalized.reviews.length,
        approvedCount: normalized.approvedCount,
        supportingOnlyCount: normalized.supportingOnlyCount,
        rejectedCount: normalized.rejectedCount,
        ignoredAiClusterReviewCount: normalized.ignoredAiClusterReviewCount,
        fallbackMissingReviewCount: normalized.fallbackMissingReviewCount,
        fitTypes: [
          'direct_solution',
          'alternative_solution',
          'workflow_bridge',
          'education_bridge',
          'no_fit',
        ],
        notes: [
          'This step reviews whole intent clusters, not individual keywords.',
          'High search volume or strong competitor evidence does not override weak Product Fit.',
          'Clusters marked supporting_only can support internal links but should not be selected as the main cluster without review.',
        ],
        clusterProductFit: normalized.reviews as unknown as SeoBriefJsonValue,
      };
      await this.artifactRepository.save(
        SeoBriefArtifact.create({
          runId: run.id,
          stage: 'cluster_scoring',
          artifactType: 'cluster_product_fit_review',
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
        artifactType: 'cluster_product_fit_review',
        reviewedClusterCount: normalized.reviews.length,
        approvedCount: normalized.approvedCount,
        supportingOnlyCount: normalized.supportingOnlyCount,
        rejectedCount: normalized.rejectedCount,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Cluster Product Fit review failed';
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

function readClusterInputs(payload: SeoBriefJsonObject): ProductFitReviewClusterInput[] {
  return Array.isArray(payload.clusters)
    ? payload.clusters
        .map(asObject)
        .filter((item): item is ClusterRecord => item !== null)
        .map(toProductFitReviewClusterInput)
        .filter((item) => item.clusterName && item.primaryKeywordCandidate)
    : [];
}

function toProductFitReviewClusterInput(cluster: ClusterRecord): ProductFitReviewClusterInput {
  const clusterName = readString(cluster.clusterName) ?? readString(cluster.label) ?? '';
  const primaryKeywordCandidate =
    readString(cluster.primaryKeywordCandidate) ?? readString(cluster.primaryKeyword) ?? '';
  const supportingItemDetails = readSupportingItemDetails(cluster.supportingItemDetails);
  const keywords = uniqueStrings([
    primaryKeywordCandidate,
    ...readStringArray(cluster.keywords),
    ...readStringArray(cluster.secondaryKeywords),
    ...readStringArray(cluster.questions),
    ...readStringArray(cluster.supportingItems),
    ...supportingItemDetails.map((item) => item.text),
  ]);

  return {
    clusterName,
    primaryKeywordCandidate,
    intent: readIntent(cluster.intent),
    userIntent: readString(cluster.userIntent),
    secondaryKeywords: readStringArray(cluster.secondaryKeywords),
    questions: readStringArray(cluster.questions),
    supportingItems: readStringArray(cluster.supportingItems),
    supportingItemDetails,
    keywords,
    competitorUrls: readCompetitorUrls(cluster.competitorUrls),
    sourceConfidence: readSourceConfidence(cluster.sourceConfidence),
    evidenceSummary: readString(cluster.evidenceSummary) ?? readString(cluster.rationale),
  };
}

function normalizeProductFitReviews(
  clusters: ProductFitReviewClusterInput[],
  reviews: ClusterProductFitReview[],
): {
  approvedCount: number;
  fallbackMissingReviewCount: number;
  ignoredAiClusterReviewCount: number;
  rejectedCount: number;
  reviews: SeoBriefJsonObject[];
  supportingOnlyCount: number;
} {
  const clusterByName = new Map(clusters.map((cluster) => [normalizeText(cluster.clusterName), cluster]));
  const reviewByClusterName = new Map<string, ClusterProductFitReview>();
  let ignoredAiClusterReviewCount = 0;

  for (const review of reviews) {
    const key = normalizeText(review.clusterName);
    if (!clusterByName.has(key)) {
      ignoredAiClusterReviewCount += 1;
      continue;
    }
    if (!reviewByClusterName.has(key)) {
      reviewByClusterName.set(key, review);
    }
  }

  let fallbackMissingReviewCount = 0;
  const normalizedReviews = clusters.map((cluster): SeoBriefJsonObject => {
    const review = reviewByClusterName.get(normalizeText(cluster.clusterName));
    if (!review) {
      fallbackMissingReviewCount += 1;
      return {
        ...fallbackProductFitReview(cluster),
        source: 'fallback_missing_ai_review',
        sourceCluster: toClusterJson(cluster),
      };
    }

    return {
      clusterName: cluster.clusterName,
      productFitScore: review.productFitScore,
      productFitType: review.productFitType,
      decision: review.decision,
      productInsertionAngle: review.productInsertionAngle,
      whereToInsert: review.whereToInsert,
      whatNotToClaim: review.whatNotToClaim,
      reason: review.reason,
      source: 'ai',
      sourceCluster: toClusterJson(cluster),
    };
  });

  return {
    reviews: normalizedReviews,
    approvedCount: normalizedReviews.filter((review) => review.decision === 'approve').length,
    supportingOnlyCount: normalizedReviews.filter((review) => review.decision === 'supporting_only')
      .length,
    rejectedCount: normalizedReviews.filter((review) => review.decision === 'reject').length,
    ignoredAiClusterReviewCount,
    fallbackMissingReviewCount,
  };
}

function fallbackProductFitReview(cluster: ProductFitReviewClusterInput): SeoBriefJsonObject {
  return {
    clusterName: cluster.clusterName,
    productFitScore: 0,
    productFitType: 'no_fit',
    decision: 'reject',
    productInsertionAngle: 'Manual review required before product insertion.',
    whereToInsert: 'Do not insert product until the cluster is reviewed.',
    whatNotToClaim: ['Do not make product claims for an unreviewed cluster.'],
    reason: 'AI did not return a Product Fit review for this cluster.',
  };
}

function toClusterJson(cluster: ProductFitReviewClusterInput): SeoBriefJsonObject {
  return {
    clusterName: cluster.clusterName,
    primaryKeywordCandidate: cluster.primaryKeywordCandidate,
    intent: cluster.intent,
    userIntent: cluster.userIntent ?? null,
    secondaryKeywords: cluster.secondaryKeywords,
    questions: cluster.questions,
    supportingItems: cluster.supportingItems,
    supportingItemDetails: cluster.supportingItemDetails as unknown as SeoBriefJsonValue,
    keywords: cluster.keywords,
    competitorUrls: cluster.competitorUrls.map(toCompetitorUrlJson),
    sourceConfidence: cluster.sourceConfidence ?? null,
    evidenceSummary: cluster.evidenceSummary ?? null,
  };
}

function toCompetitorUrlJson(url: ClusterKeywordCompetitorUrl): SeoBriefJsonObject {
  return {
    domain: url.domain,
    url: url.url,
    title: url.title ?? null,
    rankAbsolute: url.rankAbsolute ?? null,
  };
}

function readUserPainScenarios(
  artifacts: SeoBriefArtifact[],
): ExtractUserPainScenariosResult | null {
  const payload = readLatestObjectArtifact(artifacts, 'user_pain_scenarios');
  if (!payload) {
    return null;
  }

  return {
    topicHintInterpretation: readString(payload.topicHintInterpretation) ?? '',
    userPains: Array.isArray(payload.userPains) ? (payload.userPains as never) : [],
    userScenarios: Array.isArray(payload.userScenarios) ? (payload.userScenarios as never) : [],
    riskNotes: readStringArray(payload.riskNotes),
  };
}

function readAiModelMode(artifacts: SeoBriefArtifact[]): SeoBriefAiModelMode | null {
  const payload = readLatestObjectArtifact(artifacts, 'normalized_input');
  const mode = readString(payload?.aiModelMode);
  return mode === 'flash' || mode === 'pro' || mode === 'pro_thinking' ? mode : null;
}

function readCompetitorUrls(value: unknown): ClusterKeywordCompetitorUrl[] {
  return Array.isArray(value)
    ? value
        .map(asObject)
        .filter((item): item is ClusterRecord => item !== null)
        .map((item) => ({
          domain: readString(item.domain) ?? '',
          url: readString(item.url) ?? '',
          title: readString(item.title),
          rankAbsolute: readNumber(item.rankAbsolute),
        }))
        .filter((item) => item.domain && item.url)
        .slice(0, 12)
    : [];
}

function readSupportingItemDetails(value: unknown): ProductFitReviewSupportingItemDetail[] {
  return Array.isArray(value)
    ? value
        .map(asObject)
        .filter((item): item is ClusterRecord => item !== null)
        .map((item) => {
          const metrics = asObject(item.metrics);
          const sourceCandidate = asObject(item.sourceCandidate);

          return {
            text: readString(item.text) ?? '',
            originType: readString(item.originType),
            sources: readStringArray(item.sources),
            candidateScore: readNumber(item.candidateScore),
            metrics: {
              searchVolume: readNumber(metrics?.searchVolume),
              keywordDifficulty: readNumber(metrics?.keywordDifficulty),
              cpc: readNumber(metrics?.cpc),
              intent: readString(metrics?.intent),
              bestRankAbsolute: readNumber(metrics?.bestRankAbsolute),
              proxyDemandScore: readNumber(metrics?.proxyDemandScore),
              competitorMatchScore: readNumber(metrics?.competitorMatchScore),
              candidateScore: readNumber(metrics?.candidateScore),
            },
            whyInCluster: readString(item.whyInCluster),
            sourceCandidate: sourceCandidate as SeoBriefJsonObject | null,
          };
        })
        .filter((item) => item.text)
    : [];
}

function asObject(value: unknown): ClusterRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as ClusterRecord)
    : null;
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

function readIntent(value: unknown): SeoBriefAiKeywordIntent {
  return value === 'commercial' ||
    value === 'transactional' ||
    value === 'navigational' ||
    value === 'informational'
    ? value
    : 'informational';
}

function readSourceConfidence(value: unknown): SeoBriefClusterSourceConfidence | null {
  return value === 'low' || value === 'medium' || value === 'high' ? value : null;
}

function uniqueStrings(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    const normalized = normalizeText(item);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push(item.trim());
  }

  return result;
}

function normalizeText(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .replace(/[?!.\u3002\uff01\uff1f]+$/u, '')
    .trim()
    .toLowerCase();
}
