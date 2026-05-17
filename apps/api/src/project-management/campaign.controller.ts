import {
  ApproveCampaignForPublishingCommand,
  AttachCampaignSourceCommand,
  GetCampaignApprovalInboxQuery,
  GetCampaignDetailQuery,
  GetCampaignExecutionHistoryQuery,
  GetCampaignPublishingOverviewQuery,
  type CampaignId,
  type GetCampaignApprovalInboxResult,
  type GetCampaignDetailResult,
  type GetCampaignExecutionHistoryResult,
  type GetCampaignPublishingOverviewResult,
  ReviewSourceIssueCommand,
  RunCampaignStage1Command,
  RunCampaignStage2Command,
  StartCampaignProductionCommand,
} from '@marketing-service/project-management';
import {
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import * as v from 'valibot';
import { rethrowProjectManagementHttpError } from './project-management-http-error';
import { ValibotPipe } from '../infrastructure/common/valibot-validation.pipe';

const AttachCampaignSourceSchema = v.object({
  content: v.pipe(v.string(), v.trim(), v.minLength(1)),
  language: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(16)),
});

const ReviewSourceIssueSchema = v.object({
  approvalItemId: v.pipe(v.string(), v.trim(), v.minLength(1)),
  action: v.picklist(['accept_fix', 'manual_edit', 'ignore', 'block']),
  content: v.optional(v.nullish(v.pipe(v.string(), v.trim(), v.minLength(1)))),
  language: v.optional(v.nullish(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(16)))),
  note: v.optional(v.nullish(v.pipe(v.string(), v.trim(), v.maxLength(2000)))),
});

type AttachCampaignSourceDto = v.InferOutput<typeof AttachCampaignSourceSchema>;
type ReviewSourceIssueDto = v.InferOutput<typeof ReviewSourceIssueSchema>;

@Controller('campaigns')
export class CampaignController {
  constructor(
    @Inject(CommandBus)
    private readonly commandBus: CommandBus,
    @Inject(QueryBus)
    private readonly queryBus: QueryBus,
  ) {}

  @Get(':id')
  async getById(@Param('id') id: string): Promise<GetCampaignDetailResult> {
    const campaign = await this.queryBus.execute(new GetCampaignDetailQuery(id as CampaignId));
    if (!campaign) {
      throw new NotFoundException(`Campaign ${id} not found`);
    }

    return campaign;
  }

  @Post(':id/source')
  async attachSource(
    @Param('id') id: string,
    @Body(new ValibotPipe(AttachCampaignSourceSchema)) dto: AttachCampaignSourceDto,
  ) {
    try {
      const source = await this.commandBus.execute(
        new AttachCampaignSourceCommand(id as CampaignId, dto.content, dto.language),
      );
      const production = await this.commandBus.execute(
        new StartCampaignProductionCommand(id as CampaignId),
      );

      return { ...source, production };
    } catch (error) {
      rethrowProjectManagementHttpError(error);
    }
  }

  @Post(':id/start-production')
  async startProduction(@Param('id') id: string) {
    try {
      return await this.commandBus.execute(new StartCampaignProductionCommand(id as CampaignId));
    } catch (error) {
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
  async getExecutionHistory(
    @Param('id') id: string,
  ): Promise<GetCampaignExecutionHistoryResult> {
    const executionHistory = await this.queryBus.execute(
      new GetCampaignExecutionHistoryQuery(id as CampaignId),
    );
    if (!executionHistory) {
      throw new NotFoundException(`Campaign ${id} not found`);
    }

    return executionHistory;
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
