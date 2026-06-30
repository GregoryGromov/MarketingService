import { Inject, Optional } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { SeoBriefArtifact } from '../../domain/seo-brief-artifact.entity.js';
import { SeoBriefArtifactRepository } from '../../domain/seo-brief-artifact.repository.js';
import type { SeoBriefRun } from '../../domain/seo-brief-run.aggregate.js';
import { SeoBriefRunRepository } from '../../domain/seo-brief-run.repository.js';
import { SeoBriefRunStep } from '../../domain/seo-brief-run-step.entity.js';
import { SeoBriefRunStepRepository } from '../../domain/seo-brief-run-step.repository.js';
import type { SeoBriefJsonObject, SeoBriefJsonValue } from '../../domain/seo-briefing.types.js';
import { SeoBriefRunNotFoundError } from '../../errors/seo-brief-run-not-found.error.js';
import {
  type ScoreDirtyKeywordCandidatesResult as AiScoreDirtyKeywordCandidatesResult,
  type ScoreDirtyKeywordCandidateInput,
  type ScoredDirtyKeywordCandidate,
  SeoBriefAiPort,
} from '../../ports/seo-brief-ai.port.js';
import { readSeoBriefAiModel } from '../seo-brief-ai-model-selection.js';
import { readRequestTimeoutMsFromArtifacts } from '../seo-brief-request-timeout.js';
import { ScoreKeywordCandidatesCommand } from './score-keyword-candidates.command.js';

const MAX_SCORING_CANDIDATES = 400;
const AI_ELIGIBILITY_BATCH_SIZE = 50;
const AI_SCORING_BATCH_SIZE = 40;
const AI_FINAL_CALIBRATION_LIMIT = 240;
const MAX_ACCEPTED_PER_BUCKET = 8;
const MAX_MAYBE_PER_BUCKET = 8;

type CandidateRecord = Record<string, unknown>;
type CandidateStatus = 'accepted' | 'maybe' | 'rejected';
type FitLabel = 'strong' | 'moderate' | 'weak' | 'none';
type IntentLabel = 'informational' | 'commercial' | 'transactional' | 'navigational' | 'mixed';
type JourneyStage = 'awareness' | 'consideration' | 'decision';
type ProductFitLabel = 'high' | 'medium' | 'low' | 'none';
type InsertionType =
  | 'direct_solution'
  | 'alternative_solution'
  | 'workflow_bridge'
  | 'education_bridge'
  | 'no_fit';
type SemanticBucket =
  | 'stablecoin_yield'
  | 'wallet_safety'
  | 'comparison_alternatives'
  | 'binance_p2p'
  | 'usdt_cashout'
  | 'network_education'
  | 'dollar_savings'
  | 'fees_and_risk'
  | 'other';

interface StagedFilteringContext {
  audience: string;
  country: string;
  keyMessage: string | null;
  language: string;
  productDescription: string;
  productName: string;
  topicSeed: string;
}

interface AiFilteringRunResult {
  accepted: SeoBriefJsonObject[];
  maybe: SeoBriefJsonObject[];
  rejected: SeoBriefJsonObject[];
  stagedFiltering: SeoBriefJsonObject;
  summaryNotes: string[];
  aiCallCount: number;
  eligibilityCandidateCount: number;
  eligibleCandidateCount: number;
  fitScoredCandidateCount: number;
  finalCalibrationCandidateCount: number;
}

interface ScoreBreakdown {
  audienceFit: number;
  evidence: number;
  intentFit: number;
  productFit: number;
  riskCompliance: number;
  topicFit: number;
}

interface StagedDecision {
  bucket: SemanticBucket;
  candidate: CandidateRecord;
  evidenceNotes: string[];
  fit: Record<keyof ScoreBreakdown, FitLabel>;
  insertionType: InsertionType;
  intent: IntentLabel;
  productFitLabel: ProductFitLabel;
  reasons: string[];
  riskFlags: string[];
  scores: ScoreBreakdown;
  sourceRole: string;
  stage: JourneyStage;
  status: CandidateStatus;
  totalScore: number;
}

const HARD_EXCLUDE_TERMS = [
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
  'generator',
  'free usdt',
  'free tether',
  'faucet',
  'airdrop',
  'private key',
  'with balance',
  'flasher',
  'pi network',
  'bee network',
  'contract address',
];

const BOOST_PATTERNS = [
  'usdt',
  'p2p',
  'wallet',
  'withdraw',
  'deposit',
  'transfer',
  'cash out',
  'bank account',
  'save',
  'dollars',
  'dollar',
  'earn',
  'yield',
  'bep20',
  'bep 20',
  'bep-20',
  'trc20',
  'trc 20',
  'trc-20',
  'nigeria',
  'naira',
  'fees',
  'safe',
  'risk',
];

const BUCKET_DETAILS: Record<SemanticBucket, { description: string; label: string }> = {
  stablecoin_yield: {
    label: 'Stablecoin yield',
    description: 'Queries about earning, yield, savings, staking, and passive income from USDT.',
  },
  wallet_safety: {
    label: 'Wallet safety',
    description: 'Queries about safety, scams, trust, and risk around holding or using USDT.',
  },
  comparison_alternatives: {
    label: 'Comparison alternatives',
    description: 'Queries comparing platforms, options, alternatives, and best choices.',
  },
  binance_p2p: {
    label: 'Binance / P2P',
    description: 'Queries around Binance, P2P flows, and peer-to-peer USDT usage.',
  },
  usdt_cashout: {
    label: 'USDT cashout',
    description: 'Queries about withdrawing, converting, selling, or moving USDT to cash or bank.',
  },
  network_education: {
    label: 'Network education',
    description: 'Queries about TRC20, BEP20, transfers, networks, and transaction mechanics.',
  },
  dollar_savings: {
    label: 'Dollar savings',
    description:
      'Queries about saving in dollars, inflation, naira, and local currency protection.',
  },
  fees_and_risk: {
    label: 'Fees and risk',
    description: 'Queries about fees, risks, lockups, security, and downside evaluation.',
  },
  other: {
    label: 'Other',
    description: 'Queries that do not cleanly map to the core SEO brief intent buckets.',
  },
};

export interface ScoreKeywordCandidatesResult {
  acceptedCount: number;
  artifactType: 'keyword_candidate_scoring';
  maybeCount: number;
  rejectedCount: number;
  runId: string;
}

@CommandHandler(ScoreKeywordCandidatesCommand)
export class ScoreKeywordCandidatesHandler
  implements ICommandHandler<ScoreKeywordCandidatesCommand, ScoreKeywordCandidatesResult>
{
  constructor(
    @Inject(SeoBriefRunRepository)
    private readonly runRepository: SeoBriefRunRepository,
    @Inject(SeoBriefRunStepRepository)
    private readonly stepRepository: SeoBriefRunStepRepository,
    @Inject(SeoBriefArtifactRepository)
    private readonly artifactRepository: SeoBriefArtifactRepository,
    @Optional()
    @Inject(SeoBriefAiPort)
    private readonly seoBriefAi?: SeoBriefAiPort,
  ) {}

  async execute(command: ScoreKeywordCandidatesCommand): Promise<ScoreKeywordCandidatesResult> {
    const run = await this.runRepository.findById(command.runId as never);
    if (!run) {
      throw new SeoBriefRunNotFoundError(command.runId);
    }

    const artifacts = await this.artifactRepository.findByRunId(run.id);
    const dirtyPool = readLatestObjectArtifact(artifacts, 'dirty_keyword_pool');
    if (!dirtyPool) {
      throw new Error('Build dirty keyword pool before filtering and scoring candidates');
    }

    const dirtyCandidates = readDirtyCandidates(dirtyPool).slice(0, MAX_SCORING_CANDIDATES);
    if (dirtyCandidates.length === 0) {
      throw new Error('Dirty keyword pool does not contain candidates to score');
    }

    const step = SeoBriefRunStep.create({
      runId: run.id,
      stage: 'keyword_triage',
      status: 'running',
      attemptNumber: nextAttemptNumber(artifacts, 'keyword_candidate_scoring'),
    });
    await this.stepRepository.save(step);

    try {
      const aiStaged = await this.runAiStagedFiltering({
        artifacts,
        dirtyCandidates,
        run,
        step,
      }).catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'AI staged filtering failed';
        const fallback = runDeterministicFallback(dirtyCandidates, run);
        return {
          ...fallback,
          stagedFiltering: {
            ...fallback.stagedFiltering,
            fallbackFromAi: true,
            aiError: message,
          } as unknown as SeoBriefJsonObject,
          summaryNotes: [
            `AI staged filtering failed, so deterministic fallback was used: ${message}`,
            ...fallback.summaryNotes,
          ],
          aiCallCount: 0,
          eligibilityCandidateCount: dirtyCandidates.length,
          eligibleCandidateCount: fallback.keptAfterNoiseCount,
          fitScoredCandidateCount: fallback.keptAfterNoiseCount,
          finalCalibrationCandidateCount: fallback.accepted.length + fallback.maybe.length,
        };
      });

      const isFallback = Boolean(aiStaged.stagedFiltering.fallbackFromAi);

      const payload: SeoBriefJsonObject = {
        artifactVersion: 'keyword_candidate_scoring_v3',
        sourceArtifactType: 'dirty_keyword_pool',
        filteringMode: isFallback
          ? 'deterministic_fallback_after_ai_failure'
          : 'ai_staged_filtering',
        scoringCriteria: [
          'ai_noise_and_eligibility',
          'ai_fit_scoring',
          'ai_final_shortlist_calibration',
          'topic_fit',
          'product_fit',
          'audience_fit',
          'intent_fit',
          'risk_compliance',
          'evidence',
        ],
        notes: [
          'Dirty-pool candidates are filtered through three compact AI passes instead of one large request.',
          'AI pass 1 removes obvious noise and low-eligibility candidates.',
          'AI pass 2 scores eligible candidates by topic, product, audience, intent, risk/compliance, and evidence.',
          'AI pass 3 calibrates the final accepted/maybe/rejected shortlist.',
          'Deterministic filtering is used only as a fallback if the AI stage fails.',
        ],
        inputCandidateCount: readNumber(dirtyPool.candidateCount) ?? dirtyCandidates.length,
        scoredCandidateCount: dirtyCandidates.length,
        llmScoredCandidateCount: aiStaged.aiCallCount,
        aiScoredCandidateCount: aiStaged.fitScoredCandidateCount,
        keptAfterNoiseCount: aiStaged.eligibleCandidateCount,
        hardExcludedCandidateCount: Math.max(
          0,
          aiStaged.eligibilityCandidateCount - aiStaged.eligibleCandidateCount,
        ),
        scoringCandidateLimit: MAX_SCORING_CANDIDATES,
        aiEligibilityBatchSize: AI_ELIGIBILITY_BATCH_SIZE,
        aiScoringBatchSize: AI_SCORING_BATCH_SIZE,
        aiFinalCalibrationLimit: AI_FINAL_CALIBRATION_LIMIT,
        fallbackUsed: isFallback,
        acceptedPerBucketLimit: MAX_ACCEPTED_PER_BUCKET,
        maybePerBucketLimit: MAX_MAYBE_PER_BUCKET,
        hardExcludeTerms: HARD_EXCLUDE_TERMS,
        boostPatterns: BOOST_PATTERNS,
        acceptedCount: aiStaged.accepted.length,
        maybeCount: aiStaged.maybe.length,
        rejectedCount: aiStaged.rejected.length,
        summary: {
          acceptedCount: aiStaged.accepted.length,
          maybeCount: aiStaged.maybe.length,
          rejectedCount: aiStaged.rejected.length,
          hardExcludedCandidateCount: Math.max(
            0,
            aiStaged.eligibilityCandidateCount - aiStaged.eligibleCandidateCount,
          ),
          keptAfterNoiseCount: aiStaged.eligibleCandidateCount,
          llmCallCount: aiStaged.aiCallCount,
          notes: aiStaged.summaryNotes,
        } as unknown as SeoBriefJsonValue,
        stagedFiltering: aiStaged.stagedFiltering as unknown as SeoBriefJsonValue,
        accepted: aiStaged.accepted as unknown as SeoBriefJsonValue,
        maybe: aiStaged.maybe as unknown as SeoBriefJsonValue,
        rejected: aiStaged.rejected as unknown as SeoBriefJsonValue,
      };
      await this.artifactRepository.save(
        SeoBriefArtifact.create({
          runId: run.id,
          stage: 'keyword_triage',
          artifactType: 'keyword_candidate_scoring',
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
        artifactType: 'keyword_candidate_scoring',
        acceptedCount: aiStaged.accepted.length,
        maybeCount: aiStaged.maybe.length,
        rejectedCount: aiStaged.rejected.length,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Keyword candidate scoring failed';
      step.fail(message);
      run.fail(message);
      await this.stepRepository.save(step);
      await this.runRepository.save(run);
      throw error;
    }
  }

  private async runAiStagedFiltering(params: {
    artifacts: SeoBriefArtifact[];
    dirtyCandidates: CandidateRecord[];
    run: SeoBriefRun;
    step: SeoBriefRunStep;
  }): Promise<AiFilteringRunResult> {
    if (!this.seoBriefAi) {
      throw new Error('SeoBriefAiPort is not configured for AI staged keyword filtering');
    }

    const sourceCandidateByKeyword = new Map<string, CandidateRecord>();
    const inputByKeyword = new Map<string, ScoreDirtyKeywordCandidateInput>();
    const rawInputs = params.dirtyCandidates.map((candidate) => ({
      candidate,
      input: toAiCandidateInput(candidate),
    }));
    const aiInputs = uniqueAiCandidateInputs(rawInputs.map((item) => item.input));

    for (const { candidate, input } of rawInputs) {
      const key = normalizeKeywordText(input.keyword);
      if (!inputByKeyword.has(key)) {
        inputByKeyword.set(key, input);
        sourceCandidateByKeyword.set(key, candidate);
      }
    }

    const baseParams = createAiScoringParams(params.run, params.artifacts, params.step);
    const modelMode = readAiModelMode(params.artifacts);

    const eligibility = await this.scoreCandidateInputBatches({
      batchSize: AI_ELIGIBILITY_BATCH_SIZE,
      candidates: aiInputs,
      params: baseParams,
      stageNote: 'pass=eligibility',
    });
    const eligibilityAccepted = [...eligibility.result.accepted, ...eligibility.result.maybe];
    const eligibilityRejected = eligibility.result.rejected;
    const eligibleKeys = new Set(
      eligibilityAccepted.map((candidate) => normalizeKeywordText(candidate.keyword)),
    );
    const eligibleInputs = aiInputs.filter((input) =>
      eligibleKeys.has(normalizeKeywordText(input.keyword)),
    );

    const fitScoring = await this.scoreCandidateInputBatches({
      batchSize: AI_SCORING_BATCH_SIZE,
      candidates: eligibleInputs,
      params: baseParams,
      stageNote: 'pass=fit_scoring',
    });

    const calibrationCandidates = [...fitScoring.result.accepted, ...fitScoring.result.maybe]
      .sort((left, right) => right.totalScore - left.totalScore)
      .slice(0, AI_FINAL_CALIBRATION_LIMIT);
    const calibrationInputs = calibrationCandidates.map((candidate) =>
      toCalibrationCandidateInput(candidate, inputByKeyword),
    );

    const calibration =
      calibrationInputs.length > 0
        ? await this.scoreCandidateInputBatches({
            batchSize: AI_SCORING_BATCH_SIZE,
            candidates: calibrationInputs,
            params: baseParams,
            stageNote: 'pass=final_calibration',
          })
        : {
            aiCallCount: 0,
            result: emptyAiScoreResult('No candidates reached final calibration.'),
          };

    const calibratedKeys = new Set(
      [
        ...calibration.result.accepted,
        ...calibration.result.maybe,
        ...calibration.result.rejected,
      ].map((candidate) => normalizeKeywordText(candidate.keyword)),
    );
    const overflowRejected = [...fitScoring.result.accepted, ...fitScoring.result.maybe]
      .filter((candidate) => !calibratedKeys.has(normalizeKeywordText(candidate.keyword)))
      .map((candidate) => ({
        ...candidate,
        status: 'rejected' as const,
        reasons: [
          ...candidate.reasons,
          'Rejected because final AI calibration limit kept stronger candidates for clustering.',
        ],
        riskFlags: [...candidate.riskFlags, 'ai_calibration_overflow'],
        totalScore: Math.min(candidate.totalScore, 49),
      }));

    const finalAccepted = calibration.result.accepted.map((candidate) =>
      aiScoredCandidateToJson(
        candidate,
        inputByKeyword,
        sourceCandidateByKeyword,
        'ai_final_calibration',
      ),
    );
    const finalMaybe = calibration.result.maybe.map((candidate) =>
      aiScoredCandidateToJson(
        candidate,
        inputByKeyword,
        sourceCandidateByKeyword,
        'ai_final_calibration',
      ),
    );
    const finalRejected = [
      ...eligibilityRejected.map((candidate) =>
        aiScoredCandidateToJson(
          candidate,
          inputByKeyword,
          sourceCandidateByKeyword,
          'ai_eligibility',
        ),
      ),
      ...fitScoring.result.rejected.map((candidate) =>
        aiScoredCandidateToJson(
          candidate,
          inputByKeyword,
          sourceCandidateByKeyword,
          'ai_fit_scoring',
        ),
      ),
      ...calibration.result.rejected.map((candidate) =>
        aiScoredCandidateToJson(
          candidate,
          inputByKeyword,
          sourceCandidateByKeyword,
          'ai_final_calibration',
        ),
      ),
      ...overflowRejected.map((candidate) =>
        aiScoredCandidateToJson(
          candidate,
          inputByKeyword,
          sourceCandidateByKeyword,
          'ai_final_calibration_overflow',
        ),
      ),
    ];

    const aiCallCount = eligibility.aiCallCount + fitScoring.aiCallCount + calibration.aiCallCount;
    const stagedFiltering: SeoBriefJsonObject = {
      mode: 'ai_staged_filtering',
      modelMode,
      stages: [
        {
          stage: 'ai_noise_and_eligibility',
          description:
            'AI checks all dirty-pool candidates and rejects obvious noise, unsafe queries, fragmented keywords, and weak fit.',
          inputCount: aiInputs.length,
          keptCount: eligibleInputs.length,
          rejectedCount: eligibilityRejected.length,
          aiCallCount: eligibility.aiCallCount,
        },
        {
          stage: 'ai_fit_scoring',
          description:
            'AI scores eligible candidates using topic fit, product fit, audience fit, intent fit, risk/compliance, and provided evidence.',
          inputCount: eligibleInputs.length,
          acceptedCount: fitScoring.result.accepted.length,
          maybeCount: fitScoring.result.maybe.length,
          rejectedCount: fitScoring.result.rejected.length,
          aiCallCount: fitScoring.aiCallCount,
        },
        {
          stage: 'ai_final_shortlist_calibration',
          description:
            'AI recalibrates the strongest pass-2 candidates into final accepted, maybe, and rejected buckets for clustering.',
          inputCount: calibrationInputs.length,
          acceptedCount: finalAccepted.length,
          maybeCount: finalMaybe.length,
          rejectedCount: calibration.result.rejected.length + overflowRejected.length,
          aiCallCount: calibration.aiCallCount,
        },
      ],
    };

    return {
      accepted: finalAccepted,
      maybe: finalMaybe,
      rejected: finalRejected,
      stagedFiltering,
      summaryNotes: [
        `AI eligibility pass kept ${eligibleInputs.length} of ${aiInputs.length} dirty candidates.`,
        `AI fit scoring accepted ${fitScoring.result.accepted.length}, kept ${fitScoring.result.maybe.length} as maybe, and rejected ${fitScoring.result.rejected.length}.`,
        `AI final calibration returned ${finalAccepted.length} accepted and ${finalMaybe.length} maybe candidates.`,
        ...eligibility.result.summary.notes,
        ...fitScoring.result.summary.notes,
        ...calibration.result.summary.notes,
      ].slice(0, 12),
      aiCallCount,
      eligibilityCandidateCount: aiInputs.length,
      eligibleCandidateCount: eligibleInputs.length,
      fitScoredCandidateCount: eligibleInputs.length,
      finalCalibrationCandidateCount: calibrationInputs.length,
    };
  }

  private async scoreCandidateInputBatches(params: {
    batchSize: number;
    candidates: ScoreDirtyKeywordCandidateInput[];
    params: Omit<Parameters<SeoBriefAiPort['scoreDirtyKeywordCandidates']>[0], 'candidates'>;
    stageNote: string;
  }): Promise<{ aiCallCount: number; result: AiScoreDirtyKeywordCandidatesResult }> {
    const seoBriefAi = this.seoBriefAi;
    if (!seoBriefAi) {
      throw new Error('SeoBriefAiPort is not configured for AI staged keyword filtering');
    }

    const chunks = chunkArray(params.candidates, params.batchSize);
    const merged = emptyAiScoreResult(params.stageNote);
    let aiCallCount = 0;

    for (const chunk of chunks) {
      const result = await seoBriefAi.scoreDirtyKeywordCandidates({
        ...params.params,
        candidates: chunk.map((candidate) => ({
          ...candidate,
          evidenceSummary: [params.stageNote, ...candidate.evidenceSummary].slice(0, 10),
        })),
      });
      aiCallCount += 1;
      mergeAiScoreResults(merged, ensureEveryInputCandidateIsReturned(chunk, result));
    }

    return { aiCallCount, result: merged };
  }
}

function runDeterministicFallback(
  dirtyCandidates: CandidateRecord[],
  run: SeoBriefRun,
): {
  accepted: SeoBriefJsonObject[];
  keptAfterNoiseCount: number;
  maybe: SeoBriefJsonObject[];
  rejected: SeoBriefJsonObject[];
  stagedFiltering: SeoBriefJsonObject;
  summaryNotes: string[];
} {
  const prefilter = prefilterDirtyCandidates(dirtyCandidates);
  const staged = runStagedFiltering({
    context: {
      topicSeed: run.topicSeed,
      country: run.country,
      language: run.language,
      audience: run.audience,
      productName: run.productName,
      productDescription: run.productDescription,
      keyMessage: run.keyMessage,
    },
    deterministicRejected: prefilter.rejectedCandidates,
    scorableCandidates: prefilter.scorableCandidates,
  });

  return {
    accepted: staged.accepted,
    keptAfterNoiseCount: prefilter.scorableCandidates.length,
    maybe: staged.maybe,
    rejected: staged.rejected,
    stagedFiltering: staged.stagedFiltering,
    summaryNotes: [
      `Deterministic fallback filtered ${dirtyCandidates.length} dirty candidates.`,
      `Kept ${prefilter.scorableCandidates.length} after noise filtering.`,
      `Shortlisted up to ${MAX_ACCEPTED_PER_BUCKET} accepted and ${MAX_MAYBE_PER_BUCKET} maybe candidates per semantic bucket.`,
    ],
  };
}

function createAiScoringParams(
  run: SeoBriefRun,
  artifacts: SeoBriefArtifact[],
  step: SeoBriefRunStep,
): Omit<Parameters<SeoBriefAiPort['scoreDirtyKeywordCandidates']>[0], 'candidates'> {
  return {
    runId: run.id,
    stepId: step.id,
    model: readSeoBriefAiModel(artifacts),
    modelMode: readAiModelMode(artifacts),
    timeoutMs: readRequestTimeoutMsFromArtifacts(artifacts),
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
    brandMemorySnapshot: run.brandMemorySnapshot,
    userPainScenarios: readLatestObjectArtifact(artifacts, 'user_pain_scenarios') as never,
  };
}

function toAiCandidateInput(candidate: CandidateRecord): ScoreDirtyKeywordCandidateInput {
  const keyword = getCandidateKeyword(candidate);
  const normalizedText = readString(candidate.normalizedText) ?? normalizeKeywordText(keyword);
  const metrics = asObject(candidate.metrics);
  const flags = asObject(candidate.flags);
  const sources = uniqueStrings(readStringArray(candidate.sources));
  const evidence = readEvidence(candidate);

  return {
    evidenceCount: evidence.length,
    evidenceSummary: [
      ...evidence.slice(0, 8).map(formatEvidenceSummary),
      ...formatCandidateMetricSummary(candidate),
    ].slice(0, 10),
    flags: {
      hasRankedKeywordEvidence:
        readBoolean(flags?.hasRankedKeywordEvidence) || sources.includes('ranked_keywords'),
      hasSearchVolume:
        readBoolean(flags?.hasSearchVolume) || readNumber(metrics?.searchVolume) !== null,
      hasSelectedRelatedQuery:
        readBoolean(flags?.hasSelectedRelatedQuery) || sources.includes('selected_related_query'),
      hasCompetitorKeywordMatch:
        readBoolean(flags?.hasCompetitorKeywordMatch) ||
        sources.includes('competitor_keyword_match') ||
        readNumber(metrics?.competitorMatchScore) !== null,
      isInitialHypothesis:
        readBoolean(flags?.isInitialHypothesis) || sources.includes('keyword_hypothesis'),
    },
    keyword,
    metrics: {
      bestRankAbsolute: readNumber(metrics?.bestRankAbsolute),
      candidateScore: readNumber(metrics?.candidateScore),
      competitorMatchScore: readNumber(metrics?.competitorMatchScore),
      cpc: readNumber(metrics?.cpc),
      intent: readString(metrics?.intent),
      keywordDifficulty: readNumber(metrics?.keywordDifficulty),
      proxyDemandScore: readNumber(metrics?.proxyDemandScore),
      searchVolume: readNumber(metrics?.searchVolume),
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
    normalizedText,
    sources,
  };
}

function toCalibrationCandidateInput(
  candidate: ScoredDirtyKeywordCandidate,
  inputByKeyword: Map<string, ScoreDirtyKeywordCandidateInput>,
): ScoreDirtyKeywordCandidateInput {
  const original = inputByKeyword.get(normalizeKeywordText(candidate.keyword));
  const stageEvidence = [
    `pass_2_status=${candidate.status}`,
    `pass_2_total_score=${candidate.totalScore}`,
    `pass_2_scores=${[
      candidate.scores.topicFit,
      candidate.scores.productFit,
      candidate.scores.audienceFit,
      candidate.scores.intentFit,
      candidate.scores.riskCompliance,
      candidate.scores.evidence,
    ].join('/')}`,
    ...candidate.reasons.slice(0, 2).map((reason) => `pass_2_reason=${reason}`),
    ...candidate.evidenceNotes.slice(0, 2).map((note) => `pass_2_evidence=${note}`),
  ];

  return {
    evidenceCount: original?.evidenceCount ?? candidate.evidenceNotes.length,
    evidenceSummary: [...stageEvidence, ...(original?.evidenceSummary ?? [])].slice(0, 10),
    flags: original?.flags ?? {
      hasRankedKeywordEvidence: false,
      hasSearchVolume: false,
      hasSelectedRelatedQuery: false,
      hasCompetitorKeywordMatch: false,
      isInitialHypothesis: false,
    },
    keyword: candidate.keyword,
    metrics: {
      ...(original?.metrics ?? {}),
      candidateScore: candidate.totalScore,
    },
    normalizedText: original?.normalizedText ?? normalizeKeywordText(candidate.keyword),
    sources: uniqueStrings([...(original?.sources ?? []), 'ai_fit_scoring']),
  };
}

function aiScoredCandidateToJson(
  candidate: ScoredDirtyKeywordCandidate,
  inputByKeyword: Map<string, ScoreDirtyKeywordCandidateInput>,
  sourceCandidateByKeyword: Map<string, CandidateRecord>,
  aiStage: string,
): SeoBriefJsonObject {
  const key = normalizeKeywordText(candidate.keyword);
  const input = inputByKeyword.get(key);
  const sourceCandidate =
    sourceCandidateByKeyword.get(key) ?? ({ keyword: candidate.keyword } as CandidateRecord);

  return {
    keyword: candidate.keyword,
    status: candidate.status,
    totalScore: candidate.totalScore,
    scores: candidate.scores as unknown as SeoBriefJsonValue,
    fit: candidate.fit as unknown as SeoBriefJsonValue,
    intent: candidate.intent,
    stage: candidate.stage,
    aiStage,
    sourceRole: classifySourceRole(sourceCandidate),
    reasons: candidate.reasons,
    riskFlags: candidate.riskFlags,
    evidenceNotes: candidate.evidenceNotes,
    metrics: (input?.metrics ?? {}) as unknown as SeoBriefJsonValue,
    sources: input?.sources ?? [],
    sourceCandidate: sourceCandidate as unknown as SeoBriefJsonValue,
  } as unknown as SeoBriefJsonObject;
}

function ensureEveryInputCandidateIsReturned(
  inputs: ScoreDirtyKeywordCandidateInput[],
  result: AiScoreDirtyKeywordCandidatesResult,
): AiScoreDirtyKeywordCandidatesResult {
  const inputKeys = new Set(inputs.map((input) => normalizeKeywordText(input.keyword)));
  const returned = new Map<string, ScoredDirtyKeywordCandidate>();

  for (const candidate of [...result.accepted, ...result.maybe, ...result.rejected]) {
    const key = normalizeKeywordText(candidate.keyword);
    if (inputKeys.has(key) && !returned.has(key)) {
      returned.set(key, candidate);
    }
  }

  const normalized = emptyAiScoreResult(...result.summary.notes);
  for (const input of inputs) {
    const key = normalizeKeywordText(input.keyword);
    const candidate = returned.get(key) ?? createAiOmittedRejectedCandidate(input);
    pushScoredCandidate(normalized, candidate);
  }

  normalized.summary.acceptedCount = normalized.accepted.length;
  normalized.summary.maybeCount = normalized.maybe.length;
  normalized.summary.rejectedCount = normalized.rejected.length;

  return normalized;
}

function createAiOmittedRejectedCandidate(
  input: ScoreDirtyKeywordCandidateInput,
): ScoredDirtyKeywordCandidate {
  return {
    keyword: input.keyword,
    status: 'rejected',
    totalScore: 0,
    scores: {
      topicFit: 0,
      productFit: 0,
      audienceFit: 0,
      intentFit: 0,
      riskCompliance: 0,
      evidence: 0,
    },
    fit: {
      topicFit: 'none',
      productFit: 'none',
      audienceFit: 'none',
      intentFit: 'none',
      riskCompliance: 'none',
      evidence: 'none',
    },
    intent: 'informational',
    stage: 'awareness',
    reasons: ['Rejected because the AI response omitted this input candidate.'],
    riskFlags: ['ai_response_omitted_candidate'],
    evidenceNotes: input.evidenceSummary.slice(0, 3),
  };
}

function mergeAiScoreResults(
  target: AiScoreDirtyKeywordCandidatesResult,
  source: AiScoreDirtyKeywordCandidatesResult,
): void {
  target.accepted.push(...source.accepted);
  target.maybe.push(...source.maybe);
  target.rejected.push(...source.rejected);
  target.summary.notes.push(...source.summary.notes);
  target.summary.acceptedCount = target.accepted.length;
  target.summary.maybeCount = target.maybe.length;
  target.summary.rejectedCount = target.rejected.length;
}

function emptyAiScoreResult(...notes: string[]): AiScoreDirtyKeywordCandidatesResult {
  return {
    accepted: [],
    maybe: [],
    rejected: [],
    summary: {
      acceptedCount: 0,
      maybeCount: 0,
      rejectedCount: 0,
      notes: notes.filter((note) => note.trim()),
    },
  };
}

function pushScoredCandidate(
  target: AiScoreDirtyKeywordCandidatesResult,
  candidate: ScoredDirtyKeywordCandidate,
): void {
  if (candidate.status === 'accepted') {
    target.accepted.push(candidate);
    return;
  }
  if (candidate.status === 'maybe') {
    target.maybe.push(candidate);
    return;
  }
  target.rejected.push(candidate);
}

function uniqueAiCandidateInputs(
  inputs: ScoreDirtyKeywordCandidateInput[],
): ScoreDirtyKeywordCandidateInput[] {
  const seen = new Set<string>();
  const result: ScoreDirtyKeywordCandidateInput[] = [];

  for (const input of inputs) {
    const key = normalizeKeywordText(input.keyword);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(input);
  }

  return result;
}

function formatCandidateMetricSummary(candidate: CandidateRecord): string[] {
  const metrics = asObject(candidate.metrics);
  const parts = [
    readNumber(metrics?.searchVolume) !== null
      ? `search_volume=${readNumber(metrics?.searchVolume)}`
      : null,
    readNumber(metrics?.keywordDifficulty) !== null
      ? `keyword_difficulty=${readNumber(metrics?.keywordDifficulty)}`
      : null,
    readNumber(metrics?.proxyDemandScore) !== null
      ? `proxy_demand_score=${readNumber(metrics?.proxyDemandScore)}`
      : null,
    readNumber(metrics?.competitorMatchScore) !== null
      ? `competitor_match_score=${readNumber(metrics?.competitorMatchScore)}`
      : null,
    readString(metrics?.bestMatchType)
      ? `best_match_type=${readString(metrics?.bestMatchType)}`
      : null,
    readNumber(metrics?.bestRankAbsolute) !== null
      ? `best_rank_absolute=${readNumber(metrics?.bestRankAbsolute)}`
      : null,
    readNumber(metrics?.sourceHypothesisSerpDomainHhi) !== null
      ? `source_hypothesis_serp_domain_hhi=${readNumber(metrics?.sourceHypothesisSerpDomainHhi)}`
      : null,
    readString(metrics?.sourceHypothesisSerpDomainConcentrationLabel)
      ? `source_hypothesis_serp_domain_concentration=${readString(metrics?.sourceHypothesisSerpDomainConcentrationLabel)}`
      : null,
    readNumber(metrics?.sourceHypothesisSerpUniqueDomainCount) !== null &&
    readNumber(metrics?.sourceHypothesisSerpResultCount) !== null
      ? `source_hypothesis_serp_domains=${readNumber(metrics?.sourceHypothesisSerpUniqueDomainCount)}/${readNumber(metrics?.sourceHypothesisSerpResultCount)}`
      : null,
    readString(metrics?.sourceHypothesisSerpDominantDomain) &&
    readNumber(metrics?.sourceHypothesisSerpDominantDomainShare) !== null
      ? `source_hypothesis_serp_dominant_domain=${readString(metrics?.sourceHypothesisSerpDominantDomain)}:${readNumber(metrics?.sourceHypothesisSerpDominantDomainShare)}`
      : null,
  ].filter((part): part is string => Boolean(part));

  return parts.length > 0 ? [`metrics | ${parts.join(' | ')}`] : [];
}

function readAiModelMode(artifacts: SeoBriefArtifact[]): 'flash' | 'pro' | 'pro_thinking' | null {
  const normalizedInput = readLatestObjectArtifact(artifacts, 'normalized_input');
  const mode = readString(normalizedInput?.aiModelMode);
  return mode === 'flash' || mode === 'pro' || mode === 'pro_thinking' ? mode : null;
}

function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }

  return chunks;
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

function readDirtyCandidates(dirtyPool: SeoBriefJsonObject): CandidateRecord[] {
  return Array.isArray(dirtyPool.candidates)
    ? dirtyPool.candidates.map(asObject).filter((item): item is CandidateRecord => item !== null)
    : [];
}

function prefilterDirtyCandidates(dirtyCandidates: CandidateRecord[]): {
  rejectedCandidates: SeoBriefJsonObject[];
  scorableCandidates: CandidateRecord[];
} {
  const rejectedCandidates: SeoBriefJsonObject[] = [];
  const scorableCandidates: CandidateRecord[] = [];

  for (const candidate of dirtyCandidates) {
    const keyword = readString(candidate.text) ?? readString(candidate.keyword) ?? '';
    const hardExcludeTerm = findHardExcludeTerm(keyword);

    if (hardExcludeTerm) {
      rejectedCandidates.push(createDeterministicRejectedCandidate(candidate, hardExcludeTerm));
      continue;
    }

    scorableCandidates.push(candidate);
  }

  return { rejectedCandidates, scorableCandidates };
}

function createDeterministicRejectedCandidate(
  candidate: CandidateRecord,
  hardExcludeTerm: string,
): SeoBriefJsonObject {
  const keyword = readString(candidate.text) ?? readString(candidate.keyword) ?? '';

  return {
    keyword,
    status: 'rejected',
    totalScore: 0,
    scores: {
      topicFit: 0,
      productFit: 0,
      audienceFit: 0,
      intentFit: 0,
      riskCompliance: 0,
      evidence: 0,
    },
    fit: {
      topicFit: 'none',
      productFit: 'none',
      audienceFit: 'none',
      intentFit: 'none',
      riskCompliance: 'none',
      evidence: 'none',
    },
    intent: 'navigational',
    stage: 'awareness',
    reasons: [`Noise filter rejected this candidate because it contains "${hardExcludeTerm}".`],
    riskFlags: ['hard_exclude', hardExcludeTerm],
    evidenceNotes: ['Filtered by deterministic hard-exclude rules from the V2 algorithm.'],
    sourceCandidate: candidate as unknown as SeoBriefJsonValue,
  } as unknown as SeoBriefJsonObject;
}

function runStagedFiltering(params: {
  context: StagedFilteringContext;
  deterministicRejected: SeoBriefJsonObject[];
  scorableCandidates: CandidateRecord[];
}): {
  accepted: SeoBriefJsonObject[];
  maybe: SeoBriefJsonObject[];
  rejected: SeoBriefJsonObject[];
  stagedFiltering: SeoBriefJsonObject;
} {
  const decisions = params.scorableCandidates.map((candidate) =>
    createStagedDecision(candidate, params.context),
  );
  const shortlisted = applyBucketShortlist(decisions);
  const accepted = shortlisted
    .filter((decision) => decision.status === 'accepted')
    .map(decisionToJson);
  const maybe = shortlisted.filter((decision) => decision.status === 'maybe').map(decisionToJson);
  const rejected = [
    ...params.deterministicRejected,
    ...shortlisted.filter((decision) => decision.status === 'rejected').map(decisionToJson),
  ];

  const bucketSummaries = Object.entries(groupDecisionsByBucket(shortlisted)).map(
    ([bucket, items]) => ({
      bucket,
      label: BUCKET_DETAILS[bucket as SemanticBucket].label,
      description: BUCKET_DETAILS[bucket as SemanticBucket].description,
      inputCount: items.length,
      acceptedCount: items.filter((item) => item.status === 'accepted').length,
      maybeCount: items.filter((item) => item.status === 'maybe').length,
      rejectedCount: items.filter((item) => item.status === 'rejected').length,
      topCandidates: items
        .filter((item) => item.status !== 'rejected')
        .sort((left, right) => right.totalScore - left.totalScore)
        .slice(0, 5)
        .map((item) => ({
          keyword: getCandidateKeyword(item.candidate),
          status: item.status,
          totalScore: item.totalScore,
          productFit: item.productFitLabel,
          insertionType: item.insertionType,
        })),
    }),
  );

  const stagedFiltering: SeoBriefJsonObject = {
    mode: 'deterministic_staged_filtering',
    stages: [
      {
        stage: 'noise_filter',
        description:
          'Reject obvious navigation, scams, unsupported topics, and compliance-risk noise.',
        inputCount: params.scorableCandidates.length + params.deterministicRejected.length,
        keptCount: params.scorableCandidates.length,
        rejectedCount: params.deterministicRejected.length,
      },
      {
        stage: 'semantic_bucket_classification',
        description: 'Classify candidates into business-intent buckets before scoring.',
        bucketCount: bucketSummaries.length,
        buckets: bucketSummaries.map((bucket) => ({
          bucket: bucket.bucket,
          label: bucket.label,
          inputCount: bucket.inputCount,
        })),
      },
      {
        stage: 'product_fit_scoring',
        description:
          'Score candidates by topic fit, product fit, audience fit, intent fit, risk/compliance, and evidence.',
        acceptedCount: accepted.length,
        maybeCount: maybe.length,
        rejectedCount: rejected.length,
      },
      {
        stage: 'bucket_shortlist',
        description:
          'Keep the strongest accepted/maybe candidates per bucket so downstream LLM clustering stays compact.',
        acceptedPerBucketLimit: MAX_ACCEPTED_PER_BUCKET,
        maybePerBucketLimit: MAX_MAYBE_PER_BUCKET,
      },
    ],
    buckets: bucketSummaries,
  };

  return { accepted, maybe, rejected, stagedFiltering };
}

function createStagedDecision(
  candidate: CandidateRecord,
  context: StagedFilteringContext,
): StagedDecision {
  const keyword = getCandidateKeyword(candidate);
  const bucket = classifySemanticBucket(keyword);
  const metrics = asObject(candidate.metrics);
  const rawIntent = readString(metrics?.intent);
  const intent = classifyIntent(keyword, rawIntent, bucket);
  const productFit = classifyProductFit(keyword, bucket, context);
  const riskFlags = findRiskFlags(keyword);
  const scores: ScoreBreakdown = {
    topicFit: scoreTopicFit(keyword, bucket, context),
    productFit: productFit.score,
    audienceFit: scoreAudienceFit(keyword, context),
    intentFit: scoreIntentFit(intent, keyword),
    riskCompliance: scoreRiskCompliance(keyword, riskFlags),
    evidence: scoreEvidence(candidate),
  };
  const totalScore = scoreTotal(scores);
  const status = decideCandidateStatus(scores, totalScore, productFit.label, riskFlags);

  return {
    bucket,
    candidate,
    evidenceNotes: [
      ...readEvidence(candidate).slice(0, 3).map(formatEvidenceSummary),
      ...formatDeterministicSignals(candidate),
      `bucket=${BUCKET_DETAILS[bucket].label}`,
      `product_fit=${productFit.label}`,
      `insertion_type=${productFit.insertionType}`,
    ],
    fit: {
      topicFit: fitLabel(scores.topicFit),
      productFit: fitLabel(scores.productFit),
      audienceFit: fitLabel(scores.audienceFit),
      intentFit: fitLabel(scores.intentFit),
      riskCompliance: fitLabel(scores.riskCompliance),
      evidence: fitLabel(scores.evidence),
    },
    insertionType: productFit.insertionType,
    intent,
    productFitLabel: productFit.label,
    reasons: buildDecisionReasons({
      bucket,
      productFitLabel: productFit.label,
      insertionType: productFit.insertionType,
      riskFlags,
      scores,
      status,
    }),
    riskFlags,
    scores,
    sourceRole: classifySourceRole(candidate),
    stage: classifyJourneyStage(intent, bucket, keyword),
    status,
    totalScore,
  };
}

function applyBucketShortlist(decisions: StagedDecision[]): StagedDecision[] {
  const byBucket = groupDecisionsByBucket(decisions);
  const result: StagedDecision[] = [];

  for (const items of Object.values(byBucket)) {
    const sorted = [...items].sort((left, right) => right.totalScore - left.totalScore);
    let acceptedCount = 0;
    let maybeCount = 0;

    for (const item of sorted) {
      if (item.status === 'accepted') {
        if (acceptedCount < MAX_ACCEPTED_PER_BUCKET) {
          acceptedCount += 1;
          result.push(item);
          continue;
        }

        if (maybeCount < MAX_MAYBE_PER_BUCKET) {
          maybeCount += 1;
          result.push({
            ...item,
            status: 'maybe',
            reasons: [
              ...item.reasons,
              'Downgraded to maybe because this bucket already has stronger accepted candidates.',
            ],
          });
          continue;
        }
      }

      if (item.status === 'maybe') {
        if (maybeCount < MAX_MAYBE_PER_BUCKET) {
          maybeCount += 1;
          result.push(item);
          continue;
        }
      }

      result.push({
        ...item,
        status: 'rejected',
        reasons: [
          ...item.reasons,
          'Rejected by bucket shortlist because stronger candidates cover the same intent.',
        ],
        riskFlags: [...item.riskFlags, 'bucket_shortlist_overflow'],
      });
    }
  }

  return result;
}

function decisionToJson(decision: StagedDecision): SeoBriefJsonObject {
  return {
    keyword: getCandidateKeyword(decision.candidate),
    status: decision.status,
    bucket: decision.bucket,
    bucketLabel: BUCKET_DETAILS[decision.bucket].label,
    productFitLabel: decision.productFitLabel,
    insertionType: decision.insertionType,
    sourceRole: decision.sourceRole,
    totalScore: decision.totalScore,
    scores: decision.scores as unknown as SeoBriefJsonValue,
    fit: decision.fit as unknown as SeoBriefJsonValue,
    intent: decision.intent,
    stage: decision.stage,
    reasons: decision.reasons,
    riskFlags: decision.riskFlags,
    evidenceNotes: decision.evidenceNotes,
    sourceCandidate: decision.candidate as unknown as SeoBriefJsonValue,
  } as unknown as SeoBriefJsonObject;
}

function classifySemanticBucket(keyword: string): SemanticBucket {
  const normalized = normalizeKeywordText(keyword);
  if (matchesAny(normalized, ['binance p2p', 'p2p', 'peer to peer'])) {
    return 'binance_p2p';
  }
  if (
    matchesAny(normalized, [
      'cash out',
      'cashout',
      'withdraw',
      'sell usdt',
      'convert usdt',
      'bank account',
    ])
  ) {
    return 'usdt_cashout';
  }
  if (
    matchesAny(normalized, [
      'trc20',
      'trc 20',
      'trc-20',
      'bep20',
      'bep 20',
      'bep-20',
      'network',
      'transfer fee',
    ])
  ) {
    return 'network_education';
  }
  if (
    matchesAny(normalized, [
      'vs',
      'versus',
      'compare',
      'comparison',
      'best',
      'alternative',
      'nexo',
      'binance earn',
      'trust wallet',
    ])
  ) {
    return 'comparison_alternatives';
  }
  if (matchesAny(normalized, ['scam', 'safe', 'safety', 'risk', 'trust', 'secure', 'wallet'])) {
    return 'wallet_safety';
  }
  if (matchesAny(normalized, ['fee', 'fees', 'lock', 'lockup', 'lock period', 'risk'])) {
    return 'fees_and_risk';
  }
  if (
    matchesAny(normalized, [
      'earn',
      'yield',
      'interest',
      'staking',
      'stake',
      'saving',
      'savings',
      'passive income',
      'apy',
    ])
  ) {
    return 'stablecoin_yield';
  }
  if (
    matchesAny(normalized, ['dollar', 'dollars', 'inflation', 'devaluation', 'naira', 'save money'])
  ) {
    return 'dollar_savings';
  }

  return 'other';
}

function classifyIntent(
  keyword: string,
  rawIntent: string | null,
  bucket: SemanticBucket,
): IntentLabel {
  const normalizedRawIntent = normalizeKeywordText(rawIntent ?? '');
  if (
    normalizedRawIntent === 'informational' ||
    normalizedRawIntent === 'commercial' ||
    normalizedRawIntent === 'transactional' ||
    normalizedRawIntent === 'navigational'
  ) {
    return normalizedRawIntent;
  }

  const normalized = normalizeKeywordText(keyword);
  if (matchesAny(normalized, ['login', 'app download', 'support'])) {
    return 'navigational';
  }
  if (bucket === 'comparison_alternatives' || matchesAny(normalized, ['best', 'compare', 'vs'])) {
    return 'commercial';
  }
  if (bucket === 'usdt_cashout' || matchesAny(normalized, ['withdraw', 'sell', 'convert'])) {
    return 'transactional';
  }
  if (matchesAny(normalized, ['how', 'what', 'why', 'is it', 'safe', 'risk'])) {
    return 'informational';
  }

  return 'mixed';
}

function classifyProductFit(
  keyword: string,
  bucket: SemanticBucket,
  context: StagedFilteringContext,
): { insertionType: InsertionType; label: ProductFitLabel; score: number } {
  const normalized = normalizeKeywordText(keyword);
  const contextText = normalizeKeywordText(
    [
      context.topicSeed,
      context.audience,
      context.productName,
      context.productDescription,
      context.keyMessage,
    ]
      .filter(Boolean)
      .join(' '),
  );
  const hasUsdt = hasSearchTerm(normalized, 'usdt') || hasSearchTerm(contextText, 'usdt');
  const directYield = matchesAny(normalized, [
    'earn',
    'yield',
    'interest',
    'staking',
    'stake',
    'saving',
    'savings',
    'passive income',
  ]);
  const trustOrRisk = matchesAny(normalized, [
    'safe',
    'safety',
    'risk',
    'scam',
    'trust',
    'lock',
    'fee',
  ]);
  const competitorComparison = bucket === 'comparison_alternatives';

  if (hasUsdt && directYield) {
    return { label: 'high', insertionType: 'direct_solution', score: 88 };
  }
  if (hasUsdt && (trustOrRisk || competitorComparison || bucket === 'fees_and_risk')) {
    return { label: 'high', insertionType: 'education_bridge', score: 82 };
  }
  if (
    hasUsdt &&
    (bucket === 'binance_p2p' || bucket === 'usdt_cashout' || bucket === 'network_education')
  ) {
    return { label: 'medium', insertionType: 'workflow_bridge', score: 68 };
  }
  if (hasUsdt && bucket === 'dollar_savings') {
    return { label: 'medium', insertionType: 'alternative_solution', score: 64 };
  }
  if (hasUsdt) {
    return { label: 'low', insertionType: 'education_bridge', score: 46 };
  }

  return { label: 'none', insertionType: 'no_fit', score: 12 };
}

function scoreTopicFit(
  keyword: string,
  bucket: SemanticBucket,
  context: StagedFilteringContext,
): number {
  const normalized = normalizeKeywordText(keyword);
  const topicMatches = countTokenMatches(normalized, context.topicSeed);
  const boostCount = findBoostPatterns(keyword).length;
  let score = bucket === 'other' ? 32 : 58;
  score += Math.min(22, topicMatches * 7);
  score += Math.min(18, boostCount * 3);
  if (hasSearchTerm(normalized, 'usdt')) {
    score += 10;
  }

  return clampScore(score);
}

function scoreAudienceFit(keyword: string, context: StagedFilteringContext): number {
  const normalized = normalizeKeywordText(keyword);
  const audienceMatches = countTokenMatches(normalized, context.audience);
  let score = 45 + Math.min(20, audienceMatches * 7);
  if (
    matchesAny(normalized, [
      'beginner',
      'beginners',
      'safe',
      'simple',
      'nigeria',
      'naira',
      'mobile',
    ])
  ) {
    score += 18;
  }
  if (matchesAny(normalized, [normalizeKeywordText(context.country)])) {
    score += 12;
  }
  if (hasSearchTerm(normalized, 'usdt')) {
    score += 8;
  }

  return clampScore(score);
}

function scoreIntentFit(intent: IntentLabel, keyword: string): number {
  const normalized = normalizeKeywordText(keyword);
  if (intent === 'navigational') {
    return 35;
  }
  if (intent === 'transactional') {
    return matchesAny(normalized, ['generator', 'free', 'hack', 'private key']) ? 10 : 62;
  }
  if (intent === 'commercial') {
    return 78;
  }
  if (intent === 'informational') {
    return 82;
  }

  return 65;
}

function scoreRiskCompliance(keyword: string, riskFlags: string[]): number {
  const normalized = normalizeKeywordText(keyword);
  if (
    riskFlags.some((flag) => flag === 'scam_or_free_money' || flag === 'credential_or_seed_phrase')
  ) {
    return 0;
  }
  let score = 88;
  if (
    matchesAny(normalized, [
      'guaranteed',
      'risk free',
      'daily profit',
      '100 usdt daily',
      'double money',
    ])
  ) {
    score -= 45;
  }
  if (riskFlags.length > 0) {
    score -= Math.min(35, riskFlags.length * 12);
  }

  return clampScore(score);
}

function scoreEvidence(candidate: CandidateRecord): number {
  const metrics = asObject(candidate.metrics);
  const flags = asObject(candidate.flags);
  const evidence = readEvidence(candidate);
  const sources = readStringArray(candidate.sources);
  const sourceCount = readNumber(candidate.sourceCount) ?? sources.length;
  const searchVolume = readNumber(metrics?.searchVolume);
  const bestRankAbsolute = readNumber(metrics?.bestRankAbsolute);
  const proxyDemandScore = readNumber(metrics?.proxyDemandScore);
  const competitorMatchScore = readNumber(metrics?.competitorMatchScore);
  const candidateScore = readNumber(metrics?.candidateScore);

  let score = 24;
  score += Math.min(24, sourceCount * 7);
  score += Math.min(16, evidence.length * 4);
  if (readBoolean(flags?.isInitialHypothesis)) {
    score += 8;
  }
  if (readBoolean(flags?.hasSelectedRelatedQuery)) {
    score += 10;
  }
  if (readBoolean(flags?.hasRankedKeywordEvidence)) {
    score += 12;
  }
  if (readBoolean(flags?.hasCompetitorKeywordMatch)) {
    score += 10;
  }
  if (readBoolean(flags?.hasSearchVolume) || searchVolume !== null) {
    score += 12;
  }
  if (bestRankAbsolute !== null && bestRankAbsolute <= 5) {
    score += 8;
  }
  score += Math.min(12, Math.max(0, proxyDemandScore ?? 0) / 8);
  score += Math.min(10, Math.max(0, competitorMatchScore ?? 0) / 10);
  score += Math.min(10, Math.max(0, candidateScore ?? 0) / 10);

  return clampScore(score);
}

function scoreTotal(scores: ScoreBreakdown): number {
  return Math.round(
    scores.topicFit * 0.22 +
      scores.productFit * 0.24 +
      scores.audienceFit * 0.16 +
      scores.intentFit * 0.14 +
      scores.riskCompliance * 0.14 +
      scores.evidence * 0.1,
  );
}

function decideCandidateStatus(
  scores: ScoreBreakdown,
  totalScore: number,
  productFit: ProductFitLabel,
  riskFlags: string[],
): CandidateStatus {
  if (
    productFit === 'none' ||
    scores.riskCompliance < 45 ||
    riskFlags.includes('scam_or_free_money') ||
    riskFlags.includes('credential_or_seed_phrase')
  ) {
    return 'rejected';
  }
  if (totalScore >= 72 && (productFit === 'high' || productFit === 'medium')) {
    return 'accepted';
  }
  if (totalScore >= 50) {
    return 'maybe';
  }

  return 'rejected';
}

function buildDecisionReasons(params: {
  bucket: SemanticBucket;
  insertionType: InsertionType;
  productFitLabel: ProductFitLabel;
  riskFlags: string[];
  scores: ScoreBreakdown;
  status: CandidateStatus;
}): string[] {
  const reasons = [
    `Bucketed as ${BUCKET_DETAILS[params.bucket].label}: ${BUCKET_DETAILS[params.bucket].description}`,
    `Product fit is ${params.productFitLabel}; suggested insertion is ${params.insertionType}.`,
    `Evidence score ${params.scores.evidence} comes from saved dirty-pool sources and metrics.`,
  ];

  if (params.riskFlags.length > 0) {
    reasons.push(`Risk/compliance flags: ${params.riskFlags.join(', ')}.`);
  }
  if (params.status === 'accepted') {
    reasons.push(
      'Accepted because fit, intent, compliance, and evidence are strong enough to continue.',
    );
  } else if (params.status === 'maybe') {
    reasons.push(
      'Kept as maybe because the query can be useful but needs review or careful framing.',
    );
  } else {
    reasons.push(
      'Rejected because fit, risk, or evidence is too weak for the next algorithm steps.',
    );
  }

  return reasons;
}

function classifyJourneyStage(
  intent: IntentLabel,
  bucket: SemanticBucket,
  keyword: string,
): JourneyStage {
  const normalized = normalizeKeywordText(keyword);
  if (intent === 'transactional' || matchesAny(normalized, ['best', 'vs', 'compare'])) {
    return 'decision';
  }
  if (
    intent === 'commercial' ||
    bucket === 'comparison_alternatives' ||
    bucket === 'stablecoin_yield'
  ) {
    return 'consideration';
  }

  return 'awareness';
}

function classifySourceRole(candidate: CandidateRecord): string {
  const sources = readStringArray(candidate.sources);
  if (sources.includes('ranked_keywords')) {
    return 'ranked_keyword_evidence';
  }
  if (sources.includes('competitor_keyword_match')) {
    return 'competitor_match';
  }
  if (sources.includes('selected_related_query')) {
    return 'selected_related_query';
  }
  if (sources.includes('serp_derived_candidate')) {
    return 'serp_derived_candidate';
  }
  if (sources.includes('keyword_hypothesis')) {
    return 'keyword_hypothesis';
  }

  return sources[0] ?? 'unknown_source';
}

function findRiskFlags(keyword: string): string[] {
  const normalized = normalizeKeywordText(keyword);
  const flags: string[] = [];
  if (
    matchesAny(normalized, [
      'free usdt',
      'free tether',
      'generator',
      'faucet',
      'airdrop',
      'flasher',
      'double money',
    ])
  ) {
    flags.push('scam_or_free_money');
  }
  if (matchesAny(normalized, ['seed phrase', 'private key', 'with balance'])) {
    flags.push('credential_or_seed_phrase');
  }
  if (matchesAny(normalized, ['guaranteed', 'risk free', 'daily profit', '100 usdt daily'])) {
    flags.push('misleading_returns');
  }
  if (matchesAny(normalized, ['hack', 'bypass', 'crack'])) {
    flags.push('illegal_or_abusive');
  }

  return flags;
}

function groupDecisionsByBucket(
  decisions: StagedDecision[],
): Record<SemanticBucket, StagedDecision[]> {
  const initialGroups: Record<SemanticBucket, StagedDecision[]> = {
    stablecoin_yield: [],
    wallet_safety: [],
    comparison_alternatives: [],
    binance_p2p: [],
    usdt_cashout: [],
    network_education: [],
    dollar_savings: [],
    fees_and_risk: [],
    other: [],
  };

  return decisions.reduce((groups, decision) => {
    groups[decision.bucket].push(decision);
    return groups;
  }, initialGroups);
}

function getCandidateKeyword(candidate: CandidateRecord): string {
  return readString(candidate.text) ?? readString(candidate.keyword) ?? '';
}

function readEvidence(candidate: CandidateRecord): CandidateRecord[] {
  return Array.isArray(candidate.evidence)
    ? candidate.evidence.map(asObject).filter((item): item is CandidateRecord => item !== null)
    : [];
}

function fitLabel(score: number): FitLabel {
  if (score >= 75) {
    return 'strong';
  }
  if (score >= 55) {
    return 'moderate';
  }
  if (score >= 25) {
    return 'weak';
  }

  return 'none';
}

function countTokenMatches(text: string, source: string | null): number {
  if (!source) {
    return 0;
  }
  const tokens = normalizeKeywordText(source)
    .split(' ')
    .filter((token) => token.length >= 4 && !['this', 'that', 'with', 'from'].includes(token));
  return tokens.filter((token) => hasSearchTerm(text, token)).length;
}

function matchesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => term && hasSearchTerm(text, normalizeKeywordText(term)));
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function formatEvidenceSummary(evidence: CandidateRecord): string {
  const source = readString(evidence.source) ?? 'unknown_source';
  const sourceDomain = readString(evidence.sourceDomain);
  const reason = readString(evidence.reason);
  const sourceText = readString(evidence.sourceText);
  const sourceKeyword = readString(evidence.sourceKeyword);
  const metrics = asObject(evidence.metrics);
  const proxyDemandScore = readNumber(metrics?.proxyDemandScore);
  const bestMatchType = readString(metrics?.bestMatchType);
  return [
    source,
    sourceDomain ? `domain=${sourceDomain}` : null,
    sourceKeyword ? `seed=${sourceKeyword}` : null,
    proxyDemandScore !== null ? `proxy_demand=${proxyDemandScore}` : null,
    bestMatchType ? `match=${bestMatchType}` : null,
    reason ?? sourceText,
  ]
    .filter(Boolean)
    .join(' | ');
}

function formatDeterministicSignals(candidate: CandidateRecord): string[] {
  const keyword = readString(candidate.text) ?? readString(candidate.keyword) ?? '';
  const boostPatterns = findBoostPatterns(keyword);
  if (boostPatterns.length === 0) {
    return [];
  }

  return [`deterministic_boost_patterns=${boostPatterns.join(', ')}`];
}

function findHardExcludeTerm(value: string): string | null {
  const normalized = normalizeKeywordText(value);
  return (
    HARD_EXCLUDE_TERMS.find((term) => hasSearchTerm(normalized, normalizeKeywordText(term))) ?? null
  );
}

function findBoostPatterns(value: string): string[] {
  const normalized = normalizeKeywordText(value);
  return BOOST_PATTERNS.filter((term) => hasSearchTerm(normalized, normalizeKeywordText(term)));
}

function hasSearchTerm(text: string, term: string): boolean {
  if (!text || !term) {
    return false;
  }

  if (term.includes(' ')) {
    return text.includes(term);
  }

  return new RegExp(`(^|\\s)${escapeRegExp(term)}(\\s|$)`, 'u').test(text);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readBoolean(value: unknown): boolean {
  return value === true;
}

function normalizeKeywordText(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .replace(/[?!.\u3002\uff01\uff1f]+$/u, '')
    .trim()
    .toLowerCase();
}
