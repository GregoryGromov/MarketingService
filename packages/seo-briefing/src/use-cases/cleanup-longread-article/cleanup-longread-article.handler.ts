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
  type CleanupLongreadArticleResult as AiCleanupLongreadArticleResult,
  type ArticleCleanupStatus,
  type ArticleCleanupWarning,
  SeoBriefAiPort,
} from '../../ports/seo-brief-ai.port.js';
import {
  buildArticleGenerationContext,
  nextAttemptNumber,
  readLatestObjectArtifact,
} from '../article-generation/article-generation-context.js';
import { CleanupLongreadArticleCommand } from './cleanup-longread-article.command.js';

const MAX_CLEANUP_REVIEW_ATTEMPTS = 5;
const PASSING_CLEANUP_STATUSES: ArticleCleanupStatus[] = ['passed', 'passed_with_warnings'];

export interface CleanupLongreadArticleResult {
  artifactType: 'longread_cleanup';
  attemptCount: number;
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
      const reviewAttempts: SeoBriefJsonObject[] = [];
      let currentMarkdown = draftArticleMarkdown;
      let result: AiCleanupLongreadArticleResult | null = null;

      for (let attempt = 1; attempt <= MAX_CLEANUP_REVIEW_ATTEMPTS; attempt += 1) {
        result = await this.ai.cleanupLongreadArticle({
          runId: run.id,
          stepId: step.id,
          modelMode: context.modelMode,
          timeoutMs: context.requestTimeoutMs,
          promptInstructionOverrides: context.promptInstructionOverrides,
          draftArticleMarkdown: currentMarkdown,
          finalSeoBrief: context.finalSeoBrief,
          productProfile: context.productProfile,
          claimsPolicy: context.claimsPolicy,
          brandVoice: context.brandVoice,
          reviewAttempt: attempt,
          previousReviewFindings: reviewAttempts,
        });

        reviewAttempts.push({
          attempt,
          status: result.status,
          warnings: result.warnings as unknown as SeoBriefJsonValue,
          changesMade: result.changesMade,
          markdownLength: result.articleMarkdown.length,
        });
        currentMarkdown = result.articleMarkdown;

        if (PASSING_CLEANUP_STATUSES.includes(result.status)) {
          break;
        }
      }

      if (!result) {
        throw new Error('Longread cleanup did not return a review result');
      }
      const finalStatus = resolveFinalCleanupStatus(result);
      const blockerCount = countUnresolvedBlockingIssues(result, finalStatus);

      await this.artifactRepository.save(
        SeoBriefArtifact.create({
          runId: run.id,
          stage: 'brief_generation',
          artifactType: 'longread_cleanup',
          payload: {
            artifactVersion: 'longread_cleanup_v1',
            sourceArtifactType: 'longread_draft_article',
            maxReviewAttempts: MAX_CLEANUP_REVIEW_ATTEMPTS,
            reviewAttempts: reviewAttempts as unknown as SeoBriefJsonValue,
            status: finalStatus,
            modelStatus: result.status,
            blockerCount,
            warnings: result.warnings,
            changesMade: result.changesMade,
            articleMarkdown: result.articleMarkdown,
          } as unknown as SeoBriefJsonValue,
          attempt: step.attemptNumber,
        }),
      );

      step.complete();
      if (PASSING_CLEANUP_STATUSES.includes(finalStatus)) {
        run.awaitConfirmation();
      } else {
        run.fail(buildLongreadCleanupFailureReason(blockerCount, reviewAttempts.length));
      }
      await this.stepRepository.save(step);
      await this.runRepository.save(run);

      return {
        runId: run.id,
        artifactType: 'longread_cleanup',
        status: finalStatus,
        attemptCount: reviewAttempts.length,
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

function resolveFinalCleanupStatus(result: AiCleanupLongreadArticleResult): ArticleCleanupStatus {
  if (result.status === 'passed') {
    return 'passed';
  }
  if (result.status === 'passed_with_warnings') {
    return hasBlockingWarnings(result.warnings) ? 'needs_human_review' : 'passed_with_warnings';
  }
  if (result.status === 'needs_human_review') {
    return 'needs_human_review';
  }

  if (hasBlockingWarnings(result.warnings)) {
    return 'needs_human_review';
  }

  return result.warnings.length > 0 ? 'passed_with_warnings' : 'passed';
}

function hasBlockingWarnings(warnings: ArticleCleanupWarning[]): boolean {
  return warnings.some((warning) => warning.severity === 'blocker');
}

function countBlockingWarnings(warnings: ArticleCleanupWarning[]): number {
  return warnings.filter((warning) => warning.severity === 'blocker').length;
}

function countUnresolvedBlockingIssues(
  result: AiCleanupLongreadArticleResult,
  finalStatus: ArticleCleanupStatus,
): number {
  const explicitBlockerCount = countBlockingWarnings(result.warnings);
  if (finalStatus !== 'needs_human_review') {
    return explicitBlockerCount;
  }

  return Math.max(explicitBlockerCount, result.warnings.length, 1);
}

function buildLongreadCleanupFailureReason(blockerCount: number, attemptCount: number): string {
  return `Longread generation cancelled: AI review loop could not resolve ${blockerCount} publish-blocking issue(s) after ${attemptCount} automated attempt(s).`;
}
