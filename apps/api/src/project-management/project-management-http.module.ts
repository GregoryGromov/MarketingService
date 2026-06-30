import { ProjectManagementModule } from '@marketing-service/project-management';
import { Module } from '@nestjs/common';
import { CampaignController } from './campaign.controller.js';
import { CampaignMediaController } from './campaign-media.controller.js';
import { CampaignPresetController } from './campaign-preset.controller.js';
import { CampaignSourceMediaService } from './campaign-source-media.service.js';
import { CampaignTestUiController } from './campaign-test-ui.controller.js';
import {
  BrandMemorySeoCompetitorKeywordRefreshScheduler,
  ProjectController,
} from './project.controller.js';

@Module({
  imports: [ProjectManagementModule],
  controllers: [
    ProjectController,
    CampaignController,
    CampaignMediaController,
    CampaignPresetController,
    CampaignTestUiController,
  ],
  providers: [CampaignSourceMediaService, BrandMemorySeoCompetitorKeywordRefreshScheduler],
})
export class ProjectManagementHttpModule {}
