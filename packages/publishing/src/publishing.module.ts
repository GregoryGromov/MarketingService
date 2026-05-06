import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CancelPublicationHandler } from './use-cases/cancel-publication/cancel-publication.handler.js';
import { CancelPlannedPublicationHandler } from './use-cases/cancel-planned-publication/cancel-planned-publication.handler.js';
import { PublicationSchedulerService } from './services/telegram-publication-scheduler.service.js';
import { GetArticlePublicationsHandler } from './use-cases/get-article-publications/get-article-publications.handler.js';
import { ScheduleDiscordPublicationHandler } from './use-cases/schedule-discord-publication/schedule-discord-publication.handler.js';
import { ScheduleTelegramPublicationHandler } from './use-cases/schedule-telegram-publication/schedule-telegram-publication.handler.js';

@Module({
  imports: [CqrsModule],
  providers: [
    CancelPublicationHandler,
    CancelPlannedPublicationHandler,
    GetArticlePublicationsHandler,
    ScheduleDiscordPublicationHandler,
    ScheduleTelegramPublicationHandler,
    PublicationSchedulerService,
  ],
  exports: [],
})
export class PublishingModule {}
