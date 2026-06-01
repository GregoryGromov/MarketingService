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
import { SeoBriefRunJobPort } from '../../ports/seo-brief-run-job.port.js';
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
  topicSeed: string;
  country: string;
  language: string;
  locationName: string | null;
  audience: string;
  keywordExpansionPrompt: string;
  productName: string;
  productDescription: string;
  keyMessage: string | null;
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

function normalizeInput(input: CreateSeoBriefRunInput): NormalizedCreateSeoBriefRunInput {
  const weights = normalizeWeights(input.seoProductBalance);

  return {
    projectId: normalizeText(input.projectId),
    topicSeed: normalizeRequiredText(input.topicSeed),
    country: normalizeRequiredText(input.market.country),
    language: normalizeRequiredText(input.market.language),
    locationName: normalizeText(input.market.locationName),
    audience: normalizeRequiredText(input.audience),
    keywordExpansionPrompt: resolveSeoBriefKeywordExpansionPrompt(input.keywordExpansionPrompt),
    productName: normalizeRequiredText(input.product.name),
    productDescription: normalizeRequiredText(input.product.description),
    keyMessage: normalizeText(input.keyMessage),
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
    projectId: input.projectId,
    topicSeed: input.topicSeed,
    market: {
      country: input.country,
      language: input.language,
      locationName: input.locationName,
    },
    audience: input.audience,
    keywordExpansionPrompt: input.keywordExpansionPrompt,
    product: {
      name: input.productName,
      description: input.productDescription,
    },
    keyMessage: input.keyMessage,
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

function createBrandMemoryArtifactPayload(
  source: BrandMemoryReadResult | null,
  snapshot: SeoBriefBrandMemorySnapshot,
): SeoBriefJsonObject {
  return {
    source: source ? 'project_brand_memory' : 'input_fallback',
    projectId: source?.projectId ?? null,
    projectName: source?.projectName ?? null,
    snapshot: snapshot as unknown as SeoBriefJsonValue,
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
    topicSeed: input.topicSeed.trim().toLowerCase(),
    country: input.country.trim().toLowerCase(),
    language: input.language.trim().toLowerCase(),
    audience: input.audience.trim().toLowerCase(),
    keywordExpansionPrompt: input.keywordExpansionPrompt.trim().toLowerCase(),
    productName: input.productName.trim().toLowerCase(),
    productDescription: input.productDescription.trim().toLowerCase(),
    keyMessage: input.keyMessage?.trim().toLowerCase() ?? null,
    audienceBefore: input.audienceBefore?.trim().toLowerCase() ?? null,
    audienceAfter: input.audienceAfter?.trim().toLowerCase() ?? null,
    cta: input.cta?.trim().toLowerCase() ?? null,
    seoWeight: Number(input.seoWeight.toFixed(4)),
    productWeight: Number(input.productWeight.toFixed(4)),
  });
}

function extractKeywordExpansionPromptFromArtifacts(artifacts: SeoBriefArtifact[]): string {
  const inputArtifact = [...artifacts]
    .reverse()
    .find((artifact) => artifact.artifactType === 'normalized_input');
  const payload = inputArtifact?.payload;
  if (!payload || Array.isArray(payload) || typeof payload !== 'object') {
    return resolveSeoBriefKeywordExpansionPrompt();
  }

  return resolveSeoBriefKeywordExpansionPrompt(
    typeof payload.keywordExpansionPrompt === 'string' ? payload.keywordExpansionPrompt : null,
  );
}

function isDeduplicationEligibleStatus(status: SeoBriefRunStatus): boolean {
  return (
    status === 'created' ||
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
    @Inject(SeoBriefRunJobPort)
    private readonly jobs: SeoBriefRunJobPort,
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
    await this.artifactRepository.save(operationalLimitsArtifact);
    this.eventBus.publishAll(run.pullEvents());

    try {
      run.queue();
      await this.runRepository.save(run);
      await this.jobs.enqueueRun({
        runId: run.id,
        startStage: 'keyword_expansion',
        stopAfterStage: 'keyword_expansion',
      });
    } catch (error) {
      run.fail(error instanceof Error ? error.message : 'SEO brief run could not be enqueued');
      await this.runRepository.save(run);
      throw error;
    }

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
        createRunFingerprint({
          projectId: candidate.projectId,
          topicSeed: candidate.topicSeed,
          country: candidate.country,
          language: candidate.language,
          locationName: candidate.country,
          audience: candidate.audience,
          keywordExpansionPrompt: extractKeywordExpansionPromptFromArtifacts(candidateArtifacts),
          productName: candidate.productName,
          productDescription: candidate.productDescription,
          keyMessage: candidate.keyMessage,
          audienceBefore: candidate.audienceBefore,
          audienceAfter: candidate.audienceAfter,
          cta: candidate.cta,
          seoWeight: candidate.seoWeight,
          productWeight: candidate.productWeight,
        }) === fingerprint
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
