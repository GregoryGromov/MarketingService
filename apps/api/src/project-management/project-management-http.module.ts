import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CampaignController } from './campaign.controller.js';
import { CampaignPresetController } from './campaign-preset.controller.js';
import { CampaignSourceMediaService } from './campaign-source-media.service.js';
import { CampaignTestUiController } from './campaign-test-ui.controller.js';
import { ProjectController } from './project.controller.js';

@Module({
  imports: [CqrsModule],
  controllers: [
    ProjectController,
    CampaignController,
    CampaignPresetController,
    CampaignTestUiController,
  ],
  providers: [CampaignSourceMediaService],
})
export class ProjectManagementHttpModule {}
