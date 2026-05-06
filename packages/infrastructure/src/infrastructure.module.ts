import { Global, Module } from '@nestjs/common';
import {
  AdaptationVersionRepository,
  AdaptationGeneratorPort,
  ArticleRepository,
  ChannelAdaptationRepository,
  DiscordPublisherPort,
  TelegramPublisherPort,
  TranslationGeneratorPort,
  TranslationRepository,
} from '@marketing-service/editorial';
import { ProjectRepository } from '@marketing-service/project-management';
import { DatabaseModule } from './database.module.js';
import { AdaptationVersionDrizzleRepository } from './editorial/adaptation-version.drizzle-repository.js';
import { ArticleDrizzleRepository } from './editorial/article.drizzle-repository.js';
import { ChannelAdaptationDrizzleRepository } from './editorial/channel-adaptation.drizzle-repository.js';
import { DeepSeekAdaptationGenerator } from './editorial/deepseek-adaptation-generator.js';
import { TranslationDrizzleRepository } from './editorial/translation.drizzle-repository.js';
import { DiscordWebhookPublisher } from './publishing/discord-webhook.publisher.js';
import { TelegramBotApiPublisher } from './publishing/telegram-bot-api.publisher.js';
import { PublicationDrizzleRepository } from './publishing/publication.drizzle-repository.js';
import { ProjectDrizzleRepository } from './project-management/project.drizzle-repository.js';
import { PublicationRepository } from '@marketing-service/publishing';

// TODO: import DatabaseModule
// TODO: import and bind adapters to ports:
//
// Project Management:
//   { provide: ProjectRepository, useClass: ProjectDrizzleRepository }
//   { provide: ChannelRepository, useClass: ChannelDrizzleRepository }
//
// Editorial:
//   { provide: ArticleRepository, useClass: ArticleDrizzleRepository }
//   { provide: TranslationRepository, useClass: TranslationDrizzleRepository }
//   { provide: LlmPort, useClass: LlmOpenAiAdapter }
//
// Publishing:
//   { provide: PublicationRepository, useClass: PublicationDrizzleRepository }
//   { provide: PublishingTargetRepository, useClass: PublishingTargetDrizzleRepository }
//   { provide: ChannelAdapterPort, useClass: ... }

@Global()
@Module({
  imports: [
    DatabaseModule,
  ],
  providers: [
    DeepSeekAdaptationGenerator,
    DiscordWebhookPublisher,
    TelegramBotApiPublisher,
    PublicationDrizzleRepository,
    ProjectDrizzleRepository,
    AdaptationVersionDrizzleRepository,
    ArticleDrizzleRepository,
    ChannelAdaptationDrizzleRepository,
    TranslationDrizzleRepository,
    { provide: AdaptationGeneratorPort, useClass: DeepSeekAdaptationGenerator },
    { provide: TranslationGeneratorPort, useExisting: DeepSeekAdaptationGenerator },
    { provide: DiscordPublisherPort, useClass: DiscordWebhookPublisher },
    { provide: TelegramPublisherPort, useClass: TelegramBotApiPublisher },
    { provide: PublicationRepository, useClass: PublicationDrizzleRepository },
    { provide: ProjectRepository, useClass: ProjectDrizzleRepository },
    { provide: AdaptationVersionRepository, useClass: AdaptationVersionDrizzleRepository },
    { provide: ArticleRepository, useClass: ArticleDrizzleRepository },
    { provide: ChannelAdaptationRepository, useClass: ChannelAdaptationDrizzleRepository },
    { provide: TranslationRepository, useClass: TranslationDrizzleRepository },
  ],
  exports: [
    AdaptationVersionRepository,
    AdaptationGeneratorPort,
    ArticleRepository,
    ChannelAdaptationRepository,
    DiscordPublisherPort,
    TranslationGeneratorPort,
    TelegramPublisherPort,
    PublicationRepository,
    ProjectRepository,
    TranslationRepository,
  ],
})
export class InfrastructureModule {}
