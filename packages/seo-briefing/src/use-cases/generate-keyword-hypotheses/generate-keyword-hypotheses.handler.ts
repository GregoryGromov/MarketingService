import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { resolveSeoBriefKeywordExpansionPrompt } from '../../config/seo-brief-keyword-expansion-prompt.js';
import { SeoBriefArtifact } from '../../domain/seo-brief-artifact.entity.js';
import { SeoBriefArtifactRepository } from '../../domain/seo-brief-artifact.repository.js';
import { SeoBriefRunRepository } from '../../domain/seo-brief-run.repository.js';
import { SeoBriefRunStep } from '../../domain/seo-brief-run-step.entity.js';
import { SeoBriefRunStepRepository } from '../../domain/seo-brief-run-step.repository.js';
import type { SeoBriefJsonObject, SeoBriefJsonValue } from '../../domain/seo-briefing.types.js';
import { SeoBriefRunNotFoundError } from '../../errors/seo-brief-run-not-found.error.js';
import type {
  ExtractUserPainScenariosResult,
  SeoBriefAiModelMode,
} from '../../ports/seo-brief-ai.port.js';
import { SeoBriefAiPort } from '../../ports/seo-brief-ai.port.js';
import { GenerateKeywordHypothesesCommand } from './generate-keyword-hypotheses.command.js';

type SeoBriefArtifactList = SeoBriefArtifact[];
type KeywordExpansionResult = Awaited<ReturnType<SeoBriefAiPort['expandKeywords']>>;

export interface GenerateKeywordHypothesesResult {
  runId: string;
  artifactType: 'keyword_hypotheses';
  hypothesisCount: number;
  groupCount: number;
}

@CommandHandler(GenerateKeywordHypothesesCommand)
export class GenerateKeywordHypothesesHandler
  implements ICommandHandler<GenerateKeywordHypothesesCommand, GenerateKeywordHypothesesResult>
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

  async execute(command: GenerateKeywordHypothesesCommand): Promise<GenerateKeywordHypothesesResult> {
    const run = await this.runRepository.findById(command.runId as never);
    if (!run) {
      throw new SeoBriefRunNotFoundError(command.runId);
    }

    const artifacts = await this.artifactRepository.findByRunId(run.id);
    const userPainScenarios = readUserPainScenarios(artifacts);
    if (!userPainScenarios) {
      throw new Error('Generate user pain scenarios before keyword hypotheses');
    }

    const step = SeoBriefRunStep.create({
      runId: run.id,
      stage: 'keyword_expansion',
      status: 'running',
      attemptNumber: nextAttemptNumber(artifacts, 'keyword_hypotheses'),
    });
    await this.stepRepository.save(step);

    try {
      const seoProductContext = readSeoProductContext(artifacts);
      const aiModelMode = readAiModelMode(artifacts);
      const keywordExpansionPrompt = readKeywordExpansionPrompt(artifacts);
      const campaignContext = readCampaignContext(artifacts);
      const hypothesesCount = readHypothesesCount(artifacts);
      const result = await this.ai.expandKeywords({
        runId: run.id,
        stepId: step.id,
        modelMode: aiModelMode,
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
        audienceBefore: run.audienceBefore,
        audienceAfter: run.audienceAfter,
        campaignContext,
        brandMemorySnapshot: run.brandMemorySnapshot,
        seoProductContext,
        userPainScenarios,
        keywordExpansionPrompt,
        limit: hypothesesCount,
      });
      const limitedResult = limitKeywordExpansionResult(result, hypothesesCount);

      await this.artifactRepository.save(
        SeoBriefArtifact.create({
          runId: run.id,
          stage: 'keyword_expansion',
          artifactType: 'keyword_hypotheses',
          payload: {
            artifactVersion: 'search_hypotheses_v2',
            generatedFrom: seoProductContext
              ? 'manual_user_pains_and_seo_product_context'
              : 'manual_user_pains_and_legacy_run_fields',
            topicSeed: run.topicSeed,
            hypothesesCount,
            seoProductContext: seoProductContext as SeoBriefJsonValue | null,
            userPainScenarios: userPainScenarios as unknown as SeoBriefJsonValue,
            searchHypotheses: limitedResult.hypotheses as unknown as SeoBriefJsonValue,
            groups: (limitedResult.groups ?? []) as unknown as SeoBriefJsonValue,
            hypotheses: limitedResult.hypotheses as unknown as SeoBriefJsonValue,
          },
          attempt: step.attemptNumber,
        }),
      );

      step.complete();
      run.awaitConfirmation();
      await this.stepRepository.save(step);
      await this.runRepository.save(run);

      return {
        runId: run.id,
        artifactType: 'keyword_hypotheses',
        hypothesisCount: limitedResult.hypotheses.length,
        groupCount: limitedResult.groups?.length ?? 0,
      };
    } catch (error) {
      step.fail(error instanceof Error ? error.message : 'Keyword hypothesis generation failed');
      run.fail(error instanceof Error ? error.message : 'Keyword hypothesis generation failed');
      await this.stepRepository.save(step);
      await this.runRepository.save(run);
      throw error;
    }
  }
}

function nextAttemptNumber(artifacts: SeoBriefArtifactList, type: string): number {
  return artifacts.filter((artifact) => artifact.artifactType === type).length + 1;
}

function readUserPainScenarios(
  artifacts: SeoBriefArtifactList,
): ExtractUserPainScenariosResult | null {
  const artifact = [...artifacts].reverse().find((item) => item.artifactType === 'user_pain_scenarios');
  if (!artifact?.payload || typeof artifact.payload !== 'object' || Array.isArray(artifact.payload)) {
    return null;
  }

  const payload = artifact.payload as Record<string, unknown>;
  return {
    topicHintInterpretation: asString(payload.topicHintInterpretation),
    userPains: asArray(payload.userPains),
    userScenarios: asArray(payload.userScenarios),
    riskNotes: asArray(payload.riskNotes).filter((item): item is string => typeof item === 'string'),
  };
}

function readSeoProductContext(artifacts: SeoBriefArtifactList): SeoBriefJsonObject | null {
  const artifact = [...artifacts].reverse().find((item) => item.artifactType === 'seo_product_context');
  return artifact?.payload && typeof artifact.payload === 'object' && !Array.isArray(artifact.payload)
    ? (artifact.payload as SeoBriefJsonObject)
    : null;
}

function readAiModelMode(artifacts: SeoBriefArtifactList): SeoBriefAiModelMode | null {
  const payload = readNormalizedInput(artifacts);
  const mode = payload?.aiModelMode;
  return mode === 'flash' || mode === 'pro' || mode === 'pro_thinking' ? mode : null;
}

function readCampaignContext(artifacts: SeoBriefArtifactList): string | null {
  const payload = readNormalizedInput(artifacts);
  return typeof payload?.campaignContext === 'string' ? payload.campaignContext : null;
}

function readKeywordExpansionPrompt(artifacts: SeoBriefArtifactList): string {
  const payload = readNormalizedInput(artifacts);
  return resolveSeoBriefKeywordExpansionPrompt(
    typeof payload?.keywordExpansionPrompt === 'string' ? payload.keywordExpansionPrompt : null,
  );
}

function readHypothesesCount(artifacts: SeoBriefArtifactList): number {
  const payload = readNormalizedInput(artifacts);
  const value = payload?.hypothesesCount;
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : 10;
}

function readNormalizedInput(artifacts: SeoBriefArtifactList): Record<string, unknown> | null {
  const artifact = [...artifacts].reverse().find((item) => item.artifactType === 'normalized_input');
  return artifact?.payload && typeof artifact.payload === 'object' && !Array.isArray(artifact.payload)
    ? (artifact.payload as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function limitKeywordExpansionResult(
  result: KeywordExpansionResult,
  limit: number,
): KeywordExpansionResult {
  const hypotheses = result.hypotheses.slice(0, limit);
  if (!result.groups?.length) {
    return { hypotheses };
  }

  const allowedKeywords = new Set(hypotheses.map((item) => item.keyword.trim().toLowerCase()));
  const groups = result.groups
    .map((group) => ({
      ...group,
      hypotheses: group.hypotheses.filter((item) =>
        allowedKeywords.has(item.keyword.trim().toLowerCase()),
      ),
    }))
    .filter((group) => group.hypotheses.length > 0);

  return { hypotheses, groups };
}
