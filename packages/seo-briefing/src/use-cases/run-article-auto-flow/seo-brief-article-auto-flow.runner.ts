import { Inject, Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { SeoBriefRunRepository } from '../../domain/seo-brief-run.repository.js';
import { SeoBriefRunNotFoundError } from '../../errors/seo-brief-run-not-found.error.js';
import { BuildDirtyKeywordPoolCommand } from '../build-dirty-keyword-pool/build-dirty-keyword-pool.command.js';
import { CleanupLongreadArticleCommand } from '../cleanup-longread-article/cleanup-longread-article.command.js';
import { ClusterKeywordCandidatesCommand } from '../cluster-keyword-candidates/cluster-keyword-candidates.command.js';
import { ExtractSerpDerivedCandidatesCommand } from '../extract-serp-derived-candidates/extract-serp-derived-candidates.command.js';
import { FetchKeywordSerpPreviewsCommand } from '../fetch-keyword-serp-previews/fetch-keyword-serp-previews.command.js';
import { FetchSelectedClusterOnPageCommand } from '../fetch-selected-cluster-onpage/fetch-selected-cluster-onpage.command.js';
import { GenerateFinalSeoBriefCommand } from '../generate-final-seo-brief/generate-final-seo-brief.command.js';
import { GenerateKeywordHypothesesCommand } from '../generate-keyword-hypotheses/generate-keyword-hypotheses.command.js';
import { GenerateLongreadDraftCommand } from '../generate-longread-draft/generate-longread-draft.command.js';
import { PackageLongreadArticleCommand } from '../package-longread-article/package-longread-article.command.js';
import { ReviewClusterProductFitCommand } from '../review-cluster-product-fit/review-cluster-product-fit.command.js';
import { ScoreKeywordCandidatesCommand } from '../score-keyword-candidates/score-keyword-candidates.command.js';
import { SelectSeoBriefClustersCommand } from '../select-seo-brief-clusters/select-seo-brief-clusters.command.js';
import { SynthesizeOnPageCommand } from '../synthesize-onpage/synthesize-onpage.command.js';

interface AutoFlowStep {
  label: string;
  execute: (runId: string) => Promise<unknown>;
}

/**
 * Headless, server-side equivalent of the test-UI "full auto flow". Drives a run
 * from keyword research all the way to a packaged longread article by invoking the
 * same CQRS command handlers the manual UI calls, in the same order. This is the
 * "variant B" pipeline that produces article-ready output (final_brief_snapshot
 * v2 + longread_final_package) without a browser, unlike ProcessSeoBriefRunExecutor
 * which only produces an SEO-shaped brief.
 *
 * Scope: keyword research -> packaged article. Social adaptations and calendar
 * scheduling are deliberately left to the existing finalize flow.
 */
@Injectable()
export class SeoBriefArticleAutoFlowRunner {
  private readonly logger = new Logger(SeoBriefArticleAutoFlowRunner.name);

  constructor(
    @Inject(CommandBus)
    private readonly commandBus: CommandBus,
    @Inject(SeoBriefRunRepository)
    private readonly runRepository: SeoBriefRunRepository,
  ) {}

  // LLM/DataForSEO steps flake (transient transport errors, empty/invalid model
  // output). Re-running a command regenerates its output, so a small retry budget
  // turns most one-off flakes into a transparent recovery instead of a dead run.
  private static readonly STEP_ATTEMPTS = 2;
  // Number of times the whole tail regenerates the draft before giving up.
  private static readonly ARTICLE_TAIL_ATTEMPTS = 3;
  // In-place retries for cleanup/package within a single draft. These steps flake on
  // their own (bad review pass, malformed package JSON) without the draft being at fault,
  // so retrying them is far cheaper than regenerating a 2000+ word article.
  private static readonly CLEANUP_ATTEMPTS = 2;
  private static readonly PACKAGE_ATTEMPTS = 3;

  async run(runId: string): Promise<void> {
    const run = await this.runRepository.findById(runId as never);
    if (!run) {
      throw new SeoBriefRunNotFoundError(runId);
    }
    run.start();
    await this.runRepository.save(run);

    const leadingSteps = this.buildLeadingSteps();
    for (let index = 0; index < leadingSteps.length; index += 1) {
      const step = leadingSteps[index];
      this.logger.log(
        `[article-auto-flow ${runId}] ${index + 1}/${leadingSteps.length + 1} ${step.label}`,
      );
      await this.executeWithRetry(
        runId,
        step.label,
        () => step.execute(runId),
        SeoBriefArticleAutoFlowRunner.STEP_ATTEMPTS,
      );
    }

    // Article tail: draft -> cleanup -> package. cleanup/package depend on a non-empty
    // draft, and the draft model occasionally returns an empty body, so on any failure
    // we regenerate the whole tail from the draft rather than retrying a doomed cleanup.
    await this.runArticleTail(runId);

    // Intermediate handlers leave the run in awaiting_confirmation / running; force
    // it to done now that the packaged article exists.
    const finished = await this.runRepository.findById(runId as never);
    if (finished) {
      finished.complete();
      await this.runRepository.save(finished);
    }
    this.logger.log(`[article-auto-flow ${runId}] completed — packaged article ready`);
  }

  private async runArticleTail(runId: string): Promise<void> {
    const dispatch = (command: object) => this.commandBus.execute(command);
    const draftAttempts = SeoBriefArticleAutoFlowRunner.ARTICLE_TAIL_ATTEMPTS;
    let lastError: unknown = null;
    for (let attempt = 1; attempt <= draftAttempts; attempt += 1) {
      try {
        this.logger.log(
          `[article-auto-flow ${runId}] 12/15 generate-longread-draft (draft ${attempt}/${draftAttempts})`,
        );
        await dispatch(new GenerateLongreadDraftCommand(runId));
        // cleanup/package flake independently of the draft — retry each in place before
        // paying to regenerate the whole article on the next draft attempt.
        this.logger.log(`[article-auto-flow ${runId}] 13/15 cleanup-longread-article`);
        await this.dispatchStepWithRetry(
          runId,
          'cleanup-longread-article',
          () => dispatch(new CleanupLongreadArticleCommand(runId)),
          SeoBriefArticleAutoFlowRunner.CLEANUP_ATTEMPTS,
        );
        this.logger.log(`[article-auto-flow ${runId}] 14/15 package-longread-article`);
        await this.dispatchStepWithRetry(
          runId,
          'package-longread-article',
          () => dispatch(new PackageLongreadArticleCommand(runId)),
          SeoBriefArticleAutoFlowRunner.PACKAGE_ATTEMPTS,
        );
        return;
      } catch (error) {
        lastError = error;
        const message = error instanceof Error ? error.message : 'article tail failed';
        this.logger.warn(
          `[article-auto-flow ${runId}] article tail draft attempt ${attempt}/${draftAttempts} failed: ${message}` +
            (attempt < draftAttempts ? ' — regenerating draft' : ''),
        );
      }
    }
    await this.failRun(runId, 'article-tail', lastError);
    throw lastError instanceof Error ? lastError : new Error('article tail failed');
  }

  // Retry a single tail step (cleanup/package) in place. Throws after exhausting attempts
  // so the caller regenerates the draft; does not mark the run failed itself.
  private async dispatchStepWithRetry(
    runId: string,
    label: string,
    execute: () => Promise<unknown>,
    attempts: number,
  ): Promise<void> {
    let lastError: unknown = null;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        await execute();
        return;
      } catch (error) {
        lastError = error;
        const message = error instanceof Error ? error.message : 'step failed';
        this.logger.warn(
          `[article-auto-flow ${runId}] ${label} attempt ${attempt}/${attempts} failed: ${message}`,
        );
      }
    }
    throw lastError instanceof Error ? lastError : new Error(`${label} failed`);
  }

  private async executeWithRetry(
    runId: string,
    label: string,
    execute: () => Promise<unknown>,
    attempts: number,
  ): Promise<void> {
    let lastError: unknown = null;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        await execute();
        return;
      } catch (error) {
        lastError = error;
        const message = error instanceof Error ? error.message : 'step failed';
        this.logger.warn(
          `[article-auto-flow ${runId}] ${label} attempt ${attempt}/${attempts} failed: ${message}`,
        );
      }
    }
    await this.failRun(runId, label, lastError);
    throw lastError instanceof Error ? lastError : new Error(`${label} failed`);
  }

  private async failRun(runId: string, label: string, error: unknown): Promise<void> {
    const message = error instanceof Error ? error.message : 'article auto flow step failed';
    this.logger.error(`[article-auto-flow ${runId}] failed at ${label}: ${message}`);
    // The individual handler may already have marked the run failed; re-mark defensively
    // so the aggregate carries the step context.
    const latest = await this.runRepository.findById(runId as never);
    if (latest) {
      latest.fail(`${label}: ${message}`);
      await this.runRepository.save(latest);
    }
  }

  private buildLeadingSteps(): AutoFlowStep[] {
    const dispatch = (command: object) => this.commandBus.execute(command);
    return [
      {
        label: 'generate-keyword-hypotheses',
        execute: (id) => dispatch(new GenerateKeywordHypothesesCommand(id)),
      },
      {
        label: 'preview-keyword-serps',
        execute: (id) => dispatch(new FetchKeywordSerpPreviewsCommand(id)),
      },
      {
        label: 'extract-serp-derived-candidates',
        execute: (id) => dispatch(new ExtractSerpDerivedCandidatesCommand(id)),
      },
      {
        label: 'build-dirty-keyword-pool',
        execute: (id) => dispatch(new BuildDirtyKeywordPoolCommand(id)),
      },
      {
        label: 'score-keyword-candidates',
        execute: (id) => dispatch(new ScoreKeywordCandidatesCommand(id)),
      },
      {
        label: 'cluster-keyword-candidates',
        execute: (id) => dispatch(new ClusterKeywordCandidatesCommand(id)),
      },
      {
        label: 'review-cluster-product-fit',
        execute: (id) => dispatch(new ReviewClusterProductFitCommand(id)),
      },
      {
        label: 'select-seo-brief-clusters',
        // null selectedClusterName -> auto-select top cluster (auto_until_selection mode).
        execute: (id) => dispatch(new SelectSeoBriefClustersCommand(id, null)),
      },
      {
        label: 'fetch-selected-cluster-onpage',
        execute: (id) => dispatch(new FetchSelectedClusterOnPageCommand(id)),
      },
      {
        label: 'synthesize-onpage',
        execute: (id) => dispatch(new SynthesizeOnPageCommand(id)),
      },
      {
        label: 'generate-final-brief',
        execute: (id) => dispatch(new GenerateFinalSeoBriefCommand(id)),
      },
    ];
  }
}
