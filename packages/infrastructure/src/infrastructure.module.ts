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
  XPublisherPort,
} from '@marketing-service/editorial';
import {
  ApprovalItemRepository,
  AiGatewayPort,
  CampaignFlowTransactionPort,
  CampaignArtifactRepository,
  CampaignPresetRepository,
  CampaignRepository,
  PlannedPublicationRepository,
  ProjectMarkerPlacementRepository,
  ProjectMarkerRepository,
  ProjectRepository,
  QualityCheckResultRepository,
  WorkflowRunRepository,
} from '@marketing-service/project-management';
import { PublicationPlanRepository, PublicationRepository } from '@marketing-service/publishing';
import { Global, Module } from '@nestjs/common';
import { DeepSeekAiGateway } from './ai/deepseek-ai-gateway.js';
import { DatabaseModule } from './database.module.js';
import { AdaptationVersionDrizzleRepository } from './editorial/adaptation-version.drizzle-repository.js';
import { ArticleDrizzleRepository } from './editorial/article.drizzle-repository.js';
import { ArticleSourceVersionDrizzleRepository } from './editorial/article-source-version.drizzle-repository.js';
import { ChannelAdaptationDrizzleRepository } from './editorial/channel-adaptation.drizzle-repository.js';
import { DeepSeekAdaptationGenerator } from './editorial/deepseek-adaptation-generator.js';
import { TranslationDrizzleRepository } from './editorial/translation.drizzle-repository.js';
import { ApprovalItemDrizzleRepository } from './project-management/approval-item.drizzle-repository.js';
import { CampaignFlowDrizzleTransaction } from './project-management/campaign-flow-drizzle-transaction.js';
import { CampaignArtifactDrizzleRepository } from './project-management/campaign-artifact.drizzle-repository.js';
import { CampaignDrizzleRepository } from './project-management/campaign.drizzle-repository.js';
import { CampaignPresetDrizzleRepository } from './project-management/campaign-preset.drizzle-repository.js';
import { PlannedPublicationDrizzleRepository } from './project-management/planned-publication.drizzle-repository.js';
import { ProjectDrizzleRepository } from './project-management/project.drizzle-repository.js';
import { ProjectMarkerDrizzleRepository } from './project-management/project-marker.drizzle-repository.js';
import { ProjectMarkerPlacementDrizzleRepository } from './project-management/project-marker-placement.drizzle-repository.js';
import { QualityCheckResultDrizzleRepository } from './project-management/quality-check-result.drizzle-repository.js';
import { WorkflowRunDrizzleRepository } from './project-management/workflow-run.drizzle-repository.js';
import { DiscordWebhookPublisher } from './publishing/discord-webhook.publisher.js';
import { PublicationDrizzleRepository } from './publishing/publication.drizzle-repository.js';
import { PublicationPlanDrizzleRepository } from './publishing/publication-plan.drizzle-repository.js';
import { TelegramBotApiPublisher } from './publishing/telegram-bot-api.publisher.js';
import { XApiPublisher } from './publishing/x-api.publisher.js';

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
    DiscordWebhookPublisher,
    TelegramBotApiPublisher,
    XApiPublisher,
    CampaignFlowDrizzleTransaction,
    PublicationDrizzleRepository,
    PublicationPlanDrizzleRepository,
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
    QualityCheckResultDrizzleRepository,
    TranslationDrizzleRepository,
    WorkflowRunDrizzleRepository,
    { provide: AiGatewayPort, useExisting: DeepSeekAiGateway },
    { provide: CampaignFlowTransactionPort, useExisting: CampaignFlowDrizzleTransaction },
    { provide: AdaptationGeneratorPort, useClass: DeepSeekAdaptationGenerator },
    { provide: TranslationGeneratorPort, useExisting: DeepSeekAdaptationGenerator },
    { provide: DiscordPublisherPort, useClass: DiscordWebhookPublisher },
    { provide: TelegramPublisherPort, useClass: TelegramBotApiPublisher },
    { provide: XPublisherPort, useClass: XApiPublisher },
    { provide: PublicationRepository, useClass: PublicationDrizzleRepository },
    { provide: PublicationPlanRepository, useClass: PublicationPlanDrizzleRepository },
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
    { provide: QualityCheckResultRepository, useClass: QualityCheckResultDrizzleRepository },
    { provide: TranslationRepository, useClass: TranslationDrizzleRepository },
    { provide: WorkflowRunRepository, useClass: WorkflowRunDrizzleRepository },
  ],
  exports: [
    AdaptationVersionRepository,
    AdaptationGeneratorPort,
    ApprovalItemRepository,
    AiGatewayPort,
    CampaignFlowTransactionPort,
    ArticleRepository,
    ArticleSourceVersionRepository,
    CampaignArtifactRepository,
    CampaignPresetRepository,
    CampaignRepository,
    ChannelAdaptationRepository,
    DiscordPublisherPort,
    PlannedPublicationRepository,
    TranslationGeneratorPort,
    TelegramPublisherPort,
    XPublisherPort,
    PublicationPlanRepository,
    PublicationRepository,
    ProjectMarkerPlacementRepository,
    ProjectMarkerRepository,
    ProjectRepository,
    QualityCheckResultRepository,
    TranslationRepository,
    WorkflowRunRepository,
  ],
})
export class InfrastructureModule {}
