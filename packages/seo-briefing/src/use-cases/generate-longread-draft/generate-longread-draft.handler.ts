import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { SeoBriefArtifact } from '../../domain/seo-brief-artifact.entity.js';
import { SeoBriefArtifactRepository } from '../../domain/seo-brief-artifact.repository.js';
import { SeoBriefRunRepository } from '../../domain/seo-brief-run.repository.js';
import { SeoBriefRunStep } from '../../domain/seo-brief-run-step.entity.js';
import { SeoBriefRunStepRepository } from '../../domain/seo-brief-run-step.repository.js';
import type { SeoBriefJsonValue } from '../../domain/seo-briefing.types.js';
import { SeoBriefRunNotFoundError } from '../../errors/seo-brief-run-not-found.error.js';
import { SeoBriefAiPort } from '../../ports/seo-brief-ai.port.js';
import {
  buildArticleGenerationContext,
  nextAttemptNumber,
} from '../article-generation/article-generation-context.js';
import { GenerateLongreadDraftCommand } from './generate-longread-draft.command.js';

export interface GenerateLongreadDraftResult {
  artifactType: 'longread_draft_article';
  markdownLength: number;
  runId: string;
}

@CommandHandler(GenerateLongreadDraftCommand)
export class GenerateLongreadDraftHandler
  implements ICommandHandler<GenerateLongreadDraftCommand, GenerateLongreadDraftResult>
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

  async execute(command: GenerateLongreadDraftCommand): Promise<GenerateLongreadDraftResult> {
    const run = await this.runRepository.findById(command.runId as never);
    if (!run) {
      throw new SeoBriefRunNotFoundError(command.runId);
    }

    const artifacts = await this.artifactRepository.findByRunId(run.id);
    const context = buildArticleGenerationContext(run, artifacts);
    const step = SeoBriefRunStep.create({
      runId: run.id,
      stage: 'brief_generation',
      status: 'running',
      attemptNumber: nextAttemptNumber(artifacts, 'longread_draft_article'),
    });
    await this.stepRepository.save(step);

    try {
      const result = await this.ai.draftLongreadArticle({
        runId: run.id,
        stepId: step.id,
        modelMode: context.modelMode,
        timeoutMs: context.requestTimeoutMs,
        promptInstructionOverrides: context.promptInstructionOverrides,
        finalSeoBrief: context.finalSeoBrief,
        productProfile: context.productProfile,
        claimsPolicy: context.claimsPolicy,
        brandVoice: context.brandVoice,
        targetLength: '1800-2500 words',
        publishingFormat: 'website_blog',
      });

      await this.artifactRepository.save(
        SeoBriefArtifact.create({
          runId: run.id,
          stage: 'brief_generation',
          artifactType: 'longread_draft_article',
          payload: {
            artifactVersion: 'longread_draft_article_v1',
            sourceArtifactType: 'final_brief_snapshot',
            finalSeoBriefValidation: context.validation,
            targetLength: '1800-2500 words',
            publishingFormat: 'website_blog',
            draftArticleMarkdown: result.draftArticleMarkdown,
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
        artifactType: 'longread_draft_article',
        markdownLength: result.draftArticleMarkdown.length,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Longread draft generation failed';
      step.fail(message);
      run.fail(message);
      await this.stepRepository.save(step);
      await this.runRepository.save(run);
      throw error;
    }
  }
}
