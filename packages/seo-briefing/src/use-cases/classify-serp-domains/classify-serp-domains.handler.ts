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
  SeoBriefAiPort,
  type ExtractUserPainScenariosResult,
  type SeoBriefAiModelMode,
} from '../../ports/seo-brief-ai.port.js';
import { readRequestTimeoutMsFromArtifacts } from '../seo-brief-request-timeout.js';
import { ClassifySerpDomainsCommand } from './classify-serp-domains.command.js';

type SeoBriefArtifactList = SeoBriefArtifact[];

export interface ClassifySerpDomainsResult {
  artifactType: 'serp_domain_classification';
  ignoredTargetCount: number;
  onpageOnlyTargetCount: number;
  painSignalTargetCount: number;
  rankedKeywordsTargetCount: number;
  runId: string;
}

@CommandHandler(ClassifySerpDomainsCommand)
export class ClassifySerpDomainsHandler
  implements ICommandHandler<ClassifySerpDomainsCommand, ClassifySerpDomainsResult>
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

  async execute(command: ClassifySerpDomainsCommand): Promise<ClassifySerpDomainsResult> {
    const run = await this.runRepository.findById(command.runId as never);
    if (!run) {
      throw new SeoBriefRunNotFoundError(command.runId);
    }

    const artifacts = await this.artifactRepository.findByRunId(run.id);
    const serpDomainAggregation = readLatestObjectArtifact(artifacts, 'serp_domain_aggregation');
    if (!serpDomainAggregation) {
      throw new Error('Aggregate SERP domains before classifying SERP domains');
    }

    const step = SeoBriefRunStep.create({
      runId: run.id,
      stage: 'serp_research',
      status: 'running',
      attemptNumber: nextAttemptNumber(artifacts, 'serp_domain_classification'),
    });
    await this.stepRepository.save(step);

    try {
      const result = await this.ai.classifySerpDomains({
        runId: run.id,
        stepId: step.id,
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
        seoProductContext: readLatestObjectArtifact(artifacts, 'seo_product_context'),
        brandMemorySnapshot: run.brandMemorySnapshot,
        userPainScenarios: readUserPainScenarios(artifacts),
        serpDomainAggregation,
      });

      await this.artifactRepository.save(
        SeoBriefArtifact.create({
          runId: run.id,
          stage: 'serp_research',
          artifactType: 'serp_domain_classification',
          payload: {
            artifactVersion: 'serp_domain_classification_v1',
            sourceArtifactType: 'serp_domain_aggregation',
            selectionRules: {
              rankedKeywordsUse: 'DataForSEO Labs ranked_keywords/live target domains',
              recommendedRankedKeywordsTargets: '3-4',
              maxRankedKeywordsTargets: 6,
            },
            notes: [
              'AI classified each aggregated SERP domain into exactly one downstream-use bucket.',
              'This step does not call Ranked Keywords yet.',
            ],
            rankedKeywordsTargets: result.rankedKeywordsTargets as unknown as SeoBriefJsonValue,
            onpageOnlyTargets: result.onpageOnlyTargets as unknown as SeoBriefJsonValue,
            painSignalTargets: result.painSignalTargets as unknown as SeoBriefJsonValue,
            ignoredTargets: result.ignoredTargets as unknown as SeoBriefJsonValue,
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
        artifactType: 'serp_domain_classification',
        rankedKeywordsTargetCount: result.rankedKeywordsTargets.length,
        onpageOnlyTargetCount: result.onpageOnlyTargets.length,
        painSignalTargetCount: result.painSignalTargets.length,
        ignoredTargetCount: result.ignoredTargets.length,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'SERP domain classification failed';
      step.fail(message);
      run.fail(message);
      await this.stepRepository.save(step);
      await this.runRepository.save(run);
      throw error;
    }
  }
}

function nextAttemptNumber(artifacts: SeoBriefArtifactList, type: string): number {
  return artifacts.filter((artifact) => artifact.artifactType === type).length + 1;
}

function readLatestObjectArtifact(
  artifacts: SeoBriefArtifactList,
  artifactType: string,
): SeoBriefJsonObject | null {
  const artifact = [...artifacts].reverse().find((item) => item.artifactType === artifactType);
  return artifact?.payload && typeof artifact.payload === 'object' && !Array.isArray(artifact.payload)
    ? (artifact.payload as SeoBriefJsonObject)
    : null;
}

function readAiModelMode(artifacts: SeoBriefArtifactList): SeoBriefAiModelMode | null {
  const payload = readLatestObjectArtifact(artifacts, 'normalized_input');
  const mode = payload?.aiModelMode;
  return mode === 'flash' || mode === 'pro' || mode === 'pro_thinking' ? mode : null;
}

function readUserPainScenarios(
  artifacts: SeoBriefArtifactList,
): ExtractUserPainScenariosResult | null {
  const payload = readLatestObjectArtifact(artifacts, 'user_pain_scenarios');
  if (!payload) {
    return null;
  }

  return {
    topicHintInterpretation: asString(payload.topicHintInterpretation),
    userPains: asArray(payload.userPains),
    userScenarios: asArray(payload.userScenarios),
    riskNotes: asArray(payload.riskNotes).filter((item): item is string => typeof item === 'string'),
  };
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}
