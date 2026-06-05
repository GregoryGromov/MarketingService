import {
  AggregateSerpDomainsCommand,
  type AggregateSerpDomainsResult,
  BuildCompetitorKeywordMapCommand,
  type BuildCompetitorKeywordMapResult,
  BuildDirtyKeywordPoolCommand,
  type BuildDirtyKeywordPoolResult,
  ClassifySerpDomainsCommand,
  type ClassifySerpDomainsUseCaseResult,
  ClusterKeywordCandidatesCommand,
  type ClusterKeywordCandidatesResult,
  ContinueSeoBriefRunCommand,
  CreateSeoBriefRunCommand,
  type CreateSeoBriefRunResult,
  ExtractSerpDerivedCandidatesCommand,
  type ExtractSerpDerivedCandidatesResult,
  type ExtractedSeoBriefContext,
  FetchFirstKeywordSerpPreviewCommand,
  type FetchFirstKeywordSerpPreviewResult,
  FetchKeywordSerpPreviewsCommand,
  type FetchKeywordSerpPreviewsResult,
  FetchRankedKeywordsCommand,
  type FetchRankedKeywordsResult,
  FetchSelectedClusterOnPageCommand,
  type FetchSelectedClusterOnPageResult,
  GenerateFinalSeoBriefCommand,
  type GenerateFinalSeoBriefUseCaseResult,
  GenerateKeywordHypothesesCommand,
  type GenerateKeywordHypothesesResult,
  GenerateUserPainScenariosCommand,
  type GenerateUserPainScenariosResult,
  GetSeoBriefRunQuery,
  type GetSeoBriefRunResult,
  ListSeoBriefRunsQuery,
  type ListSeoBriefRunsResultItem,
  MarkSeoBriefRunManualReviewCommand,
  MatchCompetitorKeywordsCommand,
  type MatchCompetitorKeywordsResult,
  RegenerateSeoBriefCommand,
  RejectSeoBriefRunCommand,
  ReviewClusterProductFitCommand,
  type ReviewClusterProductFitUseCaseResult,
  RerunSeoBriefRunCommand,
  RerunSeoBriefStageCommand,
  ScoreKeywordCandidatesCommand,
  type ScoreKeywordCandidatesResult,
  SelectFirstKeywordRelatedQueriesCommand,
  type SelectFirstKeywordRelatedQueriesResult,
  SelectKeywordRelatedQueriesCommand,
  type SelectKeywordRelatedQueriesResult,
  SelectSeoBriefClustersCommand,
  type SelectSeoBriefClustersResult,
  SeoBriefAiPort,
  SeoBriefKeywordHypothesesNotFoundError,
  SeoBriefProjectNotFoundError,
  SeoBriefRunAttemptLimitError,
  SeoBriefRunBusyError,
  type SeoBriefRunId,
  SeoBriefRunNoNextStageError,
  SeoBriefRunNotFoundError,
  SeoBriefSerpDerivedKeywordsNotFoundError,
  SynthesizeOnPageCommand,
  type SynthesizeOnPageUseCaseResult,
} from '@marketing-service/seo-briefing';
import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CommandBus, type ICommand, QueryBus } from '@nestjs/cqrs';
import { ValibotPipe } from '../infrastructure/common/valibot-validation.pipe';
import {
  type CreateSeoBriefRunDto,
  CreateSeoBriefRunSchema,
} from './schemas/create-seo-brief-run.schema.js';
import {
  type ExtractSeoBriefContextDto,
  ExtractSeoBriefContextSchema,
} from './schemas/extract-seo-brief-context.schema.js';
import {
  type RerunSeoBriefRunDto,
  RerunSeoBriefRunSchema,
} from './schemas/rerun-seo-brief-run.schema.js';
import {
  type RerunSeoBriefStageDto,
  RerunSeoBriefStageSchema,
} from './schemas/rerun-seo-brief-stage.schema.js';
import {
  type SeoBriefControlNoteDto,
  SeoBriefControlNoteSchema,
} from './schemas/seo-brief-control-note.schema.js';

@Controller('seo-briefing')
export class SeoBriefController {
  constructor(
    @Inject(CommandBus)
    private readonly commandBus: CommandBus,
    @Inject(QueryBus)
    private readonly queryBus: QueryBus,
    @Inject(SeoBriefAiPort)
    private readonly ai: SeoBriefAiPort,
  ) {}

  @Get('health')
  getHealth(): { module: 'seo-briefing'; status: 'ok' } {
    return {
      module: 'seo-briefing',
      status: 'ok',
    };
  }

  @Post('context/extract')
  async extractContext(
    @Body(new ValibotPipe(ExtractSeoBriefContextSchema))
    dto: ExtractSeoBriefContextDto,
  ): Promise<ExtractedSeoBriefContext> {
    return this.ai.extractContext({
      contextText: dto.contextText,
      modelMode: dto.aiModelMode ?? null,
    });
  }

  @Get('runs/:id')
  async getRun(@Param('id') id: string): Promise<GetSeoBriefRunResult> {
    const run = await this.queryBus.execute(new GetSeoBriefRunQuery(id as SeoBriefRunId));
    if (!run) {
      throw new NotFoundException(`SEO brief run ${id} not found`);
    }

    return run;
  }

  @Get('runs')
  async listRuns(
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ): Promise<ListSeoBriefRunsResultItem[]> {
    return this.queryBus.execute(
      new ListSeoBriefRunsQuery({
        projectId,
        status: normalizeSeoBriefRunStatus(status),
        limit: parseLimit(limit),
      }),
    );
  }

  @Post('runs')
  @HttpCode(202)
  async createRun(
    @Body(new ValibotPipe(CreateSeoBriefRunSchema))
    dto: CreateSeoBriefRunDto,
  ): Promise<CreateSeoBriefRunResult> {
    try {
      return await this.commandBus.execute(new CreateSeoBriefRunCommand(dto));
    } catch (error) {
      if (error instanceof SeoBriefProjectNotFoundError) {
        throw new NotFoundException(error.message);
      }

      throw error;
    }
  }

  @Post('runs/:id/rerun')
  @HttpCode(202)
  async rerunRun(
    @Param('id') id: string,
    @Body(new ValibotPipe(RerunSeoBriefRunSchema))
    dto: RerunSeoBriefRunDto,
  ) {
    return this.executeControlCommand(
      new RerunSeoBriefRunCommand(id, {
        seoWeight: dto.seoProductBalance?.seoWeight ?? null,
        productWeight: dto.seoProductBalance?.productWeight ?? null,
      }),
    );
  }

  @Post('runs/:id/continue')
  @HttpCode(202)
  async continueRun(@Param('id') id: string) {
    return this.executeControlCommand(new ContinueSeoBriefRunCommand(id));
  }

  @Post('runs/:id/generate-user-pain-scenarios')
  @HttpCode(202)
  async generateUserPainScenarios(
    @Param('id') id: string,
  ): Promise<GenerateUserPainScenariosResult> {
    try {
      return await this.commandBus.execute(new GenerateUserPainScenariosCommand(id));
    } catch (error) {
      if (error instanceof SeoBriefRunNotFoundError) {
        throw new NotFoundException(error.message);
      }

      throw error;
    }
  }

  @Post('runs/:id/generate-keyword-hypotheses')
  @HttpCode(202)
  async generateKeywordHypotheses(
    @Param('id') id: string,
  ): Promise<GenerateKeywordHypothesesResult> {
    try {
      return await this.commandBus.execute(new GenerateKeywordHypothesesCommand(id));
    } catch (error) {
      if (error instanceof SeoBriefRunNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof Error && error.message.includes('Generate user pain scenarios')) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }

  @Post('runs/:id/preview-first-keyword-serp')
  @HttpCode(202)
  async previewFirstKeywordSerp(
    @Param('id') id: string,
  ): Promise<FetchFirstKeywordSerpPreviewResult> {
    try {
      return await this.commandBus.execute(new FetchFirstKeywordSerpPreviewCommand(id));
    } catch (error) {
      if (error instanceof SeoBriefRunNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof SeoBriefKeywordHypothesesNotFoundError) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }

  @Post('runs/:id/preview-keyword-serps')
  @HttpCode(202)
  async previewKeywordSerps(@Param('id') id: string): Promise<FetchKeywordSerpPreviewsResult> {
    try {
      return await this.commandBus.execute(new FetchKeywordSerpPreviewsCommand(id));
    } catch (error) {
      if (error instanceof SeoBriefRunNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof SeoBriefKeywordHypothesesNotFoundError) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }

  @Post('runs/:id/extract-serp-derived-candidates')
  @HttpCode(202)
  async extractSerpDerivedCandidates(
    @Param('id') id: string,
  ): Promise<ExtractSerpDerivedCandidatesResult> {
    try {
      return await this.commandBus.execute(new ExtractSerpDerivedCandidatesCommand(id));
    } catch (error) {
      if (error instanceof SeoBriefRunNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof Error && error.message.includes('Fetch SERP snapshots')) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }

  @Post('runs/:id/aggregate-serp-domains')
  @HttpCode(202)
  async aggregateSerpDomains(@Param('id') id: string): Promise<AggregateSerpDomainsResult> {
    try {
      return await this.commandBus.execute(new AggregateSerpDomainsCommand(id));
    } catch (error) {
      if (error instanceof SeoBriefRunNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof Error && error.message.includes('Fetch SERP snapshots')) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }

  @Post('runs/:id/classify-serp-domains')
  @HttpCode(202)
  async classifySerpDomains(
    @Param('id') id: string,
  ): Promise<ClassifySerpDomainsUseCaseResult> {
    try {
      return await this.commandBus.execute(new ClassifySerpDomainsCommand(id));
    } catch (error) {
      if (error instanceof SeoBriefRunNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof Error && error.message.includes('Aggregate SERP domains')) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }

  @Post('runs/:id/fetch-ranked-keywords')
  @HttpCode(202)
  async fetchRankedKeywords(@Param('id') id: string): Promise<FetchRankedKeywordsResult> {
    try {
      return await this.commandBus.execute(new FetchRankedKeywordsCommand(id));
    } catch (error) {
      if (error instanceof SeoBriefRunNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (
        error instanceof Error &&
        (error.message.includes('Classify SERP domains') ||
          error.message.includes('No Ranked Keywords target domains'))
      ) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }

  @Post('runs/:id/build-competitor-keyword-map')
  @HttpCode(202)
  async buildCompetitorKeywordMap(
    @Param('id') id: string,
  ): Promise<BuildCompetitorKeywordMapResult> {
    try {
      return await this.commandBus.execute(new BuildCompetitorKeywordMapCommand(id));
    } catch (error) {
      if (error instanceof SeoBriefRunNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (
        error instanceof Error &&
        (error.message.includes('Create SEO brief run input') ||
          error.message.includes('Add manual competitor domains'))
      ) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }

  @Post('runs/:id/match-competitor-keywords')
  @HttpCode(202)
  async matchCompetitorKeywords(
    @Param('id') id: string,
  ): Promise<MatchCompetitorKeywordsResult> {
    try {
      return await this.commandBus.execute(new MatchCompetitorKeywordsCommand(id));
    } catch (error) {
      if (error instanceof SeoBriefRunNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (
        error instanceof Error &&
        (error.message.includes('Generate keyword hypotheses') ||
          error.message.includes('Extract SERP candidates') ||
          error.message.includes('Build competitor keyword map'))
      ) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }

  @Post('runs/:id/build-dirty-keyword-pool')
  @HttpCode(202)
  async buildDirtyKeywordPool(@Param('id') id: string): Promise<BuildDirtyKeywordPoolResult> {
    try {
      return await this.commandBus.execute(new BuildDirtyKeywordPoolCommand(id));
    } catch (error) {
      if (error instanceof SeoBriefRunNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (
        error instanceof Error &&
        (error.message.includes('No keyword sources') ||
          error.message.includes('Run competitor keyword matching'))
      ) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }

  @Post('runs/:id/score-keyword-candidates')
  @HttpCode(202)
  async scoreKeywordCandidates(@Param('id') id: string): Promise<ScoreKeywordCandidatesResult> {
    try {
      return await this.commandBus.execute(new ScoreKeywordCandidatesCommand(id));
    } catch (error) {
      if (error instanceof SeoBriefRunNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (
        error instanceof Error &&
        (error.message.includes('Build dirty keyword pool') ||
          error.message.includes('Dirty keyword pool'))
      ) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }

  @Post('runs/:id/cluster-keyword-candidates')
  @HttpCode(202)
  async clusterKeywordCandidates(
    @Param('id') id: string,
  ): Promise<ClusterKeywordCandidatesResult> {
    try {
      return await this.commandBus.execute(new ClusterKeywordCandidatesCommand(id));
    } catch (error) {
      if (error instanceof SeoBriefRunNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (
        error instanceof Error &&
        (error.message.includes('Score keyword candidates') ||
          error.message.includes('candidate scoring') ||
          error.message.includes('viable candidates'))
      ) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }

  @Post('runs/:id/review-cluster-product-fit')
  @HttpCode(202)
  async reviewClusterProductFit(
    @Param('id') id: string,
  ): Promise<ReviewClusterProductFitUseCaseResult> {
    try {
      return await this.commandBus.execute(new ReviewClusterProductFitCommand(id));
    } catch (error) {
      if (error instanceof SeoBriefRunNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (
        error instanceof Error &&
        (error.message.includes('Build intent clusters') ||
          error.message.includes('cluster snapshot') ||
          error.message.includes('clusters to review'))
      ) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }

  @Post('runs/:id/select-seo-brief-clusters')
  @HttpCode(202)
  async selectSeoBriefClusters(
    @Param('id') id: string,
  ): Promise<SelectSeoBriefClustersResult> {
    try {
      return await this.commandBus.execute(new SelectSeoBriefClustersCommand(id));
    } catch (error) {
      if (error instanceof SeoBriefRunNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (
        error instanceof Error &&
        (error.message.includes('Review cluster Product Fit') ||
          error.message.includes('Product Fit review') ||
          error.message.includes('clusters to select'))
      ) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }

  @Post('runs/:id/fetch-selected-cluster-onpage')
  @HttpCode(202)
  async fetchSelectedClusterOnPage(
    @Param('id') id: string,
  ): Promise<FetchSelectedClusterOnPageResult> {
    try {
      return await this.commandBus.execute(new FetchSelectedClusterOnPageCommand(id));
    } catch (error) {
      if (error instanceof SeoBriefRunNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (
        error instanceof Error &&
        (error.message.includes('Select main SEO brief cluster') ||
          error.message.includes('usable on-page URLs') ||
          error.message.includes('on-page evidence fetch failed'))
      ) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }

  @Post('runs/:id/synthesize-onpage')
  @HttpCode(202)
  async synthesizeOnPage(
    @Param('id') id: string,
  ): Promise<SynthesizeOnPageUseCaseResult> {
    try {
      return await this.commandBus.execute(new SynthesizeOnPageCommand(id));
    } catch (error) {
      if (error instanceof SeoBriefRunNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (
        error instanceof Error &&
        (error.message.includes('Select main SEO brief cluster') ||
          error.message.includes('Fetch selected cluster OnPage evidence') ||
          error.message.includes('completed pages to synthesize'))
      ) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }

  @Post('runs/:id/generate-final-brief')
  @HttpCode(202)
  async generateFinalBrief(
    @Param('id') id: string,
  ): Promise<GenerateFinalSeoBriefUseCaseResult> {
    try {
      return await this.commandBus.execute(new GenerateFinalSeoBriefCommand(id));
    } catch (error) {
      if (error instanceof SeoBriefRunNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (
        error instanceof Error &&
        (error.message.includes('Select main SEO brief cluster') ||
          error.message.includes('Synthesize OnPage evidence') ||
          error.message.includes('usable main cluster'))
      ) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }

  @Post('runs/:id/select-first-keyword-related-queries')
  @HttpCode(202)
  async selectFirstKeywordRelatedQueries(
    @Param('id') id: string,
  ): Promise<SelectFirstKeywordRelatedQueriesResult> {
    try {
      return await this.commandBus.execute(new SelectFirstKeywordRelatedQueriesCommand(id));
    } catch (error) {
      if (error instanceof SeoBriefRunNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof SeoBriefSerpDerivedKeywordsNotFoundError) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }

  @Post('runs/:id/select-keyword-related-queries')
  @HttpCode(202)
  async selectKeywordRelatedQueries(
    @Param('id') id: string,
  ): Promise<SelectKeywordRelatedQueriesResult> {
    try {
      return await this.commandBus.execute(new SelectKeywordRelatedQueriesCommand(id));
    } catch (error) {
      if (error instanceof SeoBriefRunNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof SeoBriefSerpDerivedKeywordsNotFoundError) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }

  @Post('runs/:id/rerun-stage')
  @HttpCode(202)
  async rerunStage(
    @Param('id') id: string,
    @Body(new ValibotPipe(RerunSeoBriefStageSchema))
    dto: RerunSeoBriefStageDto,
  ) {
    return this.executeControlCommand(
      new RerunSeoBriefStageCommand(id, {
        stage: dto.stage,
        seoWeight: dto.seoProductBalance?.seoWeight ?? null,
        productWeight: dto.seoProductBalance?.productWeight ?? null,
      }),
    );
  }

  @Post('runs/:id/regenerate-brief')
  @HttpCode(202)
  async regenerateBrief(@Param('id') id: string) {
    return this.executeControlCommand(new RegenerateSeoBriefCommand(id));
  }

  @Post('runs/:id/manual-review')
  async markManualReview(
    @Param('id') id: string,
    @Body(new ValibotPipe(SeoBriefControlNoteSchema))
    dto: SeoBriefControlNoteDto,
  ) {
    return this.executeControlCommand(
      new MarkSeoBriefRunManualReviewCommand(id, {
        reason: dto.reason ?? null,
      }),
    );
  }

  @Post('runs/:id/reject')
  async rejectRun(
    @Param('id') id: string,
    @Body(new ValibotPipe(SeoBriefControlNoteSchema))
    dto: SeoBriefControlNoteDto,
  ) {
    return this.executeControlCommand(
      new RejectSeoBriefRunCommand(id, {
        reason: dto.reason ?? null,
      }),
    );
  }

  private async executeControlCommand(command: ICommand) {
    try {
      return await this.commandBus.execute(command);
    } catch (error) {
      if (error instanceof SeoBriefRunNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof SeoBriefRunBusyError) {
        throw new ConflictException(error.message);
      }
      if (error instanceof SeoBriefRunAttemptLimitError) {
        throw new ConflictException(error.message);
      }
      if (error instanceof SeoBriefRunNoNextStageError) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }
}

function parseLimit(value?: string): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeSeoBriefRunStatus(value?: string): CreateSeoBriefRunResult['status'] | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim();
  const allowedStatuses = new Set<CreateSeoBriefRunResult['status']>([
    'created',
    'awaiting_confirmation',
    'queued',
    'running',
    'done',
    'failed',
    'rejected',
    'needs_manual_review',
  ]);

  return allowedStatuses.has(normalized as CreateSeoBriefRunResult['status'])
    ? (normalized as CreateSeoBriefRunResult['status'])
    : undefined;
}
