import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, type ICommandHandler } from '@nestjs/cqrs';
import { resolveSeoBriefKeywordExpansionPrompt } from '../../config/seo-brief-keyword-expansion-prompt.js';
import { SEO_BRIEF_OPERATIONAL_LIMITS } from '../../config/seo-brief-operational-limits.js';
import { SeoBriefArtifact } from '../../domain/seo-brief-artifact.entity.js';
import { SeoBriefArtifactRepository } from '../../domain/seo-brief-artifact.repository.js';
import type { SeoBriefRunStatus } from '../../domain/seo-brief-run.aggregate.js';
import { SeoBriefRun } from '../../domain/seo-brief-run.aggregate.js';
import { SeoBriefRunRepository } from '../../domain/seo-brief-run.repository.js';
import { SeoBriefRunStep } from '../../domain/seo-brief-run-step.entity.js';
import { SeoBriefRunStepRepository } from '../../domain/seo-brief-run-step.repository.js';
import type {
  SeoBriefBrandMemorySnapshot,
  SeoBriefJsonObject,
  SeoBriefJsonValue,
} from '../../domain/seo-briefing.types.js';
import { SeoBriefProjectNotFoundError } from '../../errors/seo-brief-project-not-found.error.js';
import {
  BrandMemoryReaderPort,
  type BrandMemoryReadResult,
} from '../../ports/brand-memory-reader.port.js';
import type { SeoBriefAiModelMode } from '../../ports/seo-brief-ai.port.js';
import {
  CreateSeoBriefRunCommand,
  type CreateSeoBriefRunInput,
} from './create-seo-brief-run.command.js';

export interface CreateSeoBriefRunResult {
  runId: string;
  status: SeoBriefRunStatus;
  projectId: string | null;
  createdAt: Date;
  deduplicated: boolean;
}

interface NormalizedCreateSeoBriefRunInput {
  projectId: string | null;
  aiModelMode: SeoBriefAiModelMode;
  topicHint: string;
  topicSeed: string;
  hypothesesCount: number;
  serpEnrichmentCount: number;
  competitorKeywordsJsonId: string | null;
  country: string;
  language: string;
  locationName: string | null;
  audience: string;
  userPains: string[];
  userScenarios: string[];
  keywordExpansionPrompt: string;
  productName: string;
  productDescription: string;
  keyMessage: string | null;
  knownCompetitorsMustInclude: string[];
  knownCompetitorsOptional: string[];
  knownCompetitorsExclude: string[];
  brandConstraints: string[];
  claimsConstraints: string[];
  preferredAngle: string | null;
  excludedTopics: string[];
  campaignContext: string | null;
  audienceBefore: string | null;
  audienceAfter: string | null;
  cta: string | null;
  seoWeight: number;
  productWeight: number;
}

interface RunDeduplicationCandidate {
  runId: string;
  createdAt: Date;
  updatedAt: Date;
  status: SeoBriefRunStatus;
}

function normalizeAiModelMode(value?: string | null): SeoBriefAiModelMode {
  return value === 'flash' || value === 'pro' || value === 'pro_thinking' ? value : 'pro';
}

function normalizeText(value?: string | null): string | null {
  const nextValue = value?.trim();
  return nextValue ? nextValue : null;
}

function normalizeRequiredText(value: string): string {
  const nextValue = value.trim();
  if (nextValue.length === 0) {
    throw new Error('SEO brief run input contains empty required text fields');
  }

  return nextValue;
}

function normalizeRequiredInputText(value?: string | null): string {
  return normalizeRequiredText(value ?? '');
}

function normalizeTextList(value?: string[] | null): string[] {
  return Array.from(
    new Set(
      (value ?? [])
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    ),
  );
}

function clampUnit(value: number): number {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return 0;
  }

  if (value < 0) {
    return 0;
  }

  if (value > 1) {
    return 1;
  }

  return value;
}

function normalizeWeights(input?: CreateSeoBriefRunInput['seoProductBalance'] | null): {
  productWeight: number;
  seoWeight: number;
} {
  const seoWeight = input?.seoWeight == null ? null : clampUnit(input.seoWeight);
  const productWeight = input?.productWeight == null ? null : clampUnit(input.productWeight);

  if (seoWeight == null && productWeight == null) {
    return { seoWeight: 0.5, productWeight: 0.5 };
  }

  if (seoWeight != null && productWeight == null) {
    return { seoWeight, productWeight: clampUnit(1 - seoWeight) };
  }

  if (seoWeight == null && productWeight != null) {
    return { seoWeight: clampUnit(1 - productWeight), productWeight };
  }

  const total = (seoWeight ?? 0) + (productWeight ?? 0);
  if (total <= 0) {
    return { seoWeight: 0.5, productWeight: 0.5 };
  }

  return {
    seoWeight: (seoWeight ?? 0) / total,
    productWeight: (productWeight ?? 0) / total,
  };
}

function normalizePositiveInteger(value: number | null | undefined, fallback: number): number {
  if (value == null || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(1, Math.floor(value));
}

function normalizeInput(input: CreateSeoBriefRunInput): NormalizedCreateSeoBriefRunInput {
  const weights = normalizeWeights(input.seoProductBalance);
  const topicHint = normalizeRequiredInputText(input.topicHint ?? input.topicSeed);
  const hypothesesCount = normalizePositiveInteger(input.hypothesesCount, 10);
  const requestedSerpEnrichmentCount = normalizePositiveInteger(input.serpEnrichmentCount, 10);

  return {
    projectId: normalizeText(input.projectId),
    aiModelMode: normalizeAiModelMode(input.aiModelMode),
    topicHint,
    topicSeed: topicHint,
    hypothesesCount,
    serpEnrichmentCount: Math.min(requestedSerpEnrichmentCount, hypothesesCount),
    competitorKeywordsJsonId: normalizeText(input.competitorKeywordsJsonId),
    country: normalizeRequiredText(input.market.country),
    language: normalizeRequiredText(input.market.language),
    locationName: normalizeText(input.market.locationName),
    audience: normalizeRequiredText(input.audience),
    userPains: normalizeTextList(input.userPains),
    userScenarios: normalizeTextList(input.userScenarios),
    keywordExpansionPrompt: resolveSeoBriefKeywordExpansionPrompt(input.keywordExpansionPrompt),
    productName: normalizeRequiredText(input.product.name),
    productDescription: normalizeRequiredText(input.product.description),
    keyMessage: normalizeText(input.keyMessage),
    knownCompetitorsMustInclude: normalizeTextList(input.knownCompetitors?.mustInclude),
    knownCompetitorsOptional: normalizeTextList(input.knownCompetitors?.optional),
    knownCompetitorsExclude: normalizeTextList(input.knownCompetitors?.exclude),
    brandConstraints: normalizeTextList(input.brandConstraints),
    claimsConstraints: normalizeTextList(input.claimsConstraints),
    preferredAngle: normalizeText(input.preferredAngle),
    excludedTopics: normalizeTextList(input.excludedTopics),
    campaignContext: normalizeText(input.campaignContext),
    audienceBefore: normalizeText(input.audienceShift?.before),
    audienceAfter: normalizeText(input.audienceShift?.after),
    cta: normalizeText(input.cta),
    seoWeight: weights.seoWeight,
    productWeight: weights.productWeight,
  };
}

function createInputBackedBrandMemorySnapshot(
  input: NormalizedCreateSeoBriefRunInput,
): SeoBriefBrandMemorySnapshot {
  return {
    brandName: input.productName,
    productDescription: input.productDescription,
    targetAudience: input.audience,
    approvedFacts: [],
    forbiddenClaims: [],
    glossary: {},
    bannedPhrases: [],
    requiredPhrases: [],
    brandDocs: [],
    adaptationPromptRules: null,
  };
}

function mergeBrandMemorySnapshot(
  input: NormalizedCreateSeoBriefRunInput,
  source: BrandMemoryReadResult | null,
): SeoBriefBrandMemorySnapshot {
  const inputBackedSnapshot = createInputBackedBrandMemorySnapshot(input);
  if (!source) {
    return inputBackedSnapshot;
  }

  return {
    brandName: source.brandMemorySnapshot.brandName ?? inputBackedSnapshot.brandName,
    productDescription:
      source.brandMemorySnapshot.productDescription ?? inputBackedSnapshot.productDescription,
    targetAudience: source.brandMemorySnapshot.targetAudience ?? inputBackedSnapshot.targetAudience,
    approvedFacts: source.brandMemorySnapshot.approvedFacts,
    forbiddenClaims: source.brandMemorySnapshot.forbiddenClaims,
    glossary: source.brandMemorySnapshot.glossary,
    bannedPhrases: source.brandMemorySnapshot.bannedPhrases,
    requiredPhrases: source.brandMemorySnapshot.requiredPhrases,
    brandDocs: source.brandMemorySnapshot.brandDocs,
    adaptationPromptRules: source.brandMemorySnapshot.adaptationPromptRules,
  };
}

function createNormalizedInputArtifactPayload(
  input: NormalizedCreateSeoBriefRunInput,
): SeoBriefJsonObject {
  return {
    inputVersion: 'topic_hint_manual_pains_v2',
    projectId: input.projectId,
    aiModelMode: input.aiModelMode,
    topicHint: input.topicHint,
    topicSeed: input.topicSeed,
    hypothesesCount: input.hypothesesCount,
    serpEnrichmentCount: input.serpEnrichmentCount,
    competitorKeywordsJsonId: input.competitorKeywordsJsonId,
    market: {
      country: input.country,
      language: input.language,
      locationName: input.locationName,
    },
    audience: input.audience,
    userPains: input.userPains,
    userScenarios: input.userScenarios,
    keywordExpansionPrompt: input.keywordExpansionPrompt,
    product: {
      name: input.productName,
      description: input.productDescription,
    },
    keyMessage: input.keyMessage,
    knownCompetitors: {
      mustInclude: input.knownCompetitorsMustInclude,
      optional: input.knownCompetitorsOptional,
      exclude: input.knownCompetitorsExclude,
    },
    brandConstraints: input.brandConstraints,
    claimsConstraints: input.claimsConstraints,
    preferredAngle: input.preferredAngle,
    excludedTopics: input.excludedTopics,
    campaignContext: input.campaignContext,
    audienceShift: {
      before: input.audienceBefore,
      after: input.audienceAfter,
    },
    cta: input.cta,
    seoProductBalance: {
      seoWeight: input.seoWeight,
      productWeight: input.productWeight,
    },
  };
}

function createManualUserPainScenariosArtifactPayload(
  input: NormalizedCreateSeoBriefRunInput,
): SeoBriefJsonObject {
  return {
    artifactVersion: 'manual_user_pain_scenarios_v1',
    algorithmStep: 'input_manual_user_pains',
    source: 'marketer_input',
    topicHintInterpretation:
      'User pains and scenarios were provided manually by the marketer in Step 0 input.',
    userPains: input.userPains.map((pain) => ({
      pain,
      whyRelevant: 'Provided by marketer input as a user pain for this SEO brief run.',
      productConnection: 'education',
    })) as unknown as SeoBriefJsonValue,
    userScenarios: input.userScenarios.map((scenario) => ({
      scenario,
      type: 'action',
      whyCheck: 'Provided by marketer input as a search or behavior scenario.',
      productFitHypothesis: 'education_bridge',
    })) as unknown as SeoBriefJsonValue,
    riskNotes: input.claimsConstraints,
    notes: [
      'This artifact is not AI-generated.',
      'It exists so downstream keyword, scoring, clustering, and Product Fit steps can use marketer-provided pains directly.',
    ],
  };
}

function createBrandMemoryArtifactPayload(
  source: BrandMemoryReadResult | null,
  snapshot: SeoBriefBrandMemorySnapshot,
): SeoBriefJsonObject {
  return {
    artifactVersion: 'brand_memory_snapshot_v1',
    algorithmStep: 'brand_memory_snapshot',
    purpose:
      'Source-of-truth product, trust, claims, phrase, and brand constraints used by downstream SEO brief steps.',
    source: source ? 'project_brand_memory' : 'input_fallback',
    projectId: source?.projectId ?? null,
    projectName: source?.projectName ?? null,
    summary: {
      brandName: snapshot.brandName,
      hasProjectBrandMemory: Boolean(source),
      approvedFactCount: snapshot.approvedFacts.length,
      forbiddenClaimCount: snapshot.forbiddenClaims.length,
      requiredPhraseCount: snapshot.requiredPhrases.length,
      bannedPhraseCount: snapshot.bannedPhrases.length,
      glossaryTermCount: Object.keys(snapshot.glossary).length,
      brandDocCount: snapshot.brandDocs.length,
      hasAdaptationPromptRules: Boolean(snapshot.adaptationPromptRules),
    },
    usageRules: [
      'Use approvedFacts, glossary, requiredPhrases, and brandDocs as allowed context.',
      'Use forbiddenClaims and bannedPhrases as hard constraints.',
      'Do not infer persistent brand facts from marketer one-off files unless they are already in this snapshot.',
    ],
    snapshot: snapshot as unknown as SeoBriefJsonValue,
  };
}

function createSeoProductContextArtifactPayload(
  input: NormalizedCreateSeoBriefRunInput,
  brandMemorySource: BrandMemoryReadResult | null,
  brandMemorySnapshot: SeoBriefBrandMemorySnapshot,
): SeoBriefJsonObject {
  return {
    artifactVersion: 'seo_product_context_v1',
    algorithmStep: 'seo_product_context',
    purpose:
      'Compact SEO research context built from marketer input and Brand Memory before keyword generation.',
    sourcePriority: [
      'Brand Memory is the source of truth for persistent product facts, trust claims, forbidden claims, and required wording.',
      'Marketer input defines this run direction, market, audience, competitors, temporary constraints, and preferred angle.',
      'If marketer input conflicts with Brand Memory, Brand Memory constraints win until manually updated.',
    ],
    researchFrame: {
      topicHint: input.topicHint,
      market: {
        country: input.country,
        language: input.language,
        locationName: input.locationName,
      },
      audience: input.audience,
      preferredAngle: input.preferredAngle,
      keyMessage: input.keyMessage,
      cta: input.cta,
      campaignContext: input.campaignContext,
      audienceShift: {
        before: input.audienceBefore,
        after: input.audienceAfter,
      },
      manualUserContext: {
        userPains: input.userPains,
        userScenarios: input.userScenarios,
      },
    },
    v2Controls: {
      hypothesesCount: input.hypothesesCount,
      serpEnrichmentCount: input.serpEnrichmentCount,
      competitorKeywordsJsonId: input.competitorKeywordsJsonId,
    },
    competitorContext: {
      mustInclude: input.knownCompetitorsMustInclude,
      optional: input.knownCompetitorsOptional,
      exclude: input.knownCompetitorsExclude,
    },
    marketerConstraints: {
      brandConstraints: input.brandConstraints,
      claimsConstraints: input.claimsConstraints,
      excludedTopics: input.excludedTopics,
    },
    brandMemoryContext: {
      source: brandMemorySource ? 'project_brand_memory' : 'input_fallback',
      projectId: brandMemorySource?.projectId ?? null,
      projectName: brandMemorySource?.projectName ?? null,
      brandName: brandMemorySnapshot.brandName,
      productDescription: brandMemorySnapshot.productDescription,
      targetAudience: brandMemorySnapshot.targetAudience,
      approvedFacts: brandMemorySnapshot.approvedFacts,
      forbiddenClaims: brandMemorySnapshot.forbiddenClaims,
      glossary: brandMemorySnapshot.glossary,
      requiredPhrases: brandMemorySnapshot.requiredPhrases,
      bannedPhrases: brandMemorySnapshot.bannedPhrases,
      brandDocs: brandMemorySnapshot.brandDocs as unknown as SeoBriefJsonValue,
      adaptationPromptRules: brandMemorySnapshot.adaptationPromptRules,
    },
    generationGuardrails: [
      'Generate SEO ideas from the researchFrame, not from the brand name alone.',
      'Use brandMemoryContext to keep product fit, trust, and claims accurate.',
      'Do not add claims that are absent from approvedFacts or productDescription.',
      'Treat competitorContext as research guidance, not as mandatory keyword text.',
      'Avoid excludedTopics and bannedPhrases in generated SEO outputs.',
    ],
  };
}

function createOperationalLimitsPayload(): SeoBriefJsonObject {
  return {
    duplicateScanLimit: SEO_BRIEF_OPERATIONAL_LIMITS.duplicateScanLimit,
    duplicateWindowMs: SEO_BRIEF_OPERATIONAL_LIMITS.duplicateWindowMs,
    keywordExpansionLimit: SEO_BRIEF_OPERATIONAL_LIMITS.keywordExpansionLimit,
    relatedKeywordLimit: SEO_BRIEF_OPERATIONAL_LIMITS.relatedKeywordLimit,
    relatedKeywordSeedLimit: SEO_BRIEF_OPERATIONAL_LIMITS.relatedKeywordSeedLimit,
    serpResearchKeywordLimit: SEO_BRIEF_OPERATIONAL_LIMITS.serpResearchKeywordLimit,
    serpResultDepth: SEO_BRIEF_OPERATIONAL_LIMITS.serpResultDepth,
    domainMetricsLimit: SEO_BRIEF_OPERATIONAL_LIMITS.domainMetricsLimit,
    onpageTargetLimit: SEO_BRIEF_OPERATIONAL_LIMITS.onpageTargetLimit,
    maxKeywordUniverseItems: SEO_BRIEF_OPERATIONAL_LIMITS.maxKeywordUniverseItems,
    maxClustersToScore: SEO_BRIEF_OPERATIONAL_LIMITS.maxClustersToScore,
    maxManualRerunAttemptsPerStage: SEO_BRIEF_OPERATIONAL_LIMITS.maxManualRerunAttemptsPerStage,
    minFinalClusterScore: SEO_BRIEF_OPERATIONAL_LIMITS.minFinalClusterScore,
    minProductScore: SEO_BRIEF_OPERATIONAL_LIMITS.minProductScore,
  };
}

function createRunFingerprint(input: NormalizedCreateSeoBriefRunInput): string {
  return JSON.stringify({
    projectId: input.projectId,
    aiModelMode: input.aiModelMode,
    topicHint: input.topicHint.trim().toLowerCase(),
    topicSeed: input.topicSeed.trim().toLowerCase(),
    country: input.country.trim().toLowerCase(),
    language: input.language.trim().toLowerCase(),
    audience: input.audience.trim().toLowerCase(),
    keywordExpansionPrompt: input.keywordExpansionPrompt.trim().toLowerCase(),
    productName: input.productName.trim().toLowerCase(),
    productDescription: input.productDescription.trim().toLowerCase(),
    keyMessage: input.keyMessage?.trim().toLowerCase() ?? null,
    knownCompetitorsMustInclude: input.knownCompetitorsMustInclude.map((item) =>
      item.trim().toLowerCase(),
    ),
    knownCompetitorsOptional: input.knownCompetitorsOptional.map((item) =>
      item.trim().toLowerCase(),
    ),
    knownCompetitorsExclude: input.knownCompetitorsExclude.map((item) =>
      item.trim().toLowerCase(),
    ),
    userPains: input.userPains.map((item) => item.trim().toLowerCase()),
    userScenarios: input.userScenarios.map((item) => item.trim().toLowerCase()),
    hypothesesCount: input.hypothesesCount,
    serpEnrichmentCount: input.serpEnrichmentCount,
    competitorKeywordsJsonId: input.competitorKeywordsJsonId?.trim().toLowerCase() ?? null,
    brandConstraints: input.brandConstraints.map((item) => item.trim().toLowerCase()),
    claimsConstraints: input.claimsConstraints.map((item) => item.trim().toLowerCase()),
    preferredAngle: input.preferredAngle?.trim().toLowerCase() ?? null,
    excludedTopics: input.excludedTopics.map((item) => item.trim().toLowerCase()),
    campaignContext: input.campaignContext?.trim().toLowerCase() ?? null,
    audienceBefore: input.audienceBefore?.trim().toLowerCase() ?? null,
    audienceAfter: input.audienceAfter?.trim().toLowerCase() ?? null,
    cta: input.cta?.trim().toLowerCase() ?? null,
    seoWeight: Number(input.seoWeight.toFixed(4)),
    productWeight: Number(input.productWeight.toFixed(4)),
  });
}

function extractKeywordExpansionPromptFromArtifacts(artifacts: SeoBriefArtifact[]): string {
  const payload = extractNormalizedInputPayload(artifacts);
  if (!payload || Array.isArray(payload) || typeof payload !== 'object') {
    return resolveSeoBriefKeywordExpansionPrompt();
  }

  return resolveSeoBriefKeywordExpansionPrompt(
    typeof payload.keywordExpansionPrompt === 'string' ? payload.keywordExpansionPrompt : null,
  );
}

function extractCampaignContextFromArtifacts(artifacts: SeoBriefArtifact[]): string | null {
  const payload = extractNormalizedInputPayload(artifacts);
  if (!payload || Array.isArray(payload) || typeof payload !== 'object') {
    return null;
  }

  return typeof payload.campaignContext === 'string' && payload.campaignContext.trim()
    ? payload.campaignContext.trim()
    : null;
}

function extractNormalizedInputPayload(artifacts: SeoBriefArtifact[]): SeoBriefJsonValue | null {
  const inputArtifact = [...artifacts]
    .reverse()
    .find((artifact) => artifact.artifactType === 'normalized_input');

  return inputArtifact?.payload ?? null;
}

function extractStringArrayFromPayload(
  payload: SeoBriefJsonValue | null,
  field: string,
): string[] {
  if (!payload || Array.isArray(payload) || typeof payload !== 'object') {
    return [];
  }

  const value = payload[field];
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
}

function extractKnownCompetitorsFromPayload(
  payload: SeoBriefJsonValue | null,
): Pick<
  NormalizedCreateSeoBriefRunInput,
  'knownCompetitorsMustInclude' | 'knownCompetitorsOptional' | 'knownCompetitorsExclude'
> {
  if (!payload || Array.isArray(payload) || typeof payload !== 'object') {
    return {
      knownCompetitorsMustInclude: [],
      knownCompetitorsOptional: [],
      knownCompetitorsExclude: [],
    };
  }

  const value = payload.knownCompetitors;
  if (!value || Array.isArray(value) || typeof value !== 'object') {
    return {
      knownCompetitorsMustInclude: [],
      knownCompetitorsOptional: [],
      knownCompetitorsExclude: [],
    };
  }

  return {
    knownCompetitorsMustInclude: extractStringArrayFromPayload(value, 'mustInclude'),
    knownCompetitorsOptional: extractStringArrayFromPayload(value, 'optional'),
    knownCompetitorsExclude: extractStringArrayFromPayload(value, 'exclude'),
  };
}

function extractTextFromPayload(payload: SeoBriefJsonValue | null, field: string): string | null {
  if (!payload || Array.isArray(payload) || typeof payload !== 'object') {
    return null;
  }

  const value = payload[field];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function extractNumberFromPayload(
  payload: SeoBriefJsonValue | null,
  field: string,
  fallback: number,
): number {
  if (!payload || Array.isArray(payload) || typeof payload !== 'object') {
    return fallback;
  }

  const value = payload[field];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function extractAiModelModeFromArtifacts(artifacts: SeoBriefArtifact[]): SeoBriefAiModelMode {
  const payload = extractNormalizedInputPayload(artifacts);
  if (!payload || Array.isArray(payload) || typeof payload !== 'object') {
    return 'pro';
  }

  return normalizeAiModelMode(typeof payload.aiModelMode === 'string' ? payload.aiModelMode : null);
}

function isDeduplicationEligibleStatus(status: SeoBriefRunStatus): boolean {
  return (
    status === 'created' ||
    status === 'awaiting_confirmation' ||
    status === 'queued' ||
    status === 'running'
  );
}

@CommandHandler(CreateSeoBriefRunCommand)
export class CreateSeoBriefRunHandler
  implements ICommandHandler<CreateSeoBriefRunCommand, CreateSeoBriefRunResult>
{
  constructor(
    @Inject(BrandMemoryReaderPort)
    private readonly brandMemoryReader: BrandMemoryReaderPort,
    @Inject(SeoBriefRunRepository)
    private readonly runRepository: SeoBriefRunRepository,
    @Inject(SeoBriefRunStepRepository)
    private readonly runStepRepository: SeoBriefRunStepRepository,
    @Inject(SeoBriefArtifactRepository)
    private readonly artifactRepository: SeoBriefArtifactRepository,
    @Inject(EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateSeoBriefRunCommand): Promise<CreateSeoBriefRunResult> {
    const input = normalizeInput(command.input);
    const brandMemorySource = input.projectId
      ? await this.brandMemoryReader.readByProjectId(input.projectId)
      : null;

    if (input.projectId && !brandMemorySource) {
      throw new SeoBriefProjectNotFoundError(input.projectId);
    }

    const brandMemorySnapshot = mergeBrandMemorySnapshot(input, brandMemorySource);
    const duplicate = await this.findDuplicateRun(input);
    if (duplicate) {
      return {
        runId: duplicate.runId,
        status: duplicate.status,
        projectId: input.projectId,
        createdAt: duplicate.createdAt,
        deduplicated: true,
      };
    }

    const run = SeoBriefRun.create({
      projectId: input.projectId,
      topicSeed: input.topicSeed,
      country: input.country,
      language: input.language,
      audience: input.audience,
      productName: input.productName,
      productDescription: input.productDescription,
      brandMemorySnapshot,
      keyMessage: input.keyMessage,
      audienceBefore: input.audienceBefore,
      audienceAfter: input.audienceAfter,
      cta: input.cta,
      seoWeight: input.seoWeight,
      productWeight: input.productWeight,
    });

    const createdStep = SeoBriefRunStep.create({
      runId: run.id,
      stage: 'created',
      status: 'completed',
      startedAt: run.createdAt,
      finishedAt: run.createdAt,
    });
    const normalizedInputArtifact = SeoBriefArtifact.create({
      runId: run.id,
      stage: 'created',
      artifactType: 'normalized_input',
      payload: createNormalizedInputArtifactPayload(input),
    });
    const brandMemoryArtifact = SeoBriefArtifact.create({
      runId: run.id,
      stage: 'created',
      artifactType: 'brand_memory_snapshot',
      payload: createBrandMemoryArtifactPayload(brandMemorySource, brandMemorySnapshot),
    });
    const manualUserPainScenariosArtifact = SeoBriefArtifact.create({
      runId: run.id,
      stage: 'created',
      artifactType: 'user_pain_scenarios',
      payload: createManualUserPainScenariosArtifactPayload(input),
    });
    const seoProductContextArtifact = SeoBriefArtifact.create({
      runId: run.id,
      stage: 'created',
      artifactType: 'seo_product_context',
      payload: createSeoProductContextArtifactPayload(input, brandMemorySource, brandMemorySnapshot),
    });
    const operationalLimitsArtifact = SeoBriefArtifact.create({
      runId: run.id,
      stage: 'created',
      artifactType: 'operational_limits_snapshot',
      payload: createOperationalLimitsPayload(),
    });

    await this.runRepository.save(run);
    await this.runStepRepository.save(createdStep);
    await this.artifactRepository.save(normalizedInputArtifact);
    await this.artifactRepository.save(brandMemoryArtifact);
    await this.artifactRepository.save(manualUserPainScenariosArtifact);
    await this.artifactRepository.save(seoProductContextArtifact);
    await this.artifactRepository.save(operationalLimitsArtifact);
    this.eventBus.publishAll(run.pullEvents());
    run.awaitConfirmation();
    await this.runRepository.save(run);

    return {
      runId: run.id,
      status: run.status,
      projectId: run.projectId,
      createdAt: run.createdAt,
      deduplicated: false,
    };
  }

  private async findDuplicateRun(
    input: NormalizedCreateSeoBriefRunInput,
  ): Promise<RunDeduplicationCandidate | null> {
    const fingerprint = createRunFingerprint(input);
    const runs = await this.runRepository.findMany({
      limit: SEO_BRIEF_OPERATIONAL_LIMITS.duplicateScanLimit,
      projectId: input.projectId,
    });
    const now = Date.now();

    for (const candidate of runs) {
      if (!isDeduplicationEligibleStatus(candidate.status)) {
        continue;
      }
      if (now - candidate.updatedAt.getTime() > SEO_BRIEF_OPERATIONAL_LIMITS.duplicateWindowMs) {
        continue;
      }
      const candidateArtifacts = await this.artifactRepository.findByRunId(candidate.id);
      if (
        (() => {
          const candidateInputPayload = extractNormalizedInputPayload(candidateArtifacts);
          const candidateKnownCompetitors =
            extractKnownCompetitorsFromPayload(candidateInputPayload);
          return createRunFingerprint({
            projectId: candidate.projectId,
            aiModelMode: extractAiModelModeFromArtifacts(candidateArtifacts),
            topicHint:
              extractTextFromPayload(candidateInputPayload, 'topicHint') ?? candidate.topicSeed,
            topicSeed: candidate.topicSeed,
            country: candidate.country,
            language: candidate.language,
            locationName: candidate.country,
            audience: candidate.audience,
            userPains: extractStringArrayFromPayload(candidateInputPayload, 'userPains'),
            userScenarios: extractStringArrayFromPayload(candidateInputPayload, 'userScenarios'),
            hypothesesCount: extractNumberFromPayload(candidateInputPayload, 'hypothesesCount', 10),
            serpEnrichmentCount: extractNumberFromPayload(
              candidateInputPayload,
              'serpEnrichmentCount',
              10,
            ),
            competitorKeywordsJsonId: extractTextFromPayload(
              candidateInputPayload,
              'competitorKeywordsJsonId',
            ),
            keywordExpansionPrompt: extractKeywordExpansionPromptFromArtifacts(candidateArtifacts),
            productName: candidate.productName,
            productDescription: candidate.productDescription,
            keyMessage: candidate.keyMessage,
            ...candidateKnownCompetitors,
            brandConstraints: extractStringArrayFromPayload(
              candidateInputPayload,
              'brandConstraints',
            ),
            claimsConstraints: extractStringArrayFromPayload(
              candidateInputPayload,
              'claimsConstraints',
            ),
            preferredAngle: extractTextFromPayload(candidateInputPayload, 'preferredAngle'),
            excludedTopics: extractStringArrayFromPayload(candidateInputPayload, 'excludedTopics'),
            campaignContext: extractCampaignContextFromArtifacts(candidateArtifacts),
            audienceBefore: candidate.audienceBefore,
            audienceAfter: candidate.audienceAfter,
            cta: candidate.cta,
            seoWeight: candidate.seoWeight,
            productWeight: candidate.productWeight,
          });
        })() === fingerprint
      ) {
        return {
          runId: candidate.id,
          createdAt: candidate.createdAt,
          updatedAt: candidate.updatedAt,
          status: candidate.status,
        };
      }
    }

    return null;
  }
}
