import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { SeoBriefArtifact } from '../../domain/seo-brief-artifact.entity.js';
import { SeoBriefArtifactRepository } from '../../domain/seo-brief-artifact.repository.js';
import { SeoBriefRunRepository } from '../../domain/seo-brief-run.repository.js';
import { SeoBriefRunStep } from '../../domain/seo-brief-run-step.entity.js';
import { SeoBriefRunStepRepository } from '../../domain/seo-brief-run-step.repository.js';
import type { SeoBriefJsonValue } from '../../domain/seo-briefing.types.js';
import { SeoBriefRunNotFoundError } from '../../errors/seo-brief-run-not-found.error.js';
import { SeoBriefAiPort, type ArticleCleanupStatus } from '../../ports/seo-brief-ai.port.js';
import {
  buildArticleGenerationContext,
  nextAttemptNumber,
  readLatestObjectArtifact,
} from '../article-generation/article-generation-context.js';
import { CleanupLongreadArticleCommand } from './cleanup-longread-article.command.js';

export interface CleanupLongreadArticleResult {
  artifactType: 'longread_cleanup';
  markdownLength: number;
  runId: string;
  status: ArticleCleanupStatus;
  warningCount: number;
}

@CommandHandler(CleanupLongreadArticleCommand)
export class CleanupLongreadArticleHandler
  implements ICommandHandler<CleanupLongreadArticleCommand, CleanupLongreadArticleResult>
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

  async execute(command: CleanupLongreadArticleCommand): Promise<CleanupLongreadArticleResult> {
    const run = await this.runRepository.findById(command.runId as never);
    if (!run) {
      throw new SeoBriefRunNotFoundError(command.runId);
    }

    const artifacts = await this.artifactRepository.findByRunId(run.id);
    const context = buildArticleGenerationContext(run, artifacts);
    const draftArtifact = readLatestObjectArtifact(artifacts, 'longread_draft_article');
    const draftArticleMarkdown = readString(draftArtifact?.draftArticleMarkdown);
    if (!draftArticleMarkdown) {
      throw new Error('Generate longread draft before cleanup');
    }

    const step = SeoBriefRunStep.create({
      runId: run.id,
      stage: 'brief_generation',
      status: 'running',
      attemptNumber: nextAttemptNumber(artifacts, 'longread_cleanup'),
    });
    await this.stepRepository.save(step);

    try {
      const result = await this.ai.cleanupLongreadArticle({
        runId: run.id,
        stepId: step.id,
        modelMode: context.modelMode,
        timeoutMs: context.requestTimeoutMs,
        draftArticleMarkdown,
        finalSeoBrief: context.finalSeoBrief,
        productProfile: context.productProfile,
        claimsPolicy: context.claimsPolicy,
        brandVoice: context.brandVoice,
      });

      await this.artifactRepository.save(
        SeoBriefArtifact.create({
          runId: run.id,
          stage: 'brief_generation',
          artifactType: 'longread_cleanup',
          payload: {
            artifactVersion: 'longread_cleanup_v1',
            sourceArtifactType: 'longread_draft_article',
            status: result.status,
            warnings: result.warnings,
            changesMade: result.changesMade,
            articleMarkdown: result.articleMarkdown,
          } as unknown as SeoBriefJsonValue,
          attempt: step.attemptNumber,
        }),
      );

      step.complete();
      run.awaitConfirmation();
      await this.stepRepository.save(step);
      await this.runRepository.save(run);

      return {
        runId: run.id,
        artifactType: 'longread_cleanup',
        status: result.status,
        warningCount: result.warnings.length,
        markdownLength: result.articleMarkdown.length,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Longread cleanup failed';
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
