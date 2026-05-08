import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PublicationSchedulerService } from './services/telegram-publication-scheduler.service.js';
import { CancelPlannedPublicationHandler } from './use-cases/cancel-planned-publication/cancel-planned-publication.handler.js';
import { CancelPublicationHandler } from './use-cases/cancel-publication/cancel-publication.handler.js';
import { CancelPublicationPlanHandler } from './use-cases/cancel-publication-plan/cancel-publication-plan.handler.js';
import { CreatePublicationPlanHandler } from './use-cases/create-publication-plan/create-publication-plan.handler.js';
import { GetArticlePublicationPlansHandler } from './use-cases/get-article-publication-plans/get-article-publication-plans.handler.js';
import { GetArticlePublicationsHandler } from './use-cases/get-article-publications/get-article-publications.handler.js';
import { GetProjectPublicationPlansHandler } from './use-cases/get-project-publication-plans/get-project-publication-plans.handler.js';
import { ReschedulePublicationPlanHandler } from './use-cases/reschedule-publication-plan/reschedule-publication-plan.handler.js';
import { ScheduleDiscordPublicationHandler } from './use-cases/schedule-discord-publication/schedule-discord-publication.handler.js';
import { ScheduleTelegramPublicationHandler } from './use-cases/schedule-telegram-publication/schedule-telegram-publication.handler.js';
import { ScheduleXPublicationHandler } from './use-cases/schedule-x-publication/schedule-x-publication.handler.js';

@Module({
  imports: [CqrsModule],
  providers: [
    CancelPublicationPlanHandler,
    CancelPublicationHandler,
    CancelPlannedPublicationHandler,
    CreatePublicationPlanHandler,
    GetArticlePublicationPlansHandler,
    GetArticlePublicationsHandler,
    GetProjectPublicationPlansHandler,
    ScheduleDiscordPublicationHandler,
    ScheduleTelegramPublicationHandler,
    ScheduleXPublicationHandler,
    ReschedulePublicationPlanHandler,
    PublicationSchedulerService,
  ],
  exports: [],
})
export class PublishingModule {}
