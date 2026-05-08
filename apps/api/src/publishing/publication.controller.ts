import {
  type AdaptationId,
  type ArticleId,
  type ChannelId,
  type ProjectId,
  PublishTelegramMessageCommand,
} from '@marketing-service/editorial';
import {
  CancelPlannedPublicationCommand,
  CancelPublicationCommand,
  CancelPublicationPlanCommand,
  CreatePublicationPlanCommand,
  GetArticlePublicationPlansQuery,
  type GetArticlePublicationPlansResultItem,
  GetArticlePublicationsQuery,
  type GetArticlePublicationsResultItem,
  GetProjectPublicationPlansQuery,
  type GetProjectPublicationPlansResultItem,
  type PublicationId,
  type PublicationPlanId,
  ReschedulePublicationPlanCommand,
  ScheduleDiscordPublicationCommand,
  ScheduleTelegramPublicationCommand,
  ScheduleXPublicationCommand,
} from '@marketing-service/publishing';
import { Body, Controller, Get, Inject, Param, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

@Controller('publishing')
export class PublicationController {
  constructor(
    @Inject(CommandBus)
    private readonly commandBus: CommandBus,
    @Inject(QueryBus)
    private readonly queryBus: QueryBus,
  ) {}

  @Post('telegram')
  async publishTelegram(
    @Body()
    body: { articleId: string; adaptationId: string; targetLanguage?: string | null },
  ): Promise<{ chatId: string; messageId: number }> {
    return this.commandBus.execute(
      new PublishTelegramMessageCommand(
        body.articleId as ArticleId,
        body.adaptationId as AdaptationId,
        body.targetLanguage?.trim() || null,
      ),
    );
  }

  @Post('telegram/schedule')
  async scheduleTelegram(
    @Body()
    body: { articleId: string; adaptationId: string; targetLanguage: string; publishAt: string },
  ): Promise<{ id: string; status: string }> {
    return this.commandBus.execute(
      new ScheduleTelegramPublicationCommand(
        body.articleId as ArticleId,
        body.adaptationId as AdaptationId,
        body.targetLanguage,
        new Date(body.publishAt),
      ),
    );
  }

  @Post('discord/schedule')
  async scheduleDiscord(
    @Body()
    body: { articleId: string; adaptationId: string; targetLanguage: string; publishAt: string },
  ): Promise<{ id: string; status: string }> {
    return this.commandBus.execute(
      new ScheduleDiscordPublicationCommand(
        body.articleId as ArticleId,
        body.adaptationId as AdaptationId,
        body.targetLanguage,
        new Date(body.publishAt),
      ),
    );
  }

  @Post('x/schedule')
  async scheduleX(
    @Body()
    body: { articleId: string; adaptationId: string; targetLanguage: string; publishAt: string },
  ): Promise<{ id: string; status: string }> {
    return this.commandBus.execute(
      new ScheduleXPublicationCommand(
        body.articleId as ArticleId,
        body.adaptationId as AdaptationId,
        body.targetLanguage,
        new Date(body.publishAt),
      ),
    );
  }

  @Post(':publicationId/cancel')
  async cancelPublication(
    @Param('publicationId') publicationId: string,
  ): Promise<{ id: string; status: 'cancelled' }> {
    return this.commandBus.execute(new CancelPublicationCommand(publicationId as PublicationId));
  }

  @Post('cancel-planned')
  async cancelPlannedPublication(
    @Body()
    body: { articleId: string; channelId: string; targetLanguage: string },
  ): Promise<{ status: 'cancelled' }> {
    return this.commandBus.execute(
      new CancelPlannedPublicationCommand(
        body.articleId as ArticleId,
        body.channelId as ChannelId,
        body.targetLanguage,
      ),
    );
  }

  @Post('plans')
  async createPlan(
    @Body()
    body: { articleId: string; channelId: string; targetLanguage: string; publishAt: string },
  ): Promise<{ id: string }> {
    return this.commandBus.execute(
      new CreatePublicationPlanCommand(
        body.articleId as ArticleId,
        body.channelId as ChannelId,
        body.targetLanguage,
        new Date(body.publishAt),
      ),
    );
  }

  @Post('plans/:planId/cancel')
  async cancelPlan(@Param('planId') planId: string): Promise<{ id: string; status: 'cancelled' }> {
    return this.commandBus.execute(new CancelPublicationPlanCommand(planId as PublicationPlanId));
  }

  @Post('plans/:planId/reschedule')
  async reschedulePlan(
    @Param('planId') planId: string,
    @Body()
    body: {
      publishAt: string;
    },
  ): Promise<{ id: string; publishAt: Date }> {
    return this.commandBus.execute(
      new ReschedulePublicationPlanCommand(planId as PublicationPlanId, new Date(body.publishAt)),
    );
  }

  @Get('articles/:articleId/plans')
  async getArticlePublicationPlans(
    @Param('articleId') articleId: string,
  ): Promise<GetArticlePublicationPlansResultItem[]> {
    return this.queryBus.execute(new GetArticlePublicationPlansQuery(articleId as ArticleId));
  }

  @Get('projects/:projectId/plans')
  async getProjectPublicationPlans(
    @Param('projectId') projectId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<GetProjectPublicationPlansResultItem[]> {
    return this.queryBus.execute(
      new GetProjectPublicationPlansQuery(
        projectId as ProjectId,
        from ? new Date(from) : null,
        to ? new Date(to) : null,
      ),
    );
  }

  @Get('articles/:articleId')
  async getArticlePublications(
    @Param('articleId') articleId: string,
  ): Promise<GetArticlePublicationsResultItem[]> {
    return this.queryBus.execute(new GetArticlePublicationsQuery(articleId as ArticleId));
  }
}
