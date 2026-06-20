import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { SeoBriefArtifact } from '../../domain/seo-brief-artifact.entity.js';
import { SeoBriefArtifactRepository } from '../../domain/seo-brief-artifact.repository.js';
import { SeoBriefRunRepository } from '../../domain/seo-brief-run.repository.js';
import { SeoBriefRunStep } from '../../domain/seo-brief-run-step.entity.js';
import { SeoBriefRunStepRepository } from '../../domain/seo-brief-run-step.repository.js';
import type { SeoBriefJsonValue } from '../../domain/seo-briefing.types.js';
import { SeoBriefRunNotFoundError } from '../../errors/seo-brief-run-not-found.error.js';
import {
  type CleanupLongreadArticleResult as AiCleanupLongreadArticleResult,
  SeoBriefAiPort,
} from '../../ports/seo-brief-ai.port.js';
import {
  buildArticleGenerationContext,
  nextAttemptNumber,
  readLatestObjectArtifact,
} from '../article-generation/article-generation-context.js';
import { PackageLongreadArticleCommand } from './package-longread-article.command.js';

export interface PackageLongreadArticleResult {
  artifactType: 'longread_final_package';
  readyToPublish: boolean;
  runId: string;
  slug: string;
  title: string;
}

@CommandHandler(PackageLongreadArticleCommand)
export class PackageLongreadArticleHandler
  implements ICommandHandler<PackageLongreadArticleCommand, PackageLongreadArticleResult>
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

  async execute(command: PackageLongreadArticleCommand): Promise<PackageLongreadArticleResult> {
    const run = await this.runRepository.findById(command.runId as never);
    if (!run) {
      throw new SeoBriefRunNotFoundError(command.runId);
    }

    const artifacts = await this.artifactRepository.findByRunId(run.id);
    const context = buildArticleGenerationContext(run, artifacts);
    const cleanupArtifact = readLatestObjectArtifact(artifacts, 'longread_cleanup');
    const reviewedArticleMarkdown = readString(cleanupArtifact?.articleMarkdown);
    if (!reviewedArticleMarkdown) {
      throw new Error('Run longread safety cleanup before packaging');
    }
    if (
      cleanupArtifact?.status !== 'passed' &&
      cleanupArtifact?.status !== 'passed_with_warnings'
    ) {
      throw new Error('Longread cleanup must pass AI review checks before packaging');
    }

    const cleanupWarnings = readCleanupWarnings(cleanupArtifact?.warnings);
    const step = SeoBriefRunStep.create({
      runId: run.id,
      stage: 'brief_generation',
      status: 'running',
      attemptNumber: nextAttemptNumber(artifacts, 'longread_final_package'),
    });
    await this.stepRepository.save(step);

    try {
      const result = await this.ai.packageLongreadArticle({
        runId: run.id,
        stepId: step.id,
        modelMode: context.modelMode,
        timeoutMs: context.requestTimeoutMs,
        reviewedArticleMarkdown,
        finalSeoBrief: context.finalSeoBrief,
        cleanupWarnings,
        productProfile: context.productProfile,
      });

      await this.artifactRepository.save(
        SeoBriefArtifact.create({
          runId: run.id,
          stage: 'brief_generation',
          artifactType: 'longread_final_package',
          payload: {
            artifactVersion: 'longread_final_package_v1',
            sourceArtifactType: 'longread_cleanup',
            ...result,
          } as unknown as SeoBriefJsonValue,
          attempt: step.attemptNumber,
        }),
      );

      step.complete();
      run.complete();
      await this.stepRepository.save(step);
      await this.runRepository.save(run);

      return {
        runId: run.id,
        artifactType: 'longread_final_package',
        title: result.article.title,
        slug: result.article.slug,
        readyToPublish: result.publishingChecklist.readyToPublish,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Longread package generation failed';
      step.fail(message);
      run.fail(message);
      await this.stepRepository.save(step);
      await this.runRepository.save(run);
      throw error;
    }
  }
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readCleanupWarnings(value: unknown): AiCleanupLongreadArticleResult['warnings'] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return null;
      }
      const record = item as Record<string, unknown>;
      const type = readString(record.type);
      const message = readString(record.message);
      if (
        !message ||
        (type !== 'claims' &&
          type !== 'compliance' &&
          type !== 'seo' &&
          type !== 'product_insertion' &&
          type !== 'factual_check' &&
          type !== 'tone' &&
          type !== 'structure')
      ) {
        return null;
      }
      return { type, message };
    })
    .filter((item): item is AiCleanupLongreadArticleResult['warnings'][number] => Boolean(item));
}
