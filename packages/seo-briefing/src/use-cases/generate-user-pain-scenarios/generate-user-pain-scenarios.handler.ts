import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { SeoBriefArtifact } from '../../domain/seo-brief-artifact.entity.js';
import { SeoBriefArtifactRepository } from '../../domain/seo-brief-artifact.repository.js';
import { SeoBriefRunRepository } from '../../domain/seo-brief-run.repository.js';
import { SeoBriefRunStep } from '../../domain/seo-brief-run-step.entity.js';
import { SeoBriefRunStepRepository } from '../../domain/seo-brief-run-step.repository.js';
import type { SeoBriefJsonObject, SeoBriefJsonValue } from '../../domain/seo-briefing.types.js';
import { SeoBriefRunNotFoundError } from '../../errors/seo-brief-run-not-found.error.js';
import { SeoBriefAiPort, type SeoBriefAiModelMode } from '../../ports/seo-brief-ai.port.js';
import { readRequestTimeoutMsFromArtifacts } from '../seo-brief-request-timeout.js';
import { GenerateUserPainScenariosCommand } from './generate-user-pain-scenarios.command.js';

type SeoBriefArtifactList = SeoBriefArtifact[];

export interface GenerateUserPainScenariosResult {
  runId: string;
  artifactType: 'user_pain_scenarios';
  userPainCount: number;
  userScenarioCount: number;
}

@CommandHandler(GenerateUserPainScenariosCommand)
export class GenerateUserPainScenariosHandler
  implements ICommandHandler<GenerateUserPainScenariosCommand, GenerateUserPainScenariosResult>
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

  async execute(command: GenerateUserPainScenariosCommand): Promise<GenerateUserPainScenariosResult> {
    const run = await this.runRepository.findById(command.runId as never);
    if (!run) {
      throw new SeoBriefRunNotFoundError(command.runId);
    }

    const artifacts = await this.artifactRepository.findByRunId(run.id);
    const step = SeoBriefRunStep.create({
      runId: run.id,
      stage: 'keyword_expansion',
      status: 'running',
      attemptNumber: nextAttemptNumber(artifacts, 'user_pain_scenarios'),
    });
    await this.stepRepository.save(step);

    try {
      const seoProductContext = readSeoProductContext(artifacts);
      const aiModelMode = readAiModelMode(artifacts);
      const result = await this.ai.extractUserPainScenarios({
        runId: run.id,
        stepId: step.id,
        modelMode: aiModelMode,
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
        seoProductContext,
        brandMemorySnapshot: run.brandMemorySnapshot,
      });

      await this.artifactRepository.save(
        SeoBriefArtifact.create({
          runId: run.id,
          stage: 'keyword_expansion',
          artifactType: 'user_pain_scenarios',
          payload: {
            artifactVersion: 'user_pain_scenarios_v1',
            generatedFrom: seoProductContext ? 'seo_product_context' : 'legacy_run_fields',
            topicSeed: run.topicSeed,
            seoProductContext: seoProductContext as SeoBriefJsonValue | null,
            topicHintInterpretation: result.topicHintInterpretation,
            userPains: result.userPains as unknown as SeoBriefJsonValue,
            userScenarios: result.userScenarios as unknown as SeoBriefJsonValue,
            riskNotes: result.riskNotes,
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
        artifactType: 'user_pain_scenarios',
        userPainCount: result.userPains.length,
        userScenarioCount: result.userScenarios.length,
      };
    } catch (error) {
      step.fail(error instanceof Error ? error.message : 'User pain scenario generation failed');
      run.fail(error instanceof Error ? error.message : 'User pain scenario generation failed');
      await this.stepRepository.save(step);
      await this.runRepository.save(run);
      throw error;
    }
  }
}

function nextAttemptNumber(artifacts: SeoBriefArtifactList, type: string): number {
  return artifacts.filter((artifact) => artifact.artifactType === type).length + 1;
}

function readSeoProductContext(artifacts: SeoBriefArtifactList): SeoBriefJsonObject | null {
  const artifact = [...artifacts].reverse().find((item) => item.artifactType === 'seo_product_context');
  return artifact?.payload && typeof artifact.payload === 'object' && !Array.isArray(artifact.payload)
    ? (artifact.payload as SeoBriefJsonObject)
    : null;
}

function readAiModelMode(artifacts: SeoBriefArtifactList): SeoBriefAiModelMode | null {
  const artifact = [...artifacts].reverse().find((item) => item.artifactType === 'normalized_input');
  if (!artifact?.payload || typeof artifact.payload !== 'object' || Array.isArray(artifact.payload)) {
    return null;
  }
  const mode = (artifact.payload as Record<string, unknown>).aiModelMode;
  return mode === 'flash' || mode === 'pro' || mode === 'pro_thinking' ? mode : null;
}
