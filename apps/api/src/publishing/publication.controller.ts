import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  type AdaptationId,
  type ArticleId,
  type ChannelId,
  PublishTelegramMessageCommand,
} from '@marketing-service/editorial';
import {
  CancelPublicationCommand,
  CancelPlannedPublicationCommand,
  GetArticlePublicationsQuery,
  ScheduleDiscordPublicationCommand,
  ScheduleTelegramPublicationCommand,
  type PublicationId,
  type GetArticlePublicationsResultItem,
} from '@marketing-service/publishing';

@Controller('publishing')
export class PublicationController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('telegram')
  async publishTelegram(
    @Body()
    body: {
      articleId: string;
      adaptationId: string;
      targetLanguage?: string | null;
    },
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
    body: {
      articleId: string;
      adaptationId: string;
      targetLanguage: string;
      publishAt: string;
    },
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
    body: {
      articleId: string;
      adaptationId: string;
      targetLanguage: string;
      publishAt: string;
    },
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

  @Post(':publicationId/cancel')
  async cancelPublication(
    @Param('publicationId') publicationId: string,
  ): Promise<{ id: string; status: 'cancelled' }> {
    return this.commandBus.execute(
      new CancelPublicationCommand(publicationId as PublicationId),
    );
  }

  @Post('cancel-planned')
  async cancelPlannedPublication(
    @Body()
    body: {
      articleId: string;
      channelId: string;
      targetLanguage: string;
    },
  ): Promise<{ status: 'cancelled' }> {
    return this.commandBus.execute(
      new CancelPlannedPublicationCommand(
        body.articleId as ArticleId,
        body.channelId as ChannelId,
        body.targetLanguage,
      ),
    );
  }

  @Get('articles/:articleId')
  async getArticlePublications(
    @Param('articleId') articleId: string,
  ): Promise<GetArticlePublicationsResultItem[]> {
    return this.queryBus.execute(
      new GetArticlePublicationsQuery(articleId as ArticleId),
    );
  }
}
