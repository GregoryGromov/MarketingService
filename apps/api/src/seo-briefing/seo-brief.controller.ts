import {
  AddAdaptationCommand,
  type AdaptationId,
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
  SeoBriefArtifact,
  SeoBriefArtifactRepository,
  type SeoBriefJsonObject,
  type SeoBriefJsonValue,
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
  UpdateFinalSeoBriefCommand,
  type UpdateFinalSeoBriefResult,
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
  async generateLongreadDraft(
    @Param('id') id: string,
  ): Promise<GenerateLongreadDraftResult> {
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
      throw new ConflictException('SEO brief run must be connected to a project before creating adaptations');
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
    const articleId = (await this.commandBus.execute(
      new CreateArticleCommand(
        run.projectId as ProjectId,
        articleContent,
        run.market.language,
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
        },
      ),
    )) as ArticleId;

    const channels = normalizeAdaptationChannels(dto.channels);
    const adaptations: CreateLongreadAdaptationsResult['adaptations'] = [];
    for (const channel of channels) {
      const promptInstructions = buildSeoBriefAdaptationInstructions(
        seoBriefContext,
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
      const adaptedContent = (await this.commandBus.execute(
        new GenerateAdaptationCommand(articleId, adaptationId),
      )) as string;
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

function findLatestSeoBriefArtifact(
  run: GetSeoBriefRunResult,
  artifactType: string,
): SeoBriefRunArtifactResult | null {
  return [...run.artifacts].reverse().find((artifact) => artifact.artifactType === artifactType) ?? null;
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
            displayName: readNonEmptyString(channel.displayName) ?? defaultChannelDisplayName(channelId),
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
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
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
  displayName: string,
  extraInstructions: string | null,
): string {
  const base = [
    'Generate this adaptation from the supplied longread, but use the SEO brief context below as binding guidance.',
    `Target channel: ${displayName}.`,
    'Preserve the brief angle, target reader, primary keyword intent, product insertion boundaries, CTA, and compliance/risk constraints.',
    'Do not invent new product claims, APY guarantees, or unsupported facts. If a claim needs verification, phrase it cautiously.',
    extraInstructions ? `Extra channel instructions: ${extraInstructions}` : null,
    'SEO brief context:',
    JSON.stringify(context),
  ].filter(Boolean);
  return base.join('\n\n');
}

function createPreview(value: string): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, 240);
}
