import { Module } from '@nestjs/common';

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

@Module({
  imports: [
    // DatabaseModule,
  ],
  providers: [
    // TODO: bind port → adapter for each BC
  ],
  exports: [
    // TODO: export all ports so BC modules can inject them
  ],
})
export class InfrastructureModule {}
