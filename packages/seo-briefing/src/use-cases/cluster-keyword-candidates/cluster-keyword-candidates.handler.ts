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
  type ClusterKeywordCandidateInput,
  type ExtractUserPainScenariosResult,
  type SeoBriefAiModelMode,
  SeoBriefAiPort,
  type SeoKeywordCluster,
} from '../../ports/seo-brief-ai.port.js';
import { readPromptInstructionOverridesFromArtifacts } from '../seo-brief-prompt-instruction-overrides.js';
import { readRequestTimeoutMsFromArtifacts } from '../seo-brief-request-timeout.js';
import { ClusterKeywordCandidatesCommand } from './cluster-keyword-candidates.command.js';

type CandidateRecord = Record<string, unknown>;

export interface ClusterKeywordCandidatesResult {
  artifactType: 'cluster_snapshot';
  clusterCount: number;
  inputCandidateCount: number;
  runId: string;
}

@CommandHandler(ClusterKeywordCandidatesCommand)
export class ClusterKeywordCandidatesHandler
  implements ICommandHandler<ClusterKeywordCandidatesCommand, ClusterKeywordCandidatesResult>
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

  async execute(command: ClusterKeywordCandidatesCommand): Promise<ClusterKeywordCandidatesResult> {
    const run = await this.runRepository.findById(command.runId as never);
    if (!run) {
      throw new SeoBriefRunNotFoundError(command.runId);
    }

    const artifacts = await this.artifactRepository.findByRunId(run.id);
    const scoring = readLatestObjectArtifact(artifacts, 'keyword_candidate_scoring');
    const dirtyPool = scoring ? null : readLatestObjectArtifact(artifacts, 'dirty_keyword_pool');
    if (!scoring && !dirtyPool) {
      throw new Error('Build dirty keyword pool before clustering');
    }
    const candidateSource = scoring ?? dirtyPool;
    if (!candidateSource) {
      throw new Error('Build dirty keyword pool before clustering');
    }

    const accepted = scoring
      ? readCandidateBucket(scoring, 'accepted')
      : readCandidateBucket(candidateSource, 'candidates');
    const maybe = scoring ? readCandidateBucket(scoring, 'maybe') : [];
    const rejected = scoring ? readCandidateBucket(scoring, 'rejected') : [];
    const sourceArtifactType = scoring ? 'keyword_candidate_scoring' : 'dirty_keyword_pool';
    const viableCandidates = [...accepted, ...maybe];
    if (viableCandidates.length === 0) {
      throw new Error('Dirty keyword pool does not contain viable candidates to cluster');
    }

    const step = SeoBriefRunStep.create({
      runId: run.id,
      stage: 'clustering',
      status: 'running',
      attemptNumber: nextAttemptNumber(artifacts, 'cluster_snapshot'),
    });
    await this.stepRepository.save(step);

    try {
      const candidateInputs = viableCandidates.map(toClusterCandidateInput);
      const result = await this.ai.clusterKeywords({
        runId: run.id,
        stepId: step.id,
        modelMode: readAiModelMode(artifacts),
        timeoutMs: readRequestTimeoutMsFromArtifacts(artifacts),
        promptInstructionOverrides: readPromptInstructionOverridesFromArtifacts(artifacts),
        topicSeed: run.topicSeed,
        market: {
          country: run.country,
          language: run.language,
          locationName: run.country,
        },
        audience: run.audience,
        productName: run.productName,
        productDescription: run.productDescription,
        seoProductContext: readLatestObjectArtifact(artifacts, 'seo_product_context'),
        userPainScenarios: readUserPainScenarios(artifacts),
        brandMemorySnapshot: run.brandMemorySnapshot,
        keywords: candidateInputs.map((candidate) => candidate.keyword),
        candidates: candidateInputs,
        rejectedKeywords: [],
      });

      const clusters = normalizeClusters(result.clusters, viableCandidates);
      if (clusters.length === 0) {
        throw new Error('AI did not return any usable intent clusters');
      }

      const payload: SeoBriefJsonObject = {
        artifactVersion: 'keyword_intent_clusters_v1',
        sourceArtifactType,
        inputCandidateCount: viableCandidates.length,
        acceptedCandidateCount: accepted.length,
        maybeCandidateCount: maybe.length,
        excludedRejectedCandidateCount: rejected.length,
        clusterCount: clusters.length,
        notes: [
          'Clusters are grouped by user intent, not exact word overlap.',
          scoring
            ? 'All accepted and maybe candidates are sent to clustering; rejected candidates are excluded.'
            : 'Dirty-pool candidates are sent directly to clustering; AI prioritization happens inside clustering and Product Fit.',
          scoring
            ? 'Rejected candidates were excluded from clustering.'
            : 'The separate AI candidate filtering step is bypassed for the current flow.',
          scoring
            ? 'Maybe candidates can appear as secondary keywords, questions, or supporting items.'
            : 'SERP-derived evidence and source diversity metrics are preserved on each candidate.',
        ],
        clusters: clusters as unknown as SeoBriefJsonValue,
      };
      await this.artifactRepository.save(
        SeoBriefArtifact.create({
          runId: run.id,
          stage: 'clustering',
          artifactType: 'cluster_snapshot',
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
        artifactType: 'cluster_snapshot',
        inputCandidateCount: viableCandidates.length,
        clusterCount: clusters.length,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Keyword clustering failed';
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
  return artifact?.payload &&
    typeof artifact.payload === 'object' &&
    !Array.isArray(artifact.payload)
    ? (artifact.payload as SeoBriefJsonObject)
    : null;
}

function readCandidateBucket(payload: SeoBriefJsonObject, bucket: string): CandidateRecord[] {
  return Array.isArray(payload[bucket])
    ? payload[bucket].map(asObject).filter((item): item is CandidateRecord => item !== null)
    : [];
}

function toClusterCandidateInput(candidate: CandidateRecord): ClusterKeywordCandidateInput {
  const sourceCandidate = asObject(candidate.sourceCandidate);
  const sourceMetrics = asObject(sourceCandidate?.metrics);
  const metrics = asObject(candidate.metrics) ?? sourceMetrics;
  const keyword =
    readString(candidate.keyword) ??
    readString(candidate.text) ??
    readString(sourceCandidate?.text) ??
    '';

  return {
    keyword,
    status: readString(candidate.status) === 'maybe' ? 'maybe' : 'accepted',
    totalScore: readNumber(candidate.totalScore) ?? 0,
    scores: readScoreBreakdown(candidate.scores),
    fit: readFitBreakdown(candidate.fit),
    intent: readIntent(candidate.intent ?? metrics?.intent),
    stage: readStage(candidate.stage),
    reasons: readStringArray(candidate.reasons),
    riskFlags: readStringArray(candidate.riskFlags),
    evidenceNotes: readStringArray(candidate.evidenceNotes),
    sources: readStringArray(candidate.sources).length
      ? readStringArray(candidate.sources)
      : readStringArray(sourceCandidate?.sources),
    metrics: {
      searchVolume: readNumber(metrics?.searchVolume),
      keywordDifficulty: readNumber(metrics?.keywordDifficulty),
      cpc: readNumber(metrics?.cpc),
      intent: readString(metrics?.intent),
      bestRankAbsolute: readNumber(metrics?.bestRankAbsolute),
      proxyDemandScore: readNumber(metrics?.proxyDemandScore),
      competitorMatchScore: readNumber(metrics?.competitorMatchScore),
      candidateScore: readNumber(metrics?.candidateScore),
      sourceHypothesisSerpDomainConcentrationLabel: readString(
        metrics?.sourceHypothesisSerpDomainConcentrationLabel,
      ),
      sourceHypothesisSerpDomainHhi: readNumber(metrics?.sourceHypothesisSerpDomainHhi),
      sourceHypothesisSerpDominantDomain: readString(metrics?.sourceHypothesisSerpDominantDomain),
      sourceHypothesisSerpDominantDomainShare: readNumber(
        metrics?.sourceHypothesisSerpDominantDomainShare,
      ),
      sourceHypothesisSerpResultCount: readNumber(metrics?.sourceHypothesisSerpResultCount),
      sourceHypothesisSerpUniqueDomainCount: readNumber(
        metrics?.sourceHypothesisSerpUniqueDomainCount,
      ),
    },
    competitorUrls: readCompetitorUrls(sourceCandidate ?? candidate),
  };
}

function normalizeClusters(
  clusters: SeoKeywordCluster[],
  sourceCandidates: CandidateRecord[],
): SeoBriefJsonObject[] {
  const sourceByKeyword = new Map(
    sourceCandidates.map((candidate) => {
      const key = normalizeKeywordText(
        readString(candidate.keyword) ??
          readString(candidate.text) ??
          readString(asObject(candidate.sourceCandidate)?.text) ??
          '',
      );
      return [key, candidate] as const;
    }),
  );

  const normalizedClusters: SeoBriefJsonObject[] = [];
  for (const cluster of clusters) {
    const keywords = uniqueStrings([
      cluster.primaryKeyword,
      ...(cluster.secondaryKeywords ?? []),
      ...(cluster.keywords ?? []),
      ...(cluster.questions ?? []),
      ...(cluster.supportingItems ?? []),
    ]).filter((keyword) => sourceByKeyword.has(normalizeKeywordText(keyword)));
    if (keywords.length === 0) {
      continue;
    }

    const primaryKeyword = sourceByKeyword.has(normalizeKeywordText(cluster.primaryKeyword))
      ? cluster.primaryKeyword
      : (keywords[0] ?? cluster.primaryKeyword);
    const competitorUrls = mergeCompetitorUrls([
      ...(cluster.competitorUrls ?? []),
      ...keywords.flatMap((keyword) =>
        readCompetitorUrls(
          asObject(sourceByKeyword.get(normalizeKeywordText(keyword))?.sourceCandidate),
        ),
      ),
    ]);
    const supportingItems = (cluster.supportingItems ?? []).filter((keyword) =>
      sourceByKeyword.has(normalizeKeywordText(keyword)),
    );
    const payload: SeoBriefJsonObject = {
      clusterName: cluster.label,
      userIntent: cluster.userIntent ?? null,
      primaryKeywordCandidate: primaryKeyword,
      intent: cluster.intent,
      secondaryKeywords: keywords.filter(
        (keyword) => normalizeKeywordText(keyword) !== normalizeKeywordText(primaryKeyword),
      ),
      questions: (cluster.questions ?? []).filter((keyword) =>
        sourceByKeyword.has(normalizeKeywordText(keyword)),
      ),
      supportingItems,
      supportingItemDetails: supportingItems.map((keyword) =>
        createSupportingItemDetail(keyword, sourceByKeyword, cluster),
      ),
      keywords,
      competitorUrls: competitorUrls.map(toCompetitorUrlJson),
      sourceConfidence: cluster.sourceConfidence ?? 'medium',
      evidenceSummary: cluster.evidenceSummary ?? cluster.rationale ?? null,
      rationale: cluster.rationale ?? null,
      candidateItems: keywords.map(
        (keyword): SeoBriefJsonObject => ({
          keyword,
          sourceCandidate: sourceByKeyword.get(
            normalizeKeywordText(keyword),
          ) as unknown as SeoBriefJsonValue,
        }),
      ),
    };
    normalizedClusters.push(payload);
  }

  return normalizedClusters;
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

function readScoreBreakdown(value: unknown): ClusterKeywordCandidateInput['scores'] {
  const scores = asObject(value);
  return {
    topicFit: readNumber(scores?.topicFit) ?? 0,
    productFit: readNumber(scores?.productFit) ?? 0,
    audienceFit: readNumber(scores?.audienceFit) ?? 0,
    intentFit: readNumber(scores?.intentFit) ?? 0,
    riskCompliance: readNumber(scores?.riskCompliance) ?? 0,
    evidence: readNumber(scores?.evidence) ?? 0,
  };
}

function readFitBreakdown(value: unknown): ClusterKeywordCandidateInput['fit'] {
  const fit = asObject(value);
  return {
    topicFit: readFitLevel(fit?.topicFit),
    productFit: readFitLevel(fit?.productFit),
    audienceFit: readFitLevel(fit?.audienceFit),
    intentFit: readFitLevel(fit?.intentFit),
    riskCompliance: readFitLevel(fit?.riskCompliance),
    evidence: readFitLevel(fit?.evidence),
  };
}

function createSupportingItemDetail(
  keyword: string,
  sourceByKeyword: Map<string, CandidateRecord>,
  cluster: SeoKeywordCluster,
): SeoBriefJsonObject {
  const candidate = sourceByKeyword.get(normalizeKeywordText(keyword));
  const sourceCandidate = asObject(candidate?.sourceCandidate);
  const metrics = asObject(sourceCandidate?.metrics);
  const sources = readStringArray(sourceCandidate?.sources);

  return {
    text: keyword,
    originType: readString(sourceCandidate?.primarySource) ?? sources[0] ?? null,
    sources,
    candidateScore: readNumber(candidate?.totalScore) ?? readNumber(metrics?.candidateScore),
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
    whyInCluster:
      readString(cluster.evidenceSummary) ??
      readString(cluster.rationale) ??
      'Included by the clustering agent as a supporting item for this intent.',
    sourceCandidate: sourceCandidate as unknown as SeoBriefJsonValue,
  };
}

function readCompetitorUrls(
  sourceCandidate: CandidateRecord | null,
): ClusterKeywordCandidateInput['competitorUrls'] {
  const evidence = Array.isArray(sourceCandidate?.evidence)
    ? sourceCandidate.evidence
        .map(asObject)
        .filter((item): item is CandidateRecord => item !== null)
    : [];

  return mergeCompetitorUrls(
    evidence
      .map((item) => ({
        domain: readString(item.sourceDomain) ?? readString(item.domain) ?? '',
        url: readString(item.rankingUrl) ?? readString(item.url) ?? '',
        title: readString(item.rankingTitle) ?? readString(item.title),
        rankAbsolute: readNumber(item.rankAbsolute),
      }))
      .filter((item) => item.domain && item.url),
  );
}

function mergeCompetitorUrls(
  urls: ClusterKeywordCandidateInput['competitorUrls'],
): ClusterKeywordCandidateInput['competitorUrls'] {
  const seen = new Set<string>();
  const result: ClusterKeywordCandidateInput['competitorUrls'] = [];
  for (const url of urls) {
    const key = `${url.domain}|${url.url}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(url);
  }

  return result.slice(0, 12);
}

function toCompetitorUrlJson(
  url: ClusterKeywordCandidateInput['competitorUrls'][number],
): SeoBriefJsonObject {
  return {
    domain: url.domain,
    url: url.url,
    title: url.title ?? null,
    rankAbsolute: url.rankAbsolute ?? null,
  };
}

function asObject(value: unknown): CandidateRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as CandidateRecord)
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

function readIntent(value: unknown): ClusterKeywordCandidateInput['intent'] {
  return value === 'commercial' ||
    value === 'transactional' ||
    value === 'navigational' ||
    value === 'informational'
    ? value
    : 'informational';
}

function readStage(value: unknown): ClusterKeywordCandidateInput['stage'] {
  return value === 'consideration' || value === 'decision' || value === 'awareness'
    ? value
    : 'awareness';
}

function readFitLevel(value: unknown): ClusterKeywordCandidateInput['fit']['topicFit'] {
  return value === 'strong' || value === 'moderate' || value === 'weak' || value === 'none'
    ? value
    : 'none';
}

function normalizeKeywordText(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .replace(/[?!.\u3002\uff01\uff1f]+$/u, '')
    .trim()
    .toLowerCase();
}

function uniqueStrings(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    const normalized = normalizeKeywordText(item);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push(item.trim());
  }

  return result;
}
