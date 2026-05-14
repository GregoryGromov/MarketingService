import type {
  AdaptationVersionRepository,
  ArticleRepository,
  ArticleSourceVersionRepository,
  ChannelAdaptationRepository,
} from '@marketing-service/editorial';
import type { ApprovalItemRepository } from '../domain/approval-item.repository.js';
import type { CampaignArtifactRepository } from '../domain/campaign-artifact.repository.js';
import type { CampaignPresetRepository } from '../domain/campaign-preset.repository.js';
import type { CampaignRepository } from '../domain/campaign.repository.js';
import type { PlannedPublicationRepository } from '../domain/planned-publication.repository.js';
import type { ProjectRepository } from '../domain/project.repository.js';
import type { QualityCheckResultRepository } from '../domain/quality-check-result.repository.js';
import type { WorkflowRunRepository } from '../domain/workflow-run.repository.js';

export interface CampaignFlowTransactionContext {
  projectRepository: ProjectRepository;
  campaignPresetRepository: CampaignPresetRepository;
  campaignRepository: CampaignRepository;
  plannedPublicationRepository: PlannedPublicationRepository;
  campaignArtifactRepository: CampaignArtifactRepository;
  approvalItemRepository: ApprovalItemRepository;
  qualityCheckResultRepository: QualityCheckResultRepository;
  workflowRunRepository: WorkflowRunRepository;
  articleRepository: ArticleRepository;
  articleSourceVersionRepository: ArticleSourceVersionRepository;
  channelAdaptationRepository: ChannelAdaptationRepository;
  adaptationVersionRepository: AdaptationVersionRepository;
}

export abstract class CampaignFlowTransactionPort {
  abstract run<T>(
    work: (context: CampaignFlowTransactionContext) => Promise<T>,
  ): Promise<T>;
}
