import {
  AdaptationGeneratorPort,
  AdaptationVersionRepository,
  ArticleRepository,
  ArticleSourceVersionRepository,
  ChannelAdaptationRepository,
  DiscordPublisherPort,
  TelegramPublisherPort,
  TranslationGeneratorPort,
  TranslationRepository,
  TranslationVersionRepository,
  XPublisherPort,
} from '@marketing-service/editorial';
import {
  AiGatewayPort,
  ApprovalItemRepository,
  CampaignArtifactRepository,
  CampaignDeletionPort,
  CampaignFlowTransactionPort,
  CampaignPresetRepository,
  CampaignProductionJobPort,
  CampaignPublishingPort,
  CampaignRepository,
  PlannedPublicationRepository,
  ProjectDeletionPort,
  ProjectMarkerPlacementRepository,
  ProjectMarkerRepository,
  ProjectRepository,
  QualityCheckResultRepository,
  WorkflowRunRepository,
} from '@marketing-service/project-management';
import {
  BlogPublisherPort,
  PublicationOutcomePort,
  PublicationPlanRepository,
  PublicationRepository,
} from '@marketing-service/publishing';
import {
  BrandMemoryReaderPort,
  SeoBriefAiPort,
  SeoBriefArtifactRepository,
  SeoBriefDocumentRepository,
  SeoBriefExternalCallLogRepository,
  SeoBriefLlmLogRepository,
  SeoBriefRunJobPort,
  SeoBriefRunRepository,
  SeoBriefRunStepRepository,
  SeoBriefScoreLogRepository,
  SeoResearchPort,
} from '@marketing-service/seo-briefing';
import { Global, Module } from '@nestjs/common';
import { DeepSeekAiGateway } from './ai/deepseek-ai-gateway.js';
import { DatabaseModule } from './database.module.js';
import { AdaptationVersionDrizzleRepository } from './editorial/adaptation-version.drizzle-repository.js';
import { ArticleDrizzleRepository } from './editorial/article.drizzle-repository.js';
import { ArticleSourceVersionDrizzleRepository } from './editorial/article-source-version.drizzle-repository.js';
import { ChannelAdaptationDrizzleRepository } from './editorial/channel-adaptation.drizzle-repository.js';
import { DeepSeekAdaptationGenerator } from './editorial/deepseek-adaptation-generator.js';
import { TranslationDrizzleRepository } from './editorial/translation.drizzle-repository.js';
import { TranslationVersionDrizzleRepository } from './editorial/translation-version.drizzle-repository.js';
import { ApprovalItemDrizzleRepository } from './project-management/approval-item.drizzle-repository.js';
import { CampaignDrizzleRepository } from './project-management/campaign.drizzle-repository.js';
import { CampaignArtifactDrizzleRepository } from './project-management/campaign-artifact.drizzle-repository.js';
import { CampaignDeletionDrizzlePort } from './project-management/campaign-deletion.drizzle-port.js';
import { CampaignFlowDrizzleTransaction } from './project-management/campaign-flow-drizzle-transaction.js';
import { CampaignPresetDrizzleRepository } from './project-management/campaign-preset.drizzle-repository.js';
import { CampaignProductionJobBullMqPort } from './project-management/campaign-production-job.bullmq-port.js';
import { CampaignPublishingDrizzlePort } from './project-management/campaign-publishing.drizzle-port.js';
import { PlannedPublicationDrizzleRepository } from './project-management/planned-publication.drizzle-repository.js';
import { ProjectDrizzleRepository } from './project-management/project.drizzle-repository.js';
import { ProjectDeletionDrizzlePort } from './project-management/project-deletion.drizzle-port.js';
import { ProjectMarkerDrizzleRepository } from './project-management/project-marker.drizzle-repository.js';
import { ProjectMarkerPlacementDrizzleRepository } from './project-management/project-marker-placement.drizzle-repository.js';
import { QualityCheckResultDrizzleRepository } from './project-management/quality-check-result.drizzle-repository.js';
import { WorkflowRunDrizzleRepository } from './project-management/workflow-run.drizzle-repository.js';
import { BlogAdminPublisher } from './publishing/blog-admin.publisher.js';
import { DiscordWebhookPublisher } from './publishing/discord-webhook.publisher.js';
import { PublicationDrizzleRepository } from './publishing/publication.drizzle-repository.js';
import { PublicationOutcomeDrizzlePort } from './publishing/publication-outcome.drizzle-port.js';
import { PublicationPlanDrizzleRepository } from './publishing/publication-plan.drizzle-repository.js';
import { TelegramBotApiPublisher } from './publishing/telegram-bot-api.publisher.js';
import { XApiPublisher } from './publishing/x-api.publisher.js';
import { XIntegrationService } from './publishing/x-integration.service.js';
import { DataForSeoAdapter } from './seo-briefing/dataforseo.adapter.js';
import { DataForSeoHttpClientPort } from './seo-briefing/dataforseo-http-client.port.js';
import { DataForSeoMemoryCacheService } from './seo-briefing/dataforseo-memory-cache.service.js';
import { DeepSeekSeoBriefAiAdapter } from './seo-briefing/deepseek-seo-brief-ai.adapter.js';
import { FetchDataForSeoHttpClient } from './seo-briefing/fetch-dataforseo-http.client.js';
import { FetchSeoBriefAiHttpClient } from './seo-briefing/fetch-seo-brief-ai-http.client.js';
import { ProjectBrandMemoryReader } from './seo-briefing/project-brand-memory.reader.js';
import { SeoBriefAiHttpClientPort } from './seo-briefing/seo-brief-ai-http-client.port.js';
import { SeoBriefArtifactDrizzleRepository } from './seo-briefing/seo-brief-artifact.drizzle-repository.js';
import { SeoBriefDocumentDrizzleRepository } from './seo-briefing/seo-brief-document.drizzle-repository.js';
import { SeoBriefExternalCallLogDrizzleRepository } from './seo-briefing/seo-brief-external-call-log.drizzle-repository.js';
import { SeoBriefLlmLogDrizzleRepository } from './seo-briefing/seo-brief-llm-log.drizzle-repository.js';
import { SeoBriefRunBullMqPort } from './seo-briefing/seo-brief-run.bullmq-port.js';
import { SeoBriefRunDrizzleRepository } from './seo-briefing/seo-brief-run.drizzle-repository.js';
import { SeoBriefRunStepDrizzleRepository } from './seo-briefing/seo-brief-run-step.drizzle-repository.js';
import { SeoBriefScoreLogDrizzleRepository } from './seo-briefing/seo-brief-score-log.drizzle-repository.js';

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
  imports: [DatabaseModule],
  providers: [
    DeepSeekAiGateway,
    DeepSeekAdaptationGenerator,
    DeepSeekSeoBriefAiAdapter,
    DataForSeoAdapter,
    DataForSeoMemoryCacheService,
    DiscordWebhookPublisher,
    BlogAdminPublisher,
    FetchSeoBriefAiHttpClient,
    FetchDataForSeoHttpClient,
    TelegramBotApiPublisher,
    XApiPublisher,
    XIntegrationService,
    CampaignProductionJobBullMqPort,
    CampaignFlowDrizzleTransaction,
    CampaignPublishingDrizzlePort,
    CampaignDeletionDrizzlePort,
    PublicationDrizzleRepository,
    PublicationPlanDrizzleRepository,
    PublicationOutcomeDrizzlePort,
    ProjectDeletionDrizzlePort,
    ProjectMarkerPlacementDrizzleRepository,
    ProjectMarkerDrizzleRepository,
    ProjectDrizzleRepository,
    ApprovalItemDrizzleRepository,
    AdaptationVersionDrizzleRepository,
    ArticleDrizzleRepository,
    ArticleSourceVersionDrizzleRepository,
    CampaignArtifactDrizzleRepository,
    CampaignDrizzleRepository,
    CampaignPresetDrizzleRepository,
    ChannelAdaptationDrizzleRepository,
    PlannedPublicationDrizzleRepository,
    ProjectBrandMemoryReader,
    QualityCheckResultDrizzleRepository,
    SeoBriefArtifactDrizzleRepository,
    SeoBriefDocumentDrizzleRepository,
    SeoBriefExternalCallLogDrizzleRepository,
    SeoBriefLlmLogDrizzleRepository,
    SeoBriefRunBullMqPort,
    SeoBriefRunDrizzleRepository,
    SeoBriefScoreLogDrizzleRepository,
    SeoBriefRunStepDrizzleRepository,
    TranslationDrizzleRepository,
    TranslationVersionDrizzleRepository,
    WorkflowRunDrizzleRepository,
    { provide: AiGatewayPort, useExisting: DeepSeekAiGateway },
    { provide: CampaignFlowTransactionPort, useExisting: CampaignFlowDrizzleTransaction },
    { provide: CampaignProductionJobPort, useExisting: CampaignProductionJobBullMqPort },
    { provide: CampaignDeletionPort, useExisting: CampaignDeletionDrizzlePort },
    { provide: ProjectDeletionPort, useExisting: ProjectDeletionDrizzlePort },
    { provide: CampaignPublishingPort, useExisting: CampaignPublishingDrizzlePort },
    { provide: AdaptationGeneratorPort, useClass: DeepSeekAdaptationGenerator },
    { provide: TranslationGeneratorPort, useExisting: DeepSeekAdaptationGenerator },
    { provide: DiscordPublisherPort, useClass: DiscordWebhookPublisher },
    { provide: BlogPublisherPort, useClass: BlogAdminPublisher },
    { provide: TelegramPublisherPort, useClass: TelegramBotApiPublisher },
    { provide: XPublisherPort, useClass: XApiPublisher },
    { provide: PublicationRepository, useClass: PublicationDrizzleRepository },
    { provide: PublicationPlanRepository, useClass: PublicationPlanDrizzleRepository },
    { provide: PublicationOutcomePort, useClass: PublicationOutcomeDrizzlePort },
    {
      provide: ProjectMarkerPlacementRepository,
      useClass: ProjectMarkerPlacementDrizzleRepository,
    },
    { provide: ApprovalItemRepository, useClass: ApprovalItemDrizzleRepository },
    { provide: ProjectMarkerRepository, useClass: ProjectMarkerDrizzleRepository },
    { provide: ProjectRepository, useClass: ProjectDrizzleRepository },
    { provide: AdaptationVersionRepository, useClass: AdaptationVersionDrizzleRepository },
    { provide: ArticleRepository, useClass: ArticleDrizzleRepository },
    { provide: ArticleSourceVersionRepository, useClass: ArticleSourceVersionDrizzleRepository },
    { provide: CampaignArtifactRepository, useClass: CampaignArtifactDrizzleRepository },
    { provide: CampaignPresetRepository, useClass: CampaignPresetDrizzleRepository },
    { provide: CampaignRepository, useClass: CampaignDrizzleRepository },
    { provide: ChannelAdaptationRepository, useClass: ChannelAdaptationDrizzleRepository },
    { provide: PlannedPublicationRepository, useClass: PlannedPublicationDrizzleRepository },
    { provide: BrandMemoryReaderPort, useClass: ProjectBrandMemoryReader },
    { provide: SeoBriefAiHttpClientPort, useClass: FetchSeoBriefAiHttpClient },
    { provide: DataForSeoHttpClientPort, useClass: FetchDataForSeoHttpClient },
    { provide: QualityCheckResultRepository, useClass: QualityCheckResultDrizzleRepository },
    { provide: SeoBriefArtifactRepository, useClass: SeoBriefArtifactDrizzleRepository },
    { provide: SeoBriefDocumentRepository, useClass: SeoBriefDocumentDrizzleRepository },
    {
      provide: SeoBriefExternalCallLogRepository,
      useClass: SeoBriefExternalCallLogDrizzleRepository,
    },
    { provide: SeoBriefLlmLogRepository, useClass: SeoBriefLlmLogDrizzleRepository },
    { provide: SeoBriefAiPort, useClass: DeepSeekSeoBriefAiAdapter },
    { provide: SeoResearchPort, useClass: DataForSeoAdapter },
    { provide: SeoBriefRunJobPort, useClass: SeoBriefRunBullMqPort },
    { provide: SeoBriefRunRepository, useClass: SeoBriefRunDrizzleRepository },
    { provide: SeoBriefScoreLogRepository, useClass: SeoBriefScoreLogDrizzleRepository },
    { provide: SeoBriefRunStepRepository, useClass: SeoBriefRunStepDrizzleRepository },
    { provide: TranslationRepository, useClass: TranslationDrizzleRepository },
    { provide: TranslationVersionRepository, useClass: TranslationVersionDrizzleRepository },
    { provide: WorkflowRunRepository, useClass: WorkflowRunDrizzleRepository },
  ],
  exports: [
    AdaptationVersionRepository,
    AdaptationGeneratorPort,
    ApprovalItemRepository,
    AiGatewayPort,
    BrandMemoryReaderPort,
    CampaignPublishingPort,
    CampaignFlowTransactionPort,
    CampaignProductionJobPort,
    CampaignDeletionPort,
    ProjectDeletionPort,
    ArticleRepository,
    ArticleSourceVersionRepository,
    CampaignArtifactRepository,
    CampaignPresetRepository,
    CampaignRepository,
    ChannelAdaptationRepository,
    DiscordPublisherPort,
    BlogPublisherPort,
    PlannedPublicationRepository,
    TranslationGeneratorPort,
    TelegramPublisherPort,
    XPublisherPort,
    XIntegrationService,
    PublicationPlanRepository,
    PublicationOutcomePort,
    PublicationRepository,
    ProjectMarkerPlacementRepository,
    ProjectMarkerRepository,
    ProjectRepository,
    QualityCheckResultRepository,
    SeoBriefArtifactRepository,
    SeoBriefAiPort,
    SeoBriefDocumentRepository,
    SeoBriefExternalCallLogRepository,
    SeoBriefLlmLogRepository,
    SeoResearchPort,
    SeoBriefRunJobPort,
    SeoBriefRunRepository,
    SeoBriefScoreLogRepository,
    SeoBriefRunStepRepository,
    TranslationRepository,
    TranslationVersionRepository,
    WorkflowRunRepository,
  ],
})
export class InfrastructureModule {}
