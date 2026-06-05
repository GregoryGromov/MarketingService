import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { SeoBriefArtifact } from '../../domain/seo-brief-artifact.entity.js';
import { SeoBriefArtifactRepository } from '../../domain/seo-brief-artifact.repository.js';
import { SeoBriefDocument } from '../../domain/seo-brief-document.entity.js';
import { SeoBriefDocumentRepository } from '../../domain/seo-brief-document.repository.js';
import { SeoBriefRunRepository } from '../../domain/seo-brief-run.repository.js';
import { SeoBriefRunStep } from '../../domain/seo-brief-run-step.entity.js';
import { SeoBriefRunStepRepository } from '../../domain/seo-brief-run-step.repository.js';
import type { SeoBriefJsonObject, SeoBriefJsonValue } from '../../domain/seo-briefing.types.js';
import { SeoBriefRunNotFoundError } from '../../errors/seo-brief-run-not-found.error.js';
import {
  SeoBriefAiPort,
  type BuildProductBridgeResult,
  type SeoBriefAiKeywordIntent,
  type SeoBriefAiModelMode,
} from '../../ports/seo-brief-ai.port.js';
import { GenerateFinalSeoBriefCommand } from './generate-final-seo-brief.command.js';

type JsonRecord = Record<string, unknown>;

const FINAL_BRIEF_ACCEPTED_KEYWORD_LIMIT = 24;
const FINAL_BRIEF_MAYBE_KEYWORD_LIMIT = 8;
const FINAL_BRIEF_SUPPORTING_CLUSTER_LIMIT = 5;
const FINAL_BRIEF_BUCKET_LIMIT = 8;
const FINAL_BRIEF_PRODUCT_FIT_CLUSTER_LIMIT = 8;

export interface GenerateFinalSeoBriefUseCaseResult {
  artifactType: 'final_brief_snapshot';
  documentId: string;
  faqCount: number;
  outlineSectionCount: number;
  primaryKeyword: string;
  runId: string;
  title: string;
}

@CommandHandler(GenerateFinalSeoBriefCommand)
export class GenerateFinalSeoBriefHandler
  implements ICommandHandler<GenerateFinalSeoBriefCommand, GenerateFinalSeoBriefUseCaseResult>
{
  constructor(
    @Inject(SeoBriefRunRepository)
    private readonly runRepository: SeoBriefRunRepository,
    @Inject(SeoBriefRunStepRepository)
    private readonly stepRepository: SeoBriefRunStepRepository,
    @Inject(SeoBriefArtifactRepository)
    private readonly artifactRepository: SeoBriefArtifactRepository,
    @Inject(SeoBriefDocumentRepository)
    private readonly documentRepository: SeoBriefDocumentRepository,
    @Inject(SeoBriefAiPort)
    private readonly ai: SeoBriefAiPort,
  ) {}

  async execute(command: GenerateFinalSeoBriefCommand): Promise<GenerateFinalSeoBriefUseCaseResult> {
    const run = await this.runRepository.findById(command.runId as never);
    if (!run) {
      throw new SeoBriefRunNotFoundError(command.runId);
    }

    const artifacts = await this.artifactRepository.findByRunId(run.id);
    const clusterSelection = readLatestObjectArtifact(artifacts, 'cluster_selection_snapshot');
    if (!clusterSelection) {
      throw new Error('Select main SEO brief cluster before generating final brief');
    }

    const onPageSynthesis = readLatestObjectArtifact(artifacts, 'onpage_synthesis_snapshot');
    if (!onPageSynthesis) {
      throw new Error('Synthesize OnPage evidence before generating final brief');
    }

    const mainCluster = readMainCluster(clusterSelection);
    if (!mainCluster.primaryKeyword || !mainCluster.clusterName) {
      throw new Error('Cluster selection does not contain a usable main cluster');
    }

    const step = SeoBriefRunStep.create({
      runId: run.id,
      stage: 'brief_generation',
      status: 'running',
      attemptNumber: nextAttemptNumber(artifacts, 'final_brief_snapshot'),
    });
    await this.stepRepository.save(step);

    try {
      const productBridge = buildProductBridgeFromEvidence(
        mainCluster,
        onPageSynthesis,
        run.cta,
      );
      const supportingClusters = readSupportingClusters(clusterSelection);
      const finalClusterSelection = buildFinalClusterSelectionContext(
        clusterSelection,
        mainCluster,
        supportingClusters,
      );
      const keywordCandidateScoring = buildFinalKeywordCandidateScoringContext(
        readLatestObjectArtifact(artifacts, 'keyword_candidate_scoring'),
      );
      const productFitReview = buildFinalProductFitReviewContext(
        readLatestObjectArtifact(artifacts, 'cluster_product_fit_review'),
        mainCluster.clusterName,
      );
      const competitorKeywordEvidence = buildCompetitorKeywordEvidence(artifacts);
      const serpEnrichmentContext = buildSerpEnrichmentContext(artifacts);
      const onPageSynthesisForPrompt = buildFinalOnPageSynthesisContext(onPageSynthesis);
      const seoProductContext = buildFinalSeoProductContext(
        readLatestObjectArtifact(artifacts, 'seo_product_context'),
      );

      const brief = await this.ai.generateSeoBrief({
        runId: run.id,
        stepId: step.id,
        modelMode: readAiModelMode(artifacts),
        topicHint: run.topicSeed,
        primaryKeyword: mainCluster.primaryKeyword,
        clusterLabel: mainCluster.clusterName,
        intent: mainCluster.intent,
        audience: run.audience,
        productName: run.productName,
        productDescription: run.productDescription,
        market: {
          country: run.country,
          language: run.language,
          locationName: run.country,
        },
        productBridge,
        constraints: buildConstraints(run.brandMemorySnapshot, run.keyMessage),
        brandMemorySnapshot: run.brandMemorySnapshot,
        clusterSelection: finalClusterSelection,
        supportingClusters,
        onPageSynthesis: onPageSynthesisForPrompt,
        keywordCandidateScoring,
        productFitReview,
        competitorKeywordEvidence,
        serpEnrichmentContext,
        seoProductContext,
      });

      const selectedClusterPayload = finalClusterSelection as SeoBriefJsonValue;
      const rejectedClustersPayload = readObjectArray(clusterSelection.rejectedClusters) as unknown as SeoBriefJsonValue;
      const briefPayload = buildFinalBriefPayload({
        brief,
        topicHint: run.topicSeed,
        mainCluster,
        supportingClusters,
        fallbackSecondaryKeywords: mainCluster.secondaryKeywords,
        fallbackCta: run.cta ?? productBridge.cta,
      });
      const evidencePack: SeoBriefJsonObject = {
        artifactVersion: 'final_brief_evidence_pack_v2',
        topicHint: run.topicSeed,
        market: {
          country: run.country,
          language: run.language,
        },
        selectedCluster: selectedClusterPayload,
        onPageSynthesis: onPageSynthesisForPrompt,
        keywordCandidateScoring,
        productFitReview,
        competitorKeywordEvidence,
        serpEnrichmentContext,
      };

      const document = SeoBriefDocument.create({
        runId: run.id,
        selectedClusterPayload,
        briefPayload,
        rejectedClustersPayload,
      });
      await this.documentRepository.save(document);

      await this.artifactRepository.save(
        SeoBriefArtifact.create({
          runId: run.id,
          stage: 'brief_generation',
          artifactType: 'final_brief_snapshot',
          payload: {
            artifactVersion: 'final_seo_brief_v2',
            brief: briefPayload,
            selectedCluster: selectedClusterPayload,
            rejectedClusters: rejectedClustersPayload,
          },
          attempt: step.attemptNumber,
        }),
      );
      await this.artifactRepository.save(
        SeoBriefArtifact.create({
          runId: run.id,
          stage: 'brief_generation',
          artifactType: 'evidence_pack_snapshot',
          payload: evidencePack,
          attempt: step.attemptNumber,
        }),
      );

      step.complete();
      run.complete();
      await this.stepRepository.save(step);
      await this.runRepository.save(run);

      return {
        runId: run.id,
        artifactType: 'final_brief_snapshot',
        documentId: document.id,
        title: readString(briefPayload.recommendedTitle) ?? readString(briefPayload.title) ?? '',
        primaryKeyword: readString(briefPayload.primaryKeyword) ?? mainCluster.primaryKeyword,
        outlineSectionCount: readObjectArray(briefPayload.outline).length,
        faqCount: readObjectArray(briefPayload.faq).length,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Final SEO brief generation failed';
      step.fail(message);
      run.fail(message);
      await this.stepRepository.save(step);
      await this.runRepository.save(run);
      throw error;
    }
  }
}

interface MainClusterContext {
  clusterName: string;
  intent: SeoBriefAiKeywordIntent;
  primaryKeyword: string;
  secondaryKeywords: string[];
  productFitType: string | null;
  productFitDecision: string | null;
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

function readMainCluster(selection: SeoBriefJsonObject): MainClusterContext {
  const main =
    asObject(selection.mainCluster) ??
    readObjectArray(selection.supportingClusters)[0] ??
    {};
  const sourceCluster = asObject(main.sourceCluster) ?? {};
  const primaryKeyword =
    readString(main.primaryKeyword) ??
    readString(sourceCluster.primaryKeywordCandidate) ??
    readString(sourceCluster.primaryKeyword) ??
    '';
  const clusterName =
    readString(main.clusterName) ?? readString(sourceCluster.clusterName) ?? readString(sourceCluster.label) ?? '';

  return {
    clusterName,
    primaryKeyword,
    intent: readIntent(sourceCluster.intent),
    productFitType: readString(main.productFitType),
    productFitDecision: readString(main.productFitDecision),
    secondaryKeywords: uniqueStrings([
      ...readStringArray(sourceCluster.secondaryKeywords),
      ...readStringArray(sourceCluster.keywords),
      ...readStringArray(sourceCluster.questions),
      ...readStringArray(sourceCluster.supportingItems),
    ]).filter((item) => item.toLowerCase() !== primaryKeyword.toLowerCase()).slice(0, 20),
  };
}

function readSupportingClusters(selection: SeoBriefJsonObject): SeoBriefJsonObject[] {
  return readObjectArray(selection.supportingClusters).map((cluster) => {
    const sourceCluster = asObject(cluster.sourceCluster) ?? {};
    return {
      clusterName: readString(cluster.clusterName) ?? readString(sourceCluster.clusterName),
      primaryKeyword:
        readString(cluster.primaryKeyword) ??
        readString(sourceCluster.primaryKeywordCandidate) ??
        readString(sourceCluster.primaryKeyword),
      role: readString(cluster.role),
      reason: readString(cluster.reason),
      keywords: uniqueStrings([
        ...readStringArray(sourceCluster.secondaryKeywords),
        ...readStringArray(sourceCluster.keywords),
        ...readStringArray(sourceCluster.questions),
        ...readStringArray(sourceCluster.supportingItems),
      ]).slice(0, 10) as unknown as SeoBriefJsonValue,
    };
  });
}

function buildProductBridgeFromEvidence(
  mainCluster: MainClusterContext,
  onPageSynthesis: SeoBriefJsonObject,
  cta: string | null,
): BuildProductBridgeResult {
  const insertion = asObject(onPageSynthesis.productInsertion) ?? {};
  const risks = [
    ...readStringArray(insertion.avoid),
    ...readStringArray(onPageSynthesis.riskAndComplianceNotes),
  ];

  return {
    fit: mainCluster.productFitDecision === 'approve' ? 'strong' : 'moderate',
    summary: readString(insertion.angle) ?? 'Insert product only where it naturally helps the user.',
    positioningAngle:
      readString(insertion.angle) ?? readString(insertion.section) ?? 'Education-first product bridge',
    cta: cta ?? 'Learn how Reinforce works',
    talkingPoints: readStringArray(insertion.do),
    risks,
  };
}

function buildFinalBriefPayload(input: {
  brief: {
    angle: string;
    competitorGapsToFill?: string[];
    contentType?: string;
    cta?: string;
    externalSourcesNeeded?: string[];
    faq: Array<{ answer: string; answerDirection?: string; question: string }>;
    internalLinks?: string[];
    mainCluster?: string;
    metaDescription: string;
    metaTitle: string;
    outline: Array<{
      h2?: string;
      h3?: string[];
      heading: string;
      keyPoints: string[];
      notes?: string;
      purpose: string;
    }>;
    primaryKeyword?: string;
    productInsertion?: { avoid: string[]; how: string; sampleAngle: string; where: string };
    productPlacement: {
      cta: string;
      sections: string[];
      summary: string;
    };
    recommendedH1?: string;
    recommendedMetaDescription?: string;
    recommendedMetaTitle?: string;
    recommendedTitle?: string;
    riskNotes?: string[];
    searchIntent?: string;
    secondaryKeywords?: string[];
    supportingClusters?: string[];
    targetReader?: string;
    title: string;
    topicHint?: string;
  };
  fallbackCta: string;
  fallbackSecondaryKeywords: string[];
  mainCluster: MainClusterContext;
  supportingClusters: SeoBriefJsonObject[];
  topicHint: string;
}): SeoBriefJsonObject {
  return {
    topicHint: input.brief.topicHint ?? input.topicHint,
    mainCluster: input.brief.mainCluster ?? input.mainCluster.clusterName,
    supportingClusters:
      input.brief.supportingClusters ??
      input.supportingClusters
        .map((cluster) => readString(cluster.clusterName))
        .filter((item): item is string => item !== null),
    primaryKeyword: input.brief.primaryKeyword ?? input.mainCluster.primaryKeyword,
    secondaryKeywords: uniqueStrings([
      ...(input.brief.secondaryKeywords ?? []),
      ...input.fallbackSecondaryKeywords,
    ]),
    searchIntent: input.brief.searchIntent ?? input.brief.angle,
    targetReader: input.brief.targetReader ?? '',
    contentType: input.brief.contentType ?? 'educational guide',
    recommendedTitle: input.brief.recommendedTitle ?? input.brief.title,
    recommendedH1: input.brief.recommendedH1 ?? input.brief.title,
    recommendedMetaTitle: input.brief.recommendedMetaTitle ?? input.brief.metaTitle,
    recommendedMetaDescription: input.brief.recommendedMetaDescription ?? input.brief.metaDescription,
    outline: input.brief.outline.map((section) => ({
      h2: section.h2 ?? section.heading,
      h3: section.h3 ?? section.keyPoints,
      notes: section.notes ?? section.purpose,
    })) as unknown as SeoBriefJsonValue,
    faq: input.brief.faq.map((item) => ({
      question: item.question,
      answerDirection: item.answerDirection ?? item.answer,
    })) as unknown as SeoBriefJsonValue,
    productInsertion: (input.brief.productInsertion ?? {
      where: input.brief.productPlacement.sections[0] ?? 'Conclusion',
      how: input.brief.productPlacement.summary,
      sampleAngle: input.brief.productPlacement.summary,
      avoid: [],
    }) as unknown as SeoBriefJsonValue,
    competitorGapsToFill: (input.brief.competitorGapsToFill ?? []) as unknown as SeoBriefJsonValue,
    riskNotes: (input.brief.riskNotes ?? []) as unknown as SeoBriefJsonValue,
    cta: input.brief.cta ?? input.fallbackCta,
    internalLinks: (input.brief.internalLinks ?? []) as unknown as SeoBriefJsonValue,
    externalSourcesNeeded: (input.brief.externalSourcesNeeded ?? []) as unknown as SeoBriefJsonValue,
    legacy: {
      title: input.brief.title,
      metaTitle: input.brief.metaTitle,
      metaDescription: input.brief.metaDescription,
      angle: input.brief.angle,
      outline: input.brief.outline as unknown as SeoBriefJsonValue,
      faq: input.brief.faq as unknown as SeoBriefJsonValue,
      productPlacement: input.brief.productPlacement as unknown as SeoBriefJsonValue,
    },
  };
}

function buildConstraints(
  brandMemorySnapshot: { bannedPhrases: string[]; forbiddenClaims: string[]; requiredPhrases: string[] },
  keyMessage: string | null,
): string[] {
  return uniqueStrings([
    keyMessage,
    ...brandMemorySnapshot.forbiddenClaims.map((item) => `Do not claim: ${item}`),
    ...brandMemorySnapshot.bannedPhrases.map((item) => `Avoid phrase: ${item}`),
    ...brandMemorySnapshot.requiredPhrases.map((item) => `Required phrase/context: ${item}`),
  ]);
}

function buildFinalClusterSelectionContext(
  selection: SeoBriefJsonObject,
  mainCluster: MainClusterContext,
  supportingClusters: SeoBriefJsonObject[],
): SeoBriefJsonObject {
  const rawMainCluster = asObject(selection.mainCluster);

  return {
    artifactVersion: selection.artifactVersion ?? null,
    mainCluster: {
      clusterName: mainCluster.clusterName,
      primaryKeyword: mainCluster.primaryKeyword,
      intent: mainCluster.intent,
      productFitType: mainCluster.productFitType,
      productFitDecision: mainCluster.productFitDecision,
      reason: readString(rawMainCluster?.reason),
      secondaryKeywords: mainCluster.secondaryKeywords.slice(0, 12),
    } as unknown as SeoBriefJsonValue,
    supportingClusters: supportingClusters
      .slice(0, FINAL_BRIEF_SUPPORTING_CLUSTER_LIMIT)
      .map((cluster) => ({
        clusterName: readString(cluster.clusterName),
        primaryKeyword: readString(cluster.primaryKeyword),
        role: readString(cluster.role),
        reason: readString(cluster.reason),
        keywords: readStringArray(cluster.keywords).slice(0, 8),
      })) as unknown as SeoBriefJsonValue,
    counts: {
      supportingClusterCount: readObjectArray(selection.supportingClusters).length,
      rejectedClusterCount: readObjectArray(selection.rejectedClusters).length,
    } as unknown as SeoBriefJsonValue,
  };
}

function buildFinalOnPageSynthesisContext(payload: SeoBriefJsonObject): SeoBriefJsonObject {
  return {
    artifactVersion: payload.artifactVersion ?? null,
    competitorStructureSummary: compactJson(payload.competitorStructureSummary, {
      maxArrayItems: 8,
      maxDepth: 4,
    }),
    recommendedArticleStructure: compactJson(payload.recommendedArticleStructure, {
      maxArrayItems: 10,
      maxDepth: 4,
    }),
    productInsertion: compactJson(payload.productInsertion, { maxArrayItems: 8, maxDepth: 3 }),
    riskAndComplianceNotes: compactJson(payload.riskAndComplianceNotes, {
      maxArrayItems: 8,
      maxDepth: 2,
    }),
  };
}

function buildFinalKeywordCandidateScoringContext(
  payload: SeoBriefJsonObject | null,
): SeoBriefJsonObject | null {
  if (!payload) {
    return null;
  }

  const stagedFiltering = asObject(payload.stagedFiltering);

  return {
    artifactVersion: payload.artifactVersion ?? null,
    filteringMode: readString(payload.filteringMode),
    summary: compactJson(payload.summary, { maxArrayItems: 5, maxDepth: 3 }),
    counts: {
      inputCandidateCount: readNumber(payload.inputCandidateCount),
      acceptedCount: readNumber(payload.acceptedCount),
      maybeCount: readNumber(payload.maybeCount),
      rejectedCount: readNumber(payload.rejectedCount),
      hardExcludedCandidateCount: readNumber(payload.hardExcludedCandidateCount),
    } as unknown as SeoBriefJsonValue,
    buckets: readObjectArray(stagedFiltering?.buckets)
      .slice(0, FINAL_BRIEF_BUCKET_LIMIT)
      .map(compactBucketSummary) as unknown as SeoBriefJsonValue,
    accepted: readObjectArray(payload.accepted)
      .slice(0, FINAL_BRIEF_ACCEPTED_KEYWORD_LIMIT)
      .map(compactCandidateForFinalBrief) as unknown as SeoBriefJsonValue,
    maybe: readObjectArray(payload.maybe)
      .slice(0, FINAL_BRIEF_MAYBE_KEYWORD_LIMIT)
      .map(compactCandidateForFinalBrief) as unknown as SeoBriefJsonValue,
  };
}

function buildFinalProductFitReviewContext(
  payload: SeoBriefJsonObject | null,
  selectedClusterName: string,
): SeoBriefJsonObject | null {
  if (!payload) {
    return null;
  }

  const reviews = readObjectArray(payload.clusterProductFit);
  const selectedReview =
    reviews.find((review) => normalizeText(readString(review.clusterName) ?? '') === normalizeText(selectedClusterName)) ??
    null;

  return {
    artifactVersion: payload.artifactVersion ?? null,
    counts: {
      inputClusterCount: readNumber(payload.inputClusterCount),
      reviewedClusterCount: readNumber(payload.reviewedClusterCount),
      approvedCount: readNumber(payload.approvedCount),
      supportingOnlyCount: readNumber(payload.supportingOnlyCount),
      rejectedCount: readNumber(payload.rejectedCount),
    } as unknown as SeoBriefJsonValue,
    selectedClusterReview: selectedReview
      ? compactProductFitReview(selectedReview)
      : null,
    approvedOrSupportingClusters: reviews
      .filter((review) => readString(review.decision) !== 'reject')
      .slice(0, FINAL_BRIEF_PRODUCT_FIT_CLUSTER_LIMIT)
      .map(compactProductFitReview) as unknown as SeoBriefJsonValue,
  };
}

function buildFinalSeoProductContext(payload: SeoBriefJsonObject | null): SeoBriefJsonObject | null {
  return payload ? (compactJson(payload, { maxArrayItems: 8, maxDepth: 4 }) as SeoBriefJsonObject) : null;
}

function compactBucketSummary(bucket: JsonRecord): SeoBriefJsonObject {
  return {
    bucket: readString(bucket.bucket),
    label: readString(bucket.label),
    description: readString(bucket.description),
    inputCount: readNumber(bucket.inputCount),
    acceptedCount: readNumber(bucket.acceptedCount),
    maybeCount: readNumber(bucket.maybeCount),
    rejectedCount: readNumber(bucket.rejectedCount),
    topCandidates: readObjectArray(bucket.topCandidates)
      .slice(0, 4)
      .map((candidate) => ({
        keyword: readString(candidate.keyword),
        status: readString(candidate.status),
        totalScore: readNumber(candidate.totalScore),
        productFit: readString(candidate.productFit),
        insertionType: readString(candidate.insertionType),
      })) as unknown as SeoBriefJsonValue,
  };
}

function compactCandidateForFinalBrief(candidate: JsonRecord): SeoBriefJsonObject {
  return {
    keyword: readString(candidate.keyword) ?? readString(candidate.text),
    status: readString(candidate.status),
    bucket: readString(candidate.bucket),
    bucketLabel: readString(candidate.bucketLabel),
    productFitLabel: readString(candidate.productFitLabel),
    insertionType: readString(candidate.insertionType),
    sourceRole: readString(candidate.sourceRole),
    totalScore: readNumber(candidate.totalScore),
    intent: readString(candidate.intent),
    stage: readString(candidate.stage),
    scores: compactJson(candidate.scores, { maxArrayItems: 6, maxDepth: 2 }),
    reasons: readStringArray(candidate.reasons).slice(0, 2),
    riskFlags: readStringArray(candidate.riskFlags).slice(0, 4),
    evidenceNotes: readStringArray(candidate.evidenceNotes).slice(0, 2),
  };
}

function compactProductFitReview(review: JsonRecord): SeoBriefJsonObject {
  return {
    clusterName: readString(review.clusterName),
    productFitScore: readNumber(review.productFitScore),
    productFitType: readString(review.productFitType),
    decision: readString(review.decision),
    productInsertionAngle: readString(review.productInsertionAngle),
    whereToInsert: readString(review.whereToInsert),
    whatNotToClaim: readStringArray(review.whatNotToClaim).slice(0, 6),
    reason: readString(review.reason),
    source: readString(review.source),
  };
}

function buildSerpEnrichmentContext(artifacts: SeoBriefArtifact[]): SeoBriefJsonObject | null {
  const candidates = readLatestObjectArtifact(artifacts, 'keyword_serp_derived_keywords');
  const related = readLatestObjectArtifact(artifacts, 'keyword_related_query_selections');
  if (!candidates && !related) {
    return null;
  }

  return {
    derivedCandidates: compactJson(candidates, { maxArrayItems: 8, maxDepth: 3 }),
    selectedRelatedQueries: compactJson(related, { maxArrayItems: 8, maxDepth: 3 }),
  };
}

function buildCompetitorKeywordEvidence(artifacts: SeoBriefArtifact[]): SeoBriefJsonObject | null {
  const matches = readLatestObjectArtifact(artifacts, 'competitor_keyword_matches');
  const keywordMap = readLatestObjectArtifact(artifacts, 'competitor_keyword_map');
  if (!matches && !keywordMap) {
    return null;
  }

  return {
    competitorKeywordMatches: compactJson(matches, { maxArrayItems: 10, maxDepth: 4 }),
    competitorKeywordMap: compactJson(keywordMap, { maxArrayItems: 8, maxDepth: 3 }),
  };
}

function compactJson(
  value: unknown,
  options: { maxArrayItems: number; maxDepth: number },
  depth = 0,
): SeoBriefJsonValue {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'string') {
    return value.length > 700 ? `${value.slice(0, 700)}...` : value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (Array.isArray(value)) {
    if (depth >= options.maxDepth) {
      return [`[truncated ${value.length} items]`];
    }
    return value
      .slice(0, options.maxArrayItems)
      .map((item) => compactJson(item, options, depth + 1)) as SeoBriefJsonValue;
  }
  if (typeof value === 'object') {
    if (depth >= options.maxDepth) {
      return '[truncated object]';
    }
    const output: SeoBriefJsonObject = {};
    for (const [key, item] of Object.entries(value)) {
      if (
        [
          'rawResponse',
          'rawResponses',
          'rawPayload',
          'sourceCandidate',
          'sourceCluster',
          'supportingItemDetails',
          'pages',
          'markdown',
          'markdownPreview',
        ].includes(key)
      ) {
        continue;
      }
      output[key] = compactJson(item, options, depth + 1);
    }
    return output;
  }

  return null;
}

function readAiModelMode(artifacts: SeoBriefArtifact[]): SeoBriefAiModelMode | null {
  const payload = readLatestObjectArtifact(artifacts, 'normalized_input');
  const mode = readString(payload?.aiModelMode);
  return mode === 'flash' || mode === 'pro' || mode === 'pro_thinking' ? mode : null;
}

function readObjectArray(value: unknown): JsonRecord[] {
  return Array.isArray(value)
    ? value.map(asObject).filter((item): item is JsonRecord => item !== null)
    : [];
}

function asObject(value: unknown): JsonRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as JsonRecord)
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

function uniqueStrings(items: (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    const normalized = item?.trim();
    const key = normalized?.toLowerCase();
    if (!normalized || !key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(normalized);
  }
  return result;
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}
