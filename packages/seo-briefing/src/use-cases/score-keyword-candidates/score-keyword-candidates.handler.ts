import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { SeoBriefArtifact } from '../../domain/seo-brief-artifact.entity.js';
import { SeoBriefArtifactRepository } from '../../domain/seo-brief-artifact.repository.js';
import { SeoBriefRunRepository } from '../../domain/seo-brief-run.repository.js';
import { SeoBriefRunStep } from '../../domain/seo-brief-run-step.entity.js';
import { SeoBriefRunStepRepository } from '../../domain/seo-brief-run-step.repository.js';
import type { SeoBriefJsonObject, SeoBriefJsonValue } from '../../domain/seo-briefing.types.js';
import { SeoBriefRunNotFoundError } from '../../errors/seo-brief-run-not-found.error.js';
import { ScoreKeywordCandidatesCommand } from './score-keyword-candidates.command.js';

const MAX_SCORING_CANDIDATES = 400;
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
    description: 'Queries about saving in dollars, inflation, naira, and local currency protection.',
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

      const payload: SeoBriefJsonObject = {
        artifactVersion: 'keyword_candidate_scoring_v2',
        sourceArtifactType: 'dirty_keyword_pool',
        filteringMode: 'deterministic_staged_filtering',
        scoringCriteria: [
          'noise_filter',
          'semantic_bucket',
          'topic_fit',
          'product_fit',
          'audience_fit',
          'intent_fit',
          'risk_compliance',
          'evidence',
        ],
        notes: [
          'Dirty-pool candidates are filtered through a staged deterministic pipeline instead of one large LLM request.',
          'Stage 1 removes obvious noise and compliance-risk queries.',
          'Stage 2 assigns candidates to semantic buckets based on the final algorithm.',
          'Stage 3 scores topic fit, product fit, audience fit, intent fit, risk/compliance, and evidence.',
          'Stage 4 shortlists the strongest candidates per bucket so downstream LLM steps stay small.',
        ],
        inputCandidateCount: readNumber(dirtyPool.candidateCount) ?? dirtyCandidates.length,
        scoredCandidateCount: dirtyCandidates.length,
        llmScoredCandidateCount: 0,
        aiScoredCandidateCount: 0,
        keptAfterNoiseCount: prefilter.scorableCandidates.length,
        hardExcludedCandidateCount: prefilter.rejectedCandidates.length,
        scoringCandidateLimit: MAX_SCORING_CANDIDATES,
        acceptedPerBucketLimit: MAX_ACCEPTED_PER_BUCKET,
        maybePerBucketLimit: MAX_MAYBE_PER_BUCKET,
        hardExcludeTerms: HARD_EXCLUDE_TERMS,
        boostPatterns: BOOST_PATTERNS,
        acceptedCount: staged.accepted.length,
        maybeCount: staged.maybe.length,
        rejectedCount: staged.rejected.length,
        summary: {
          acceptedCount: staged.accepted.length,
          maybeCount: staged.maybe.length,
          rejectedCount: staged.rejected.length,
          hardExcludedCandidateCount: prefilter.rejectedCandidates.length,
          keptAfterNoiseCount: prefilter.scorableCandidates.length,
          llmCallCount: 0,
          notes: [
            `Filtered ${dirtyCandidates.length} dirty candidates without an LLM scoring call.`,
            `Kept ${prefilter.scorableCandidates.length} after noise filtering.`,
            `Shortlisted up to ${MAX_ACCEPTED_PER_BUCKET} accepted and ${MAX_MAYBE_PER_BUCKET} maybe candidates per semantic bucket.`,
          ],
        } as unknown as SeoBriefJsonValue,
        stagedFiltering: staged.stagedFiltering as unknown as SeoBriefJsonValue,
        accepted: staged.accepted as unknown as SeoBriefJsonValue,
        maybe: staged.maybe as unknown as SeoBriefJsonValue,
        rejected: staged.rejected as unknown as SeoBriefJsonValue,
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
        acceptedCount: staged.accepted.length,
        maybeCount: staged.maybe.length,
        rejectedCount: staged.rejected.length,
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
        description: 'Reject obvious navigation, scams, unsupported topics, and compliance-risk noise.',
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
  if (matchesAny(normalized, ['cash out', 'cashout', 'withdraw', 'sell usdt', 'convert usdt', 'bank account'])) {
    return 'usdt_cashout';
  }
  if (matchesAny(normalized, ['trc20', 'trc 20', 'trc-20', 'bep20', 'bep 20', 'bep-20', 'network', 'transfer fee'])) {
    return 'network_education';
  }
  if (matchesAny(normalized, ['vs', 'versus', 'compare', 'comparison', 'best', 'alternative', 'nexo', 'binance earn', 'trust wallet'])) {
    return 'comparison_alternatives';
  }
  if (matchesAny(normalized, ['scam', 'safe', 'safety', 'risk', 'trust', 'secure', 'wallet'])) {
    return 'wallet_safety';
  }
  if (matchesAny(normalized, ['fee', 'fees', 'lock', 'lockup', 'lock period', 'risk'])) {
    return 'fees_and_risk';
  }
  if (matchesAny(normalized, ['earn', 'yield', 'interest', 'staking', 'stake', 'saving', 'savings', 'passive income', 'apy'])) {
    return 'stablecoin_yield';
  }
  if (matchesAny(normalized, ['dollar', 'dollars', 'inflation', 'devaluation', 'naira', 'save money'])) {
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
  const directYield = matchesAny(normalized, ['earn', 'yield', 'interest', 'staking', 'stake', 'saving', 'savings', 'passive income']);
  const trustOrRisk = matchesAny(normalized, ['safe', 'safety', 'risk', 'scam', 'trust', 'lock', 'fee']);
  const competitorComparison = bucket === 'comparison_alternatives';

  if (hasUsdt && directYield) {
    return { label: 'high', insertionType: 'direct_solution', score: 88 };
  }
  if (hasUsdt && (trustOrRisk || competitorComparison || bucket === 'fees_and_risk')) {
    return { label: 'high', insertionType: 'education_bridge', score: 82 };
  }
  if (hasUsdt && (bucket === 'binance_p2p' || bucket === 'usdt_cashout' || bucket === 'network_education')) {
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
  if (matchesAny(normalized, ['beginner', 'beginners', 'safe', 'simple', 'nigeria', 'naira', 'mobile'])) {
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
  if (riskFlags.some((flag) => flag === 'scam_or_free_money' || flag === 'credential_or_seed_phrase')) {
    return 0;
  }
  let score = 88;
  if (matchesAny(normalized, ['guaranteed', 'risk free', 'daily profit', '100 usdt daily', 'double money'])) {
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
    reasons.push('Accepted because fit, intent, compliance, and evidence are strong enough to continue.');
  } else if (params.status === 'maybe') {
    reasons.push('Kept as maybe because the query can be useful but needs review or careful framing.');
  } else {
    reasons.push('Rejected because fit, risk, or evidence is too weak for the next algorithm steps.');
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
  if (intent === 'commercial' || bucket === 'comparison_alternatives' || bucket === 'stablecoin_yield') {
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
  if (matchesAny(normalized, ['free usdt', 'free tether', 'generator', 'faucet', 'airdrop', 'flasher', 'double money'])) {
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

function groupDecisionsByBucket(decisions: StagedDecision[]): Record<SemanticBucket, StagedDecision[]> {
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

  return decisions.reduce(
    (groups, decision) => {
      groups[decision.bucket].push(decision);
      return groups;
    },
    initialGroups,
  );
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
  return HARD_EXCLUDE_TERMS.find((term) => hasSearchTerm(normalized, normalizeKeywordText(term))) ?? null;
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

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readBoolean(value: unknown): boolean {
  return value === true;
}

function normalizeKeywordText(value: string): string {
  return value.replace(/\s+/g, ' ').replace(/[?!.\u3002\uff01\uff1f]+$/u, '').trim().toLowerCase();
}
