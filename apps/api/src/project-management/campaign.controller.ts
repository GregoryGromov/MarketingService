import {
  ApproveCampaignForPublishingCommand,
  AttachCampaignSourceCommand,
  type CampaignId,
  DeleteCampaignCommand,
  GetCampaignApprovalInboxQuery,
  type GetCampaignApprovalInboxResult,
  GetCampaignDetailQuery,
  type GetCampaignDetailResult,
  GetCampaignExecutionHistoryQuery,
  type GetCampaignExecutionHistoryResult,
  GetCampaignPublishingOverviewQuery,
  type GetCampaignPublishingOverviewResult,
  GetProjectQuery,
  type ProjectId,
  RescheduleCampaignPlannedPublicationCommand,
  ReviewGeneratedArtifactIssueCommand,
  ReviewSourceIssueCommand,
  RunCampaignStage1Command,
  RunCampaignStage2Command,
  StartCampaignProductionCommand,
} from '@marketing-service/project-management';
import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Logger,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import * as v from 'valibot';
import { ValibotPipe } from '../infrastructure/common/valibot-validation.pipe';
import { CampaignSourceMediaService } from './campaign-source-media.service';
import { rethrowProjectManagementHttpError } from './project-management-http-error';

const AttachCampaignSourceSchema = v.object({
  content: v.pipe(v.string(), v.trim(), v.minLength(1)),
  language: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(16)),
  coverImageUrl: v.optional(v.nullish(v.pipe(v.string(), v.trim(), v.maxLength(2048)))),
  sourceImageDataUrl: v.optional(v.nullish(v.pipe(v.string(), v.trim(), v.minLength(1)))),
});

const ReviewSourceIssueSchema = v.object({
  approvalItemId: v.pipe(v.string(), v.trim(), v.minLength(1)),
  action: v.picklist(['accept_fix', 'manual_edit', 'ignore', 'block']),
  content: v.optional(v.nullish(v.pipe(v.string(), v.trim(), v.minLength(1)))),
  language: v.optional(v.nullish(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(16)))),
  note: v.optional(v.nullish(v.pipe(v.string(), v.trim(), v.maxLength(2000)))),
});

const ReviewGeneratedArtifactIssueSchema = v.object({
  approvalItemId: v.pipe(v.string(), v.trim(), v.minLength(1)),
  action: v.picklist(['fix_ai', 'manual_edit', 'ignore']),
  content: v.optional(v.nullish(v.pipe(v.string(), v.trim(), v.minLength(1)))),
  note: v.optional(v.nullish(v.pipe(v.string(), v.trim(), v.maxLength(2000)))),
});

const RescheduleCampaignPlannedPublicationSchema = v.object({
  publishAt: v.pipe(v.string(), v.trim(), v.isoTimestamp()),
});

type AttachCampaignSourceDto = v.InferOutput<typeof AttachCampaignSourceSchema>;
type ReviewSourceIssueDto = v.InferOutput<typeof ReviewSourceIssueSchema>;
type ReviewGeneratedArtifactIssueDto = v.InferOutput<typeof ReviewGeneratedArtifactIssueSchema>;
type RescheduleCampaignPlannedPublicationDto = v.InferOutput<
  typeof RescheduleCampaignPlannedPublicationSchema
>;

function serializeErrorForLog(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  return {
    message: String(error),
  };
}

@Controller('campaigns')
export class CampaignController {
  private readonly logger = new Logger(CampaignController.name);

  constructor(
    @Inject(CommandBus)
    private readonly commandBus: CommandBus,
    @Inject(QueryBus)
    private readonly queryBus: QueryBus,
    @Inject(CampaignSourceMediaService)
    private readonly sourceMediaService: CampaignSourceMediaService,
  ) {}

  @Get(':id')
  async getById(@Param('id') id: string): Promise<GetCampaignDetailResult> {
    const campaign = await this.queryBus.execute(new GetCampaignDetailQuery(id as CampaignId));
    if (!campaign) {
      throw new NotFoundException(`Campaign ${id} not found`);
    }

    return campaign;
  }

  @Delete(':id')
  async deleteCampaign(@Param('id') id: string): Promise<{ ok: true }> {
    try {
      await this.commandBus.execute(new DeleteCampaignCommand(id as CampaignId));
      return { ok: true };
    } catch (error) {
      rethrowProjectManagementHttpError(error);
    }
  }

  @Post(':id/source')
  async attachSource(
    @Param('id') id: string,
    @Body(new ValibotPipe(AttachCampaignSourceSchema)) dto: AttachCampaignSourceDto,
  ) {
    const startedAt = Date.now();
    try {
      this.logger.log({
        message: 'Attach campaign source requested',
        campaignId: id,
        contentLength: dto.content.length,
        language: dto.language,
        hasCoverImageUrl: Boolean(dto.coverImageUrl),
        hasSourceImage: Boolean(dto.sourceImageDataUrl),
        sourceImageDataUrlLength: dto.sourceImageDataUrl?.length ?? 0,
      });

      let defaultCoverUrl: string | null = normalizeHttpsCoverImageUrl(dto.coverImageUrl);

      if (!defaultCoverUrl && dto.sourceImageDataUrl) {
        const campaign = await this.queryBus.execute(new GetCampaignDetailQuery(id as CampaignId));
        if (!campaign) {
          throw new NotFoundException(`Campaign ${id} not found`);
        }

        const project = await this.queryBus.execute(
          new GetProjectQuery(campaign.projectId as ProjectId),
        );

        defaultCoverUrl = await this.sourceMediaService.saveSourceImage({
          campaignId: id,
          dataUrl: dto.sourceImageDataUrl,
          aspectRatios: project?.brandMemory?.adaptationPromptRules?.mediaAspectRatios ?? null,
        });
      }

      const source = await this.commandBus.execute(
        new AttachCampaignSourceCommand(
          id as CampaignId,
          dto.content,
          dto.language,
          defaultCoverUrl,
        ),
      );
      const production = await this.commandBus.execute(
        new StartCampaignProductionCommand(id as CampaignId),
      );

      this.logger.log({
        message: 'Attach campaign source completed',
        campaignId: id,
        durationMs: Date.now() - startedAt,
        sourceArticleId: source.articleId,
        production,
      });

      return { ...source, production };
    } catch (error) {
      this.logger.error({
        message: 'Attach campaign source failed',
        campaignId: id,
        durationMs: Date.now() - startedAt,
        error: serializeErrorForLog(error),
      });
      rethrowProjectManagementHttpError(error);
    }
  }

  @Post(':id/start-production')
  async startProduction(@Param('id') id: string) {
    const startedAt = Date.now();
    try {
      this.logger.log({
        message: 'Start campaign production requested',
        campaignId: id,
      });
      const result = await this.commandBus.execute(
        new StartCampaignProductionCommand(id as CampaignId),
      );
      this.logger.log({
        message: 'Start campaign production completed',
        campaignId: id,
        durationMs: Date.now() - startedAt,
        result,
      });
      return result;
    } catch (error) {
      this.logger.error({
        message: 'Start campaign production failed',
        campaignId: id,
        durationMs: Date.now() - startedAt,
        error: serializeErrorForLog(error),
      });
      rethrowProjectManagementHttpError(error);
    }
  }

  @Post(':id/stage-1/run')
  async runStage1(@Param('id') id: string) {
    try {
      return await this.commandBus.execute(new RunCampaignStage1Command(id as CampaignId));
    } catch (error) {
      rethrowProjectManagementHttpError(error);
    }
  }

  @Post(':id/stage-2/run')
  async runStage2(@Param('id') id: string) {
    try {
      return await this.commandBus.execute(new RunCampaignStage2Command(id as CampaignId));
    } catch (error) {
      rethrowProjectManagementHttpError(error);
    }
  }

  @Get(':id/inbox')
  async getInbox(@Param('id') id: string): Promise<GetCampaignApprovalInboxResult> {
    const inbox = await this.queryBus.execute(new GetCampaignApprovalInboxQuery(id as CampaignId));
    if (!inbox) {
      throw new NotFoundException(`Campaign ${id} not found`);
    }

    return inbox;
  }

  @Get(':id/execution-history')
  async getExecutionHistory(@Param('id') id: string): Promise<GetCampaignExecutionHistoryResult> {
    const executionHistory = await this.queryBus.execute(
      new GetCampaignExecutionHistoryQuery(id as CampaignId),
    );
    if (!executionHistory) {
      throw new NotFoundException(`Campaign ${id} not found`);
    }

    return executionHistory;
  }

  @Post(':id/planned-publications/:plannedPublicationId/reschedule')
  async reschedulePlannedPublication(
    @Param('id') id: string,
    @Param('plannedPublicationId') plannedPublicationId: string,
    @Body(new ValibotPipe(RescheduleCampaignPlannedPublicationSchema))
    dto: RescheduleCampaignPlannedPublicationDto,
  ) {
    try {
      return await this.commandBus.execute(
        new RescheduleCampaignPlannedPublicationCommand(
          id as CampaignId,
          plannedPublicationId as never,
          new Date(dto.publishAt),
        ),
      );
    } catch (error) {
      rethrowProjectManagementHttpError(error);
    }
  }

  @Post(':id/source-issues/review')
  async reviewSourceIssue(
    @Param('id') id: string,
    @Body(new ValibotPipe(ReviewSourceIssueSchema)) dto: ReviewSourceIssueDto,
  ) {
    try {
      const review = await this.commandBus.execute(
        new ReviewSourceIssueCommand(
          id as CampaignId,
          dto.approvalItemId,
          dto.action,
          dto.content ?? undefined,
          dto.language ?? undefined,
          dto.note ?? null,
        ),
      );

      if (review.campaignStatus === 'producing') {
        if (dto.action === 'accept_fix' || dto.action === 'manual_edit') {
          const resumedProduction = await this.commandBus.execute(
            new StartCampaignProductionCommand(id as CampaignId),
          );

          return { ...review, resumedProduction };
        }

        const resumedProduction = await this.commandBus.execute(
          new RunCampaignStage1Command(id as CampaignId),
        );

        return { ...review, resumedProduction };
      }

      return review;
    } catch (error) {
      rethrowProjectManagementHttpError(error);
    }
  }

  @Post(':id/generated-artifact-issues/review')
  async reviewGeneratedArtifactIssue(
    @Param('id') id: string,
    @Body(new ValibotPipe(ReviewGeneratedArtifactIssueSchema)) dto: ReviewGeneratedArtifactIssueDto,
  ) {
    try {
      const review = await this.commandBus.execute(
        new ReviewGeneratedArtifactIssueCommand(
          id as CampaignId,
          dto.approvalItemId,
          dto.action,
          dto.content ?? undefined,
          dto.note ?? null,
        ),
      );

      if (review.resumeStage === 'stage_1') {
        const resumedProduction = await this.commandBus.execute(
          new RunCampaignStage1Command(id as CampaignId),
        );
        return { ...review, resumedProduction };
      }

      if (review.resumeStage === 'stage_2') {
        const resumedProduction = await this.commandBus.execute(
          new RunCampaignStage2Command(id as CampaignId),
        );
        return { ...review, resumedProduction };
      }

      return review;
    } catch (error) {
      rethrowProjectManagementHttpError(error);
    }
  }

  @Post(':id/final-approval')
  async approveForPublishing(@Param('id') id: string) {
    try {
      return await this.commandBus.execute(
        new ApproveCampaignForPublishingCommand(id as CampaignId),
      );
    } catch (error) {
      rethrowProjectManagementHttpError(error);
    }
  }

  @Get(':id/publishing-overview')
  async getPublishingOverview(
    @Param('id') id: string,
  ): Promise<GetCampaignPublishingOverviewResult> {
    const overview = await this.queryBus.execute(
      new GetCampaignPublishingOverviewQuery(id as CampaignId),
    );
    if (!overview) {
      throw new NotFoundException(`Campaign ${id} not found`);
    }

    return overview;
  }
}

function normalizeHttpsCoverImageUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'https:') {
      throw new Error('Expected HTTPS URL');
    }
    return url.toString();
  } catch {
    throw new Error('coverImageUrl must be a valid HTTPS URL');
  }
}
