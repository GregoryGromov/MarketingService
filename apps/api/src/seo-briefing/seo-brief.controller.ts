import {
  ContinueSeoBriefRunCommand,
  CreateSeoBriefRunCommand,
  type CreateSeoBriefRunResult,
  FetchFirstKeywordSerpPreviewCommand,
  type FetchFirstKeywordSerpPreviewResult,
  FetchKeywordSerpPreviewsCommand,
  type FetchKeywordSerpPreviewsResult,
  GetSeoBriefRunQuery,
  type GetSeoBriefRunResult,
  ListSeoBriefRunsQuery,
  type ListSeoBriefRunsResultItem,
  MarkSeoBriefRunManualReviewCommand,
  RegenerateSeoBriefCommand,
  RejectSeoBriefRunCommand,
  RerunSeoBriefRunCommand,
  RerunSeoBriefStageCommand,
  SelectFirstKeywordRelatedQueriesCommand,
  type SelectFirstKeywordRelatedQueriesResult,
  SelectKeywordRelatedQueriesCommand,
  type SelectKeywordRelatedQueriesResult,
  SeoBriefKeywordHypothesesNotFoundError,
  SeoBriefProjectNotFoundError,
  SeoBriefRunAttemptLimitError,
  SeoBriefRunBusyError,
  type SeoBriefRunId,
  SeoBriefRunNoNextStageError,
  SeoBriefRunNotFoundError,
  SeoBriefSerpDerivedKeywordsNotFoundError,
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
  ) {}

  @Get('health')
  getHealth(): { module: 'seo-briefing'; status: 'ok' } {
    return {
      module: 'seo-briefing',
      status: 'ok',
    };
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
