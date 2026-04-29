import { Global, Module } from '@nestjs/common';
import { ArticleRepository } from '@marketing-service/editorial';
import { DatabaseModule } from './database.module.js';
import { ArticleDrizzleRepository } from './editorial/article.drizzle-repository.js';

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
    ArticleDrizzleRepository,
    { provide: ArticleRepository, useClass: ArticleDrizzleRepository },
  ],
  exports: [
    ArticleRepository,
  ],
})
export class InfrastructureModule {}
