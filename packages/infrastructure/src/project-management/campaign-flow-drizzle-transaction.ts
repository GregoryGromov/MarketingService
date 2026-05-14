import { Inject, Injectable } from '@nestjs/common';
import {
  CampaignFlowTransactionPort,
  type CampaignFlowTransactionContext,
} from '@marketing-service/project-management';
import { AdaptationVersionDrizzleRepository } from '../editorial/adaptation-version.drizzle-repository.js';
import { ArticleDrizzleRepository } from '../editorial/article.drizzle-repository.js';
import { ArticleSourceVersionDrizzleRepository } from '../editorial/article-source-version.drizzle-repository.js';
import { ChannelAdaptationDrizzleRepository } from '../editorial/channel-adaptation.drizzle-repository.js';
import { DRIZZLE, type DrizzleDB, type DrizzleTx } from '../database.module.js';
import { ApprovalItemDrizzleRepository } from './approval-item.drizzle-repository.js';
import { CampaignArtifactDrizzleRepository } from './campaign-artifact.drizzle-repository.js';
import { CampaignDrizzleRepository } from './campaign.drizzle-repository.js';
import { CampaignPresetDrizzleRepository } from './campaign-preset.drizzle-repository.js';
import { PlannedPublicationDrizzleRepository } from './planned-publication.drizzle-repository.js';
import { ProjectDrizzleRepository } from './project.drizzle-repository.js';
import { QualityCheckResultDrizzleRepository } from './quality-check-result.drizzle-repository.js';
import { WorkflowRunDrizzleRepository } from './workflow-run.drizzle-repository.js';

function createTransactionContext(tx: DrizzleTx): CampaignFlowTransactionContext {
  return {
    projectRepository: new ProjectDrizzleRepository(tx),
    campaignPresetRepository: new CampaignPresetDrizzleRepository(tx),
    campaignRepository: new CampaignDrizzleRepository(tx),
    plannedPublicationRepository: new PlannedPublicationDrizzleRepository(tx),
    campaignArtifactRepository: new CampaignArtifactDrizzleRepository(tx),
    approvalItemRepository: new ApprovalItemDrizzleRepository(tx),
    qualityCheckResultRepository: new QualityCheckResultDrizzleRepository(tx),
    workflowRunRepository: new WorkflowRunDrizzleRepository(tx),
    articleRepository: new ArticleDrizzleRepository(tx),
    articleSourceVersionRepository: new ArticleSourceVersionDrizzleRepository(tx),
    channelAdaptationRepository: new ChannelAdaptationDrizzleRepository(tx),
    adaptationVersionRepository: new AdaptationVersionDrizzleRepository(tx),
  };
}

@Injectable()
export class CampaignFlowDrizzleTransaction extends CampaignFlowTransactionPort {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {
    super();
  }

  async run<T>(work: (context: CampaignFlowTransactionContext) => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx) => work(createTransactionContext(tx)));
  }
}
