import { createHash } from 'node:crypto';
import {
  type AdaptationId,
  AddAdaptationCommand,
  ApproveAdaptationCommand,
  type ArticleId,
  type ChannelId,
  CreateArticleCommand,
  GenerateAdaptationCommand,
  type ProjectId,
} from '@marketing-service/editorial';
import {
  AggregateSerpDomainsCommand,
  type AggregateSerpDomainsResult,
  BuildCompetitorKeywordMapCommand,
  type BuildCompetitorKeywordMapResult,
  BuildDirtyKeywordPoolCommand,
  type BuildDirtyKeywordPoolResult,
  ClassifySerpDomainsCommand,
  type ClassifySerpDomainsUseCaseResult,
  CleanupLongreadArticleCommand,
  type CleanupLongreadArticleUseCaseResult,
  ClusterKeywordCandidatesCommand,
  type ClusterKeywordCandidatesResult,
  ContinueSeoBriefRunCommand,
  CreateSeoBriefRunCommand,
  type CreateSeoBriefRunResult,
  type ExtractedSeoBriefContext,
  ExtractSerpDerivedCandidatesCommand,
  type ExtractSerpDerivedCandidatesResult,
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
  GenerateLongreadDraftCommand,
  type GenerateLongreadDraftResult,
  GenerateUserPainScenariosCommand,
  type GenerateUserPainScenariosResult,
  GetSeoBriefRunQuery,
  type GetSeoBriefRunResult,
  ListSeoBriefRunsQuery,
  type ListSeoBriefRunsResultItem,
  MarkSeoBriefRunManualReviewCommand,
  MatchCompetitorKeywordsCommand,
  type MatchCompetitorKeywordsResult,
  PackageLongreadArticleCommand,
  type PackageLongreadArticleUseCaseResult,
  RegenerateSeoBriefCommand,
  RejectSeoBriefRunCommand,
  RerunSeoBriefRunCommand,
  RerunSeoBriefStageCommand,
  ReviewClusterProductFitCommand,
  type ReviewClusterProductFitUseCaseResult,
  ScoreKeywordCandidatesCommand,
  type ScoreKeywordCandidatesResult,
  SelectFirstKeywordRelatedQueriesCommand,
  type SelectFirstKeywordRelatedQueriesResult,
  SelectKeywordRelatedQueriesCommand,
  type SelectKeywordRelatedQueriesResult,
  SelectSeoBriefClustersCommand,
  type SelectSeoBriefClustersResult,
  SeoBriefAiPort,
  SeoBriefArtifact,
  SeoBriefArtifactRepository,
  type SeoBriefJsonObject,
  type SeoBriefJsonValue,
  SeoBriefKeywordHypothesesNotFoundError,
  SeoBriefLlmCallLog,
  SeoBriefLlmLogRepository,
  SeoBriefProjectNotFoundError,
  SeoBriefRunAttemptLimitError,
  SeoBriefRunBusyError,
  type SeoBriefRunId,
  SeoBriefRunNoNextStageError,
  SeoBriefRunNotFoundError,
  SeoBriefSerpDerivedKeywordsNotFoundError,
  SynthesizeOnPageCommand,
  type SynthesizeOnPageUseCaseResult,
  UpdateFinalSeoBriefCommand,
  type UpdateFinalSeoBriefResult,
} from '@marketing-service/seo-briefing';
import {
  BadRequestException,
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
import { ConfigService } from '@nestjs/config';
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
  type MatchCompetitorKeywordsDto,
  MatchCompetitorKeywordsSchema,
} from './schemas/match-competitor-keywords.schema.js';
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
import {
  type UpdateFinalSeoBriefDto,
  UpdateFinalSeoBriefSchema,
} from './schemas/update-final-seo-brief.schema.js';

interface SelectSeoBriefClustersDto {
  selectedClusterName?: string | null;
}

interface SeoBriefAdaptationChannelDto {
  channelId?: string | null;
  displayName?: string | null;
  promptInstructions?: string | null;
}

interface CreateLongreadAdaptationsDto {
  channels?: SeoBriefAdaptationChannelDto[];
}

interface CreateLongreadAdaptationsResult {
  articleId: string;
  dashboardUrl: string | null;
  adaptations: Array<{
    adaptationId: string;
    channelId: string;
    displayName: string;
    preview: string;
  }>;
  artifactType: 'longread_adaptations_export';
}

interface PublishBlogArticleDto {
  articleId?: string | null;
  coverImageUrl?: string | null;
  locale?: string | null;
  status?: 'draft' | 'published';
}

interface PublishBlogArticleResult {
  articleId: string;
  artifactType: 'blog_publish_result';
  localizedUrls: Record<string, string> | null;
  locale: string;
  slug: string | null;
  status: 'draft' | 'published';
  url: string | null;
}

@Controller('seo-briefing')
export class SeoBriefController {
  constructor(
    @Inject(CommandBus)
    private readonly commandBus: CommandBus,
    @Inject(QueryBus)
    private readonly queryBus: QueryBus,
    @Inject(SeoBriefAiPort)
    private readonly ai: SeoBriefAiPort,
    @Inject(SeoBriefArtifactRepository)
    private readonly artifactRepository: SeoBriefArtifactRepository,
    @Inject(SeoBriefLlmLogRepository)
    private readonly llmLogRepository: SeoBriefLlmLogRepository,
    @Inject(ConfigService)
    private readonly config: ConfigService,
  ) {}

  private async startAdaptationLlmLog(params: {
    adaptationId: AdaptationId;
    articleContent: string;
    articleId: ArticleId;
    channel: NormalizedAdaptationChannel;
    promptInstructions: string;
    runId: SeoBriefRunId;
  }): Promise<SeoBriefLlmCallLog> {
    const log = SeoBriefLlmCallLog.start({
      runId: params.runId,
      stepId: null,
      operation: `generateLongreadAdaptation:${params.channel.channelId}`,
      model: resolveEditorialDeepSeekModel(this.config),
      promptVersion: 'editorial.generate-adaptation.v1',
      requestPayload: {
        articleId: params.articleId,
        adaptationId: params.adaptationId,
        channelId: params.channel.channelId,
        displayName: params.channel.displayName,
        sourceContentChars: params.articleContent.length,
        promptInstructionsChars: params.promptInstructions.length,
      },
    });
    await this.llmLogRepository.save(log);
    return log;
  }

  private async completeAdaptationLlmLog(
    logId: SeoBriefLlmCallLog['id'],
    params: {
      adaptedContent: string;
      articleContent: string;
      normalizedInputPayload: SeoBriefJsonObject | null;
    },
  ): Promise<void> {
    const log = await this.llmLogRepository.findById(logId);
    if (!log) {
      return;
    }

    const tokenUsageInput = estimateTokenCount(params.articleContent);
    const tokenUsageOutput = estimateTokenCount(params.adaptedContent);
    log.complete({
      responsePayload: {
        adaptedContentPreview: createPreview(params.adaptedContent),
        adaptedContentChars: params.adaptedContent.length,
      },
      tokenUsageInput,
      tokenUsageOutput,
      estimatedCost: estimateDeepSeekCost(
        tokenUsageInput,
        tokenUsageOutput,
        readDeepSeekPricing(params.normalizedInputPayload),
      ),
    });
    await this.llmLogRepository.save(log);
  }

  private async failAdaptationLlmLog(
    logId: SeoBriefLlmCallLog['id'],
    params: {
      articleContent: string;
      error: unknown;
      normalizedInputPayload: SeoBriefJsonObject | null;
    },
  ): Promise<void> {
    const log = await this.llmLogRepository.findById(logId);
    if (!log || log.status !== 'running') {
      return;
    }

    const tokenUsageInput = estimateTokenCount(params.articleContent);
    log.fail({
      errorMessage:
        params.error instanceof Error ? params.error.message : 'Adaptation generation failed',
      tokenUsageInput,
      tokenUsageOutput: null,
      estimatedCost: estimateDeepSeekCost(
        tokenUsageInput,
        0,
        readDeepSeekPricing(params.normalizedInputPayload),
      ),
    });
    await this.llmLogRepository.save(log);
  }

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
      promptInstructionOverrides: dto.promptInstructionOverrides ?? null,
      timeoutMs: dto.requestTimeoutMs ?? null,
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
  async classifySerpDomains(@Param('id') id: string): Promise<ClassifySerpDomainsUseCaseResult> {
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
          error.message.includes('Add manual competitor domains') ||
          error.message.includes('No Brand Memory competitor keyword map'))
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
    @Body(new ValibotPipe(MatchCompetitorKeywordsSchema))
    dto: MatchCompetitorKeywordsDto,
  ): Promise<MatchCompetitorKeywordsResult> {
    try {
      return await this.commandBus.execute(new MatchCompetitorKeywordsCommand(id, dto.mode));
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
  async clusterKeywordCandidates(@Param('id') id: string): Promise<ClusterKeywordCandidatesResult> {
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
    @Body() dto: SelectSeoBriefClustersDto = {},
  ): Promise<SelectSeoBriefClustersResult> {
    try {
      return await this.commandBus.execute(
        new SelectSeoBriefClustersCommand(id, dto.selectedClusterName),
      );
    } catch (error) {
      if (error instanceof SeoBriefRunNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (
        error instanceof Error &&
        (error.message.includes('Review cluster Product Fit') ||
          error.message.includes('Product Fit review') ||
          error.message.includes('clusters to select') ||
          error.message.includes('Selected cluster'))
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
          error.message.includes('Select a main SEO brief cluster') ||
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
  async synthesizeOnPage(@Param('id') id: string): Promise<SynthesizeOnPageUseCaseResult> {
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
  async generateFinalBrief(@Param('id') id: string): Promise<GenerateFinalSeoBriefUseCaseResult> {
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

  @Post('runs/:id/final-brief/manual-edit')
  @HttpCode(202)
  async updateFinalBrief(
    @Param('id') id: string,
    @Body(new ValibotPipe(UpdateFinalSeoBriefSchema)) dto: UpdateFinalSeoBriefDto,
  ): Promise<UpdateFinalSeoBriefResult> {
    try {
      return await this.commandBus.execute(
        new UpdateFinalSeoBriefCommand(id, dto.briefPayload as never),
      );
    } catch (error) {
      if (error instanceof SeoBriefRunNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (
        error instanceof Error &&
        (error.message.includes('Generate Final Brief') ||
          error.message.includes('briefPayload must be a JSON object'))
      ) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }

  @Post('runs/:id/generate-longread-draft')
  @HttpCode(202)
  async generateLongreadDraft(@Param('id') id: string): Promise<GenerateLongreadDraftResult> {
    try {
      return await this.commandBus.execute(new GenerateLongreadDraftCommand(id));
    } catch (error) {
      if (error instanceof SeoBriefRunNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (
        error instanceof Error &&
        (error.message.includes('Generate Final Brief') ||
          error.message.includes('brief_validation_failed'))
      ) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }

  @Post('runs/:id/cleanup-longread-article')
  @HttpCode(202)
  async cleanupLongreadArticle(
    @Param('id') id: string,
  ): Promise<CleanupLongreadArticleUseCaseResult> {
    try {
      return await this.commandBus.execute(new CleanupLongreadArticleCommand(id));
    } catch (error) {
      if (error instanceof SeoBriefRunNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (
        error instanceof Error &&
        (error.message.includes('Generate longread draft') ||
          error.message.includes('Generate Final Brief') ||
          error.message.includes('brief_validation_failed'))
      ) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }

  @Post('runs/:id/package-longread-article')
  @HttpCode(202)
  async packageLongreadArticle(
    @Param('id') id: string,
  ): Promise<PackageLongreadArticleUseCaseResult> {
    try {
      return await this.commandBus.execute(new PackageLongreadArticleCommand(id));
    } catch (error) {
      if (error instanceof SeoBriefRunNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (
        error instanceof Error &&
        (error.message.includes('Run longread safety cleanup') ||
          error.message.includes('Longread cleanup must pass') ||
          error.message.includes('Generate Final Brief') ||
          error.message.includes('brief_validation_failed'))
      ) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }

  @Post('runs/:id/create-longread-adaptations')
  @HttpCode(202)
  async createLongreadAdaptations(
    @Param('id') id: string,
    @Body() dto: CreateLongreadAdaptationsDto = {},
  ): Promise<CreateLongreadAdaptationsResult> {
    const run = await this.queryBus.execute(new GetSeoBriefRunQuery(id as SeoBriefRunId));
    if (!run) {
      throw new NotFoundException(`SEO brief run ${id} not found`);
    }
    if (!run.projectId) {
      throw new ConflictException(
        'SEO brief run must be connected to a project before creating adaptations',
      );
    }

    const packageArtifact = findLatestSeoBriefArtifact(run, 'longread_final_package');
    const packagePayload = readSeoBriefObject(packageArtifact?.payload);
    const article = readSeoBriefObject(packagePayload?.article);
    const bodyMarkdown = readNonEmptyString(article?.bodyMarkdown);
    if (!packagePayload || !article || !bodyMarkdown) {
      throw new ConflictException('Create Final Article Package before creating adaptations');
    }

    const title = readNonEmptyString(article.title) ?? run.topicSeed;
    const articleContent = buildArticleSourceContent(title, bodyMarkdown);
    const seoBriefContext = buildSeoBriefAdaptationContext(run, packagePayload);
    const normalizedInputArtifact = findLatestSeoBriefArtifact(run, 'normalized_input');
    const normalizedInputPayload = readSeoBriefObject(normalizedInputArtifact?.payload);
    const coverImageUrl = readNonEmptyString(normalizedInputPayload?.coverImageUrl);
    const articleLanguage = normalizeBlogLocale(run.market.language);
    const articleId = (await this.commandBus.execute(
      new CreateArticleCommand(
        run.projectId as ProjectId,
        articleContent,
        articleLanguage,
        {
          source: 'seo_brief_longread',
          seoBriefRunId: run.id,
          topicSeed: run.topicSeed,
          finalPackageArtifactId: packageArtifact?.id ?? null,
          finalPackageCreatedAt: packageArtifact?.createdAt
            ? new Date(packageArtifact.createdAt).toISOString()
            : null,
          finalBrief: compactSeoBriefContext(run.finalBrief?.briefPayload),
          articlePackage: compactArticlePackage(packagePayload),
          coverImageUrl,
        },
        coverImageUrl,
      ),
    )) as ArticleId;

    const channels = normalizeAdaptationChannels(dto.channels);
    const adaptations: CreateLongreadAdaptationsResult['adaptations'] = [];
    for (const channel of channels) {
      const promptInstructions = buildSeoBriefAdaptationInstructions(
        seoBriefContext,
        channel.channelId,
        channel.displayName,
        channel.promptInstructions,
      );
      const adaptationId = (await this.commandBus.execute(
        new AddAdaptationCommand(
          articleId,
          channel.channelId as ChannelId,
          channel.displayName,
          promptInstructions,
        ),
      )) as AdaptationId;
      const adaptationLog = await this.startAdaptationLlmLog({
        runId: run.id as SeoBriefRunId,
        articleId,
        adaptationId,
        channel,
        articleContent,
        promptInstructions,
      });
      let adaptedContent = '';
      try {
        adaptedContent = (await this.commandBus.execute(
          new GenerateAdaptationCommand(articleId, adaptationId),
        )) as string;
        await this.completeAdaptationLlmLog(adaptationLog.id, {
          articleContent,
          adaptedContent,
          normalizedInputPayload,
        });
      } catch (error) {
        await this.failAdaptationLlmLog(adaptationLog.id, {
          error,
          articleContent,
          normalizedInputPayload,
        });
        throw error;
      }
      await this.commandBus.execute(new ApproveAdaptationCommand(articleId, adaptationId));
      adaptations.push({
        adaptationId,
        channelId: channel.channelId,
        displayName: channel.displayName,
        preview: createPreview(adaptedContent),
      });
    }

    const result: CreateLongreadAdaptationsResult = {
      articleId,
      dashboardUrl: `/test-ui/project?projectId=${encodeURIComponent(run.projectId)}`,
      adaptations,
      artifactType: 'longread_adaptations_export',
    };
    await this.artifactRepository.save(
      SeoBriefArtifact.create({
        runId: run.id as SeoBriefRunId,
        stage: 'brief_generation',
        artifactType: result.artifactType,
        payload: {
          artifactVersion: 'longread_adaptations_export_v1',
          articleId,
          dashboardUrl: result.dashboardUrl,
          adaptations,
          sourceArtifactType: 'longread_final_package',
          sourceArtifactId: packageArtifact?.id ?? null,
        } satisfies SeoBriefJsonObject,
        attempt: nextSeoBriefArtifactAttempt(run, result.artifactType),
      }),
    );

    return result;
  }

  @Post('runs/:id/publish-blog')
  @HttpCode(202)
  async publishBlogArticle(
    @Param('id') id: string,
    @Body() dto: PublishBlogArticleDto = {},
  ): Promise<PublishBlogArticleResult> {
    const run = await this.queryBus.execute(new GetSeoBriefRunQuery(id as SeoBriefRunId));
    if (!run) {
      throw new NotFoundException(`SEO brief run ${id} not found`);
    }

    const packageArtifact = findLatestSeoBriefArtifact(run, 'longread_final_package');
    const packagePayload = readSeoBriefObject(packageArtifact?.payload);
    const article = readSeoBriefObject(packagePayload?.article);
    const title = readNonEmptyString(article?.title);
    const bodyMd = readNonEmptyString(article?.bodyMarkdown);
    if (!packagePayload || !article || !title || !bodyMd) {
      throw new ConflictException('Create Final Article Package before publishing to Blog');
    }

    const normalizedInputArtifact = findLatestSeoBriefArtifact(run, 'normalized_input');
    const normalizedInputPayload = readSeoBriefObject(normalizedInputArtifact?.payload);
    const coverImageUrl =
      readNonEmptyString(dto.coverImageUrl) ??
      readNonEmptyString(normalizedInputPayload?.coverImageUrl) ??
      readNonEmptyString(article.coverImageUrl) ??
      readNonEmptyString(packagePayload.coverImageUrl) ??
      readNonEmptyString(process.env.BLOG_DEFAULT_COVER_IMAGE_URL);
    if (!coverImageUrl) {
      throw new BadRequestException(
        'coverImageUrl is required for Blog publishing. Provide a direct HTTPS image URL.',
      );
    }
    assertHttpsUrl(coverImageUrl, 'coverImageUrl');

    const locale = normalizeBlogLocale(dto.locale ?? run.market.language);
    const status = dto.status === 'draft' ? 'draft' : 'published';
    const blogArticleId =
      readNonEmptyString(dto.articleId) ?? deterministicUuid(`seo-brief-blog:${run.id}:${locale}`);
    const excerpt =
      readNonEmptyString(article.metaDescription) ??
      readNonEmptyString(packagePayload.seoSummary) ??
      null;
    const requestPayload = {
      articleId: blogArticleId,
      status,
      coverImageUrl,
      translations: [
        {
          locale,
          title,
          excerpt,
          bodyMd,
        },
      ],
    };

    const responsePayload = await publishBlogAdminArticle(blogArticleId, requestPayload);
    const result: PublishBlogArticleResult = {
      articleId: blogArticleId,
      artifactType: 'blog_publish_result',
      localizedUrls: readStringRecord(responsePayload.localizedUrls),
      locale,
      slug: readNonEmptyString(responsePayload.slug),
      status,
      url: readNonEmptyString(responsePayload.url),
    };

    await this.artifactRepository.save(
      SeoBriefArtifact.create({
        runId: run.id as SeoBriefRunId,
        stage: 'brief_generation',
        artifactType: result.artifactType,
        payload: {
          artifactVersion: 'blog_publish_result_v1',
          sourceArtifactType: 'longread_final_package',
          sourceArtifactId: packageArtifact?.id ?? null,
          coverImageUrl,
          requestPayload,
          responsePayload,
          ...result,
        } satisfies SeoBriefJsonObject,
        attempt: nextSeoBriefArtifactAttempt(run, result.artifactType),
      }),
    );

    return result;
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

type SeoBriefRunArtifactResult = GetSeoBriefRunResult['artifacts'][number];

interface NormalizedAdaptationChannel {
  channelId: string;
  displayName: string;
  promptInstructions: string | null;
}

interface DeepSeekPricing {
  inputUsdPerMillionTokens: number;
  outputUsdPerMillionTokens: number;
}

function resolveEditorialDeepSeekModel(config: ConfigService): string {
  return (
    config.get<string>('DEEPSEEK_ADAPTATION_MODEL')?.trim() ||
    config.get<string>('DEEPSEEK_CONTENT_MODEL')?.trim() ||
    config.get<string>('DEEPSEEK_MODEL')?.trim() ||
    'deepseek-v4-pro'
  );
}

function estimateTokenCount(value: string): number {
  return Math.max(1, Math.ceil(value.length / 4));
}

function readDeepSeekPricing(payload: SeoBriefJsonObject | null): DeepSeekPricing | null {
  const pricing = readSeoBriefObject(payload?.deepSeekPricing);
  const inputUsdPerMillionTokens = pricing?.inputUsdPerMillionTokens;
  const outputUsdPerMillionTokens = pricing?.outputUsdPerMillionTokens;
  if (
    typeof inputUsdPerMillionTokens !== 'number' ||
    !Number.isFinite(inputUsdPerMillionTokens) ||
    inputUsdPerMillionTokens < 0 ||
    typeof outputUsdPerMillionTokens !== 'number' ||
    !Number.isFinite(outputUsdPerMillionTokens) ||
    outputUsdPerMillionTokens < 0
  ) {
    return null;
  }

  return { inputUsdPerMillionTokens, outputUsdPerMillionTokens };
}

function estimateDeepSeekCost(
  inputTokens: number,
  outputTokens: number,
  pricing: DeepSeekPricing | null,
): number | null {
  if (!pricing) {
    return null;
  }

  return Number(
    (
      (inputTokens / 1_000_000) * pricing.inputUsdPerMillionTokens +
      (outputTokens / 1_000_000) * pricing.outputUsdPerMillionTokens
    ).toFixed(8),
  );
}

function findLatestSeoBriefArtifact(
  run: GetSeoBriefRunResult,
  artifactType: string,
): SeoBriefRunArtifactResult | null {
  return (
    [...run.artifacts].reverse().find((artifact) => artifact.artifactType === artifactType) ?? null
  );
}

function nextSeoBriefArtifactAttempt(run: GetSeoBriefRunResult, artifactType: string): number {
  return run.artifacts.filter((artifact) => artifact.artifactType === artifactType).length + 1;
}

function readSeoBriefObject(value: unknown): SeoBriefJsonObject | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as SeoBriefJsonObject)
    : null;
}

function readNonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readStringRecord(value: unknown): Record<string, string> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  const entries = Object.entries(value).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string',
  );
  return entries.length > 0 ? Object.fromEntries(entries) : null;
}

function deterministicUuid(input: string): string {
  const hex = createHash('sha256').update(input).digest('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `5${hex.slice(13, 16)}`,
    ((Number.parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80).toString(16) + hex.slice(18, 20),
    hex.slice(20, 32),
  ].join('-');
}

function assertHttpsUrl(value: string, fieldName: string): void {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') {
      throw new Error('Expected HTTPS');
    }
  } catch {
    throw new BadRequestException(`${fieldName} must be a valid direct HTTPS URL`);
  }
}

function normalizeBlogLocale(value: string | null | undefined): string {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace('_', '-');
  const known: Record<string, string> = {
    af: 'af',
    afrikaans: 'af',
    ar: 'ar',
    arabic: 'ar',
    de: 'de',
    german: 'de',
    en: 'en',
    english: 'en',
    es: 'es',
    spanish: 'es',
    fr: 'fr',
    french: 'fr',
    ha: 'ha',
    hausa: 'ha',
    hi: 'hi',
    hindi: 'hi',
    id: 'id',
    indonesian: 'id',
    ig: 'ig',
    igbo: 'ig',
    it: 'it',
    italian: 'it',
    ja: 'ja',
    japanese: 'ja',
    jv: 'jv',
    javanese: 'jv',
    ko: 'ko',
    korean: 'ko',
    ms: 'ms',
    malay: 'ms',
    nl: 'nl',
    dutch: 'nl',
    pa: 'pa',
    punjabi: 'pa',
    pcm: 'pcm',
    pidgin: 'pcm',
    pl: 'pl',
    polish: 'pl',
    ps: 'ps',
    pashto: 'ps',
    pt: 'pt',
    portuguese: 'pt',
    ro: 'ro',
    romanian: 'ro',
    ru: 'ru',
    russian: 'ru',
    th: 'th',
    thai: 'th',
    tl: 'tl',
    tagalog: 'tl',
    fil: 'tl',
    filipino: 'tl',
    tr: 'tr',
    turkish: 'tr',
    ur: 'ur',
    urdu: 'ur',
    vi: 'vi',
    vietnamese: 'vi',
    xh: 'xh',
    xhosa: 'xh',
    yo: 'yo',
    yoruba: 'yo',
    zu: 'zu',
    zulu: 'zu',
  };
  const locale = known[normalized] ?? normalized;
  const supported = new Set([
    'en',
    'pt',
    'id',
    'es',
    'vi',
    'ur',
    'tl',
    'pcm',
    'ha',
    'pa',
    'yo',
    'jv',
    'ps',
    'zu',
    'tr',
    'ar',
    'ru',
    'hi',
    'ja',
    'ko',
    'fr',
    'de',
    'it',
    'nl',
    'ms',
    'th',
    'af',
    'xh',
    'ig',
    'pl',
    'ro',
  ]);
  if (!supported.has(locale)) {
    throw new BadRequestException(`Unsupported Blog locale: ${value || 'empty'}`);
  }
  return locale;
}

function resolveBlogAdminArticlesUrl(articleId?: string): string {
  const rawBase = readNonEmptyString(process.env.BLOG_ADMIN_BASE_URL);
  if (!rawBase) {
    throw new ConflictException('BLOG_ADMIN_BASE_URL is not configured');
  }
  const base = rawBase.replace(/\/+$/, '');
  const articlePath = articleId ? `/${encodeURIComponent(articleId)}` : '';
  if (base.endsWith('/v1/blog')) {
    return `${base}/admin/articles${articlePath}`;
  }
  return `${base}/v1/blog/admin/articles${articlePath}`;
}

function resolveBlogAdminApiKey(): string {
  const key = readNonEmptyString(process.env.BLOG_ADMIN_API_KEY);
  if (!key) {
    throw new ConflictException('BLOG_ADMIN_API_KEY is not configured');
  }
  return key;
}

async function publishBlogAdminArticle(
  articleId: string,
  payload: SeoBriefJsonObject,
): Promise<SeoBriefJsonObject> {
  const response = await requestBlogAdmin(resolveBlogAdminArticlesUrl(), 'POST', payload);
  if (response.ok) {
    return response.payload;
  }
  if (response.status === 409 && response.kind === 'article-id-taken') {
    const { articleId: _articleId, status: _status, ...updatePayload } = payload;
    const putResponse = await requestBlogAdmin(
      resolveBlogAdminArticlesUrl(articleId),
      'PUT',
      updatePayload,
    );
    if (putResponse.ok) {
      return putResponse.payload;
    }
    throw blogAdminException(putResponse.status, putResponse.payload);
  }
  throw blogAdminException(response.status, response.payload);
}

async function requestBlogAdmin(
  url: string,
  method: 'POST' | 'PUT',
  payload: SeoBriefJsonObject,
): Promise<{ kind: string | null; ok: boolean; payload: SeoBriefJsonObject; status: number }> {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${resolveBlogAdminApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  const parsed = parseJsonObject(text);
  return {
    kind: readNonEmptyString(parsed.kind),
    ok: response.ok,
    payload: parsed,
    status: response.status,
  };
}

function parseJsonObject(text: string): SeoBriefJsonObject {
  if (!text.trim()) {
    return {};
  }
  try {
    const parsed = JSON.parse(text) as unknown;
    return readSeoBriefObject(parsed) ?? { raw: text };
  } catch {
    return { raw: text };
  }
}

function blogAdminException(status: number, payload: SeoBriefJsonObject): Error {
  const message =
    readNonEmptyString(payload.detail) ??
    readNonEmptyString(payload.title) ??
    readNonEmptyString(payload.message) ??
    `Blog admin request failed with HTTP ${status}`;
  if (status === 400 || status === 413) {
    return new BadRequestException(message);
  }
  if (status === 401) {
    return new ConflictException('Blog admin rejected BLOG_ADMIN_API_KEY');
  }
  if (status === 404) {
    return new NotFoundException(message);
  }
  return new ConflictException(message);
}

function normalizeAdaptationChannels(
  channels: SeoBriefAdaptationChannelDto[] | undefined,
): NormalizedAdaptationChannel[] {
  const normalized = Array.isArray(channels)
    ? channels
        .map((channel) => {
          const channelId = normalizePublishingChannelId(readNonEmptyString(channel.channelId));
          if (!channelId) {
            return null;
          }
          return {
            channelId,
            displayName:
              readNonEmptyString(channel.displayName) ?? defaultChannelDisplayName(channelId),
            promptInstructions: readNonEmptyString(channel.promptInstructions),
          };
        })
        .filter((channel): channel is NormalizedAdaptationChannel => Boolean(channel))
    : [];

  return normalized.length > 0
    ? normalized
    : [
        { channelId: 'channel_telegram', displayName: 'Telegram', promptInstructions: null },
        { channelId: 'channel_x', displayName: 'X', promptInstructions: null },
        { channelId: 'channel_discord', displayName: 'Discord', promptInstructions: null },
        { channelId: 'channel_blog', displayName: 'Blog', promptInstructions: null },
      ];
}

function normalizePublishingChannelId(channelId: string | null): string | null {
  const normalized = channelId?.trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  const known: Record<string, string> = {
    telegram: 'channel_telegram',
    channel_telegram: 'channel_telegram',
    x: 'channel_x',
    twitter: 'channel_x',
    channel_x: 'channel_x',
    discord: 'channel_discord',
    channel_discord: 'channel_discord',
    blog: 'channel_blog',
    channel_blog: 'channel_blog',
  };
  return known[normalized] ?? normalized;
}

function defaultChannelDisplayName(channelId: string): string {
  const known: Record<string, string> = {
    channel_telegram: 'Telegram',
    telegram: 'Telegram',
    channel_x: 'X',
    x: 'X',
    twitter: 'X',
    channel_discord: 'Discord',
    discord: 'Discord',
    channel_blog: 'Blog',
    blog: 'Blog',
  };
  return known[channelId] ?? channelId;
}

function buildArticleSourceContent(title: string, bodyMarkdown: string): string {
  const body = bodyMarkdown.trim();
  if (body.startsWith('#')) {
    return body;
  }
  return `# ${title.trim()}\n\n${body}`;
}

function buildSeoBriefAdaptationContext(
  run: GetSeoBriefRunResult,
  packagePayload: SeoBriefJsonObject,
): SeoBriefJsonObject {
  return {
    source: 'seo_brief_longread',
    runId: run.id,
    topicHint: run.topicSeed,
    market: {
      country: run.market.country,
      language: run.market.language,
    },
    audience: run.audience,
    product: {
      name: run.product.name,
      description: run.product.description,
    },
    keyMessage: run.keyMessage,
    cta: run.cta,
    finalBrief: compactSeoBriefContext(run.finalBrief?.briefPayload),
    articlePackage: compactArticlePackage(packagePayload),
    brandRules: {
      requiredPhrases: run.brandMemorySnapshot.requiredPhrases,
      bannedPhrases: run.brandMemorySnapshot.bannedPhrases,
      forbiddenClaims: run.brandMemorySnapshot.forbiddenClaims,
      adaptationPromptRules: run.brandMemorySnapshot.adaptationPromptRules,
    },
  };
}

function compactSeoBriefContext(value: unknown): SeoBriefJsonObject | null {
  const brief = readSeoBriefObject(value);
  if (!brief) {
    return null;
  }
  return {
    primaryKeyword: brief.primaryKeyword ?? null,
    secondaryKeywords: limitJsonArray(brief.secondaryKeywords, 12),
    searchIntent: brief.searchIntent ?? null,
    targetReader: brief.targetReader ?? null,
    recommendedTitle: brief.recommendedTitle ?? brief.recommendedH1 ?? null,
    recommendedH1: brief.recommendedH1 ?? null,
    metaDescription: brief.metaDescription ?? null,
    productInsertion: brief.productInsertion ?? null,
    riskNotes: limitJsonArray(brief.riskNotes, 8),
    outline: compactOutline(brief.outline),
    faq: limitJsonArray(brief.faq, 8),
  };
}

function compactArticlePackage(value: SeoBriefJsonObject): SeoBriefJsonObject {
  const article = readSeoBriefObject(value.article);
  const seo = readSeoBriefObject(value.seo);
  const productInsertion = readSeoBriefObject(value.productInsertion);
  const claimsReview = readSeoBriefObject(value.claimsReview);
  return {
    title: article?.title ?? null,
    slug: article?.slug ?? null,
    metaTitle: article?.metaTitle ?? null,
    metaDescription: article?.metaDescription ?? null,
    h1: article?.h1 ?? null,
    primaryKeyword: seo?.primaryKeyword ?? null,
    secondaryKeywordsUsed: limitJsonArray(seo?.secondaryKeywordsUsed, 12),
    searchIntent: seo?.searchIntent ?? null,
    productInsertion,
    claimsReview,
  };
}

function compactOutline(value: unknown): SeoBriefJsonValue[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.slice(0, 12).map((item) => {
    const section = readSeoBriefObject(item);
    if (!section) {
      return typeof item === 'string' ? item : JSON.stringify(item).slice(0, 240);
    }
    return {
      heading: section.heading ?? section.h2 ?? section.title ?? null,
      purpose: section.purpose ?? section.reason ?? null,
      notes: limitJsonArray(section.notes ?? section.bullets, 5),
    };
  });
}

function limitJsonArray(value: unknown, limit: number): SeoBriefJsonValue[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.slice(0, limit).map((item) => toSeoBriefJsonValue(item));
}

function toSeoBriefJsonValue(value: unknown): SeoBriefJsonValue {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => toSeoBriefJsonValue(item));
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(record)
        .slice(0, 20)
        .map(([key, item]) => [key, toSeoBriefJsonValue(item)]),
    ) as SeoBriefJsonObject;
  }
  return String(value);
}

function buildSeoBriefAdaptationInstructions(
  context: SeoBriefJsonObject,
  channelId: string,
  displayName: string,
  extraInstructions: string | null,
): string {
  const brandAdaptationRules = extractBrandAdaptationRules(context, channelId);
  const market = readSeoBriefObject(context.market);
  const targetLanguage = readNonEmptyString(market?.language);
  const base = [
    'Generate this adaptation from the supplied longread, but use the SEO brief context below as binding guidance.',
    `Target channel: ${displayName}.`,
    channelId === 'channel_blog'
      ? 'For Blog, preserve the full longread as a complete Markdown article. Do not summarize it into a short social post.'
      : null,
    targetLanguage
      ? `Write the entire adaptation in the SEO run language: ${targetLanguage}. Do not switch to English unless English is the selected language.`
      : null,
    'Brand Memory adaptation rules below are mandatory unless they conflict with hard factual or compliance constraints.',
    'Preserve the brief angle, target reader, primary keyword intent, product insertion boundaries, CTA, and compliance/risk constraints.',
    'Do not invent new product claims, APY guarantees, or unsupported facts. If a claim needs verification, phrase it cautiously.',
    brandAdaptationRules,
    extraInstructions ? `Extra channel instructions: ${extraInstructions}` : null,
    'SEO brief context:',
    JSON.stringify(context),
  ].filter(Boolean);
  return base.join('\n\n');
}

function extractBrandAdaptationRules(
  context: SeoBriefJsonObject,
  channelId: string,
): string | null {
  const brandRules = readSeoBriefObject(context.brandRules);
  const promptRules = readSeoBriefObject(brandRules?.adaptationPromptRules);
  if (!promptRules) {
    return null;
  }

  const generalInstructions = readNonEmptyString(promptRules.generalInstructions);
  const channelRules = readNonEmptyString(readChannelAdaptationRule(promptRules, channelId));
  const sections: string[] = [];

  if (generalInstructions) {
    sections.push(`Brand Memory general adaptation rules:\n${generalInstructions}`);
  }
  if (channelRules) {
    sections.push(`Brand Memory channel-specific adaptation rules:\n${channelRules}`);
  }

  return sections.length > 0 ? sections.join('\n\n') : null;
}

function readChannelAdaptationRule(promptRules: SeoBriefJsonObject, channelId: string): unknown {
  switch (channelId) {
    case 'channel_telegram':
      return promptRules.telegram;
    case 'channel_x':
      return promptRules.x;
    case 'channel_discord':
      return promptRules.discord;
    case 'channel_blog':
      return promptRules.blog;
    default:
      return null;
  }
}

function createPreview(value: string): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, 240);
}
