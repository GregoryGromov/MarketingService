import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AttachCampaignSourceHandler } from './use-cases/attach-campaign-source/attach-campaign-source.handler.js';
import { CreateCampaignHandler } from './use-cases/create-campaign/create-campaign.handler.js';
import { CreateProjectHandler } from './use-cases/create-project/create-project.handler.js';
import { CreateProjectMarkerHandler } from './use-cases/create-project-marker/create-project-marker.handler.js';
import { CreateProjectMarkerPlacementHandler } from './use-cases/create-project-marker-placement/create-project-marker-placement.handler.js';
import { DeleteProjectMarkerHandler } from './use-cases/delete-project-marker/delete-project-marker.handler.js';
import { GetProjectHandler } from './use-cases/get-project/get-project.handler.js';
import { GetProjectMarkerPlacementsHandler } from './use-cases/get-project-marker-placements/get-project-marker-placements.handler.js';
import { ListProjectMarkersHandler } from './use-cases/list-project-markers/list-project-markers.handler.js';
import { ListProjectsHandler } from './use-cases/list-projects/list-projects.handler.js';
import { ReviewSourceIssueHandler } from './use-cases/review-source-issue/review-source-issue.handler.js';
import { RunCampaignStage1Handler } from './use-cases/run-campaign-stage-1/run-campaign-stage-1.handler.js';
import { StartCampaignProductionHandler } from './use-cases/start-campaign-production/start-campaign-production.handler.js';

@Module({
  imports: [CqrsModule],
  providers: [
    AttachCampaignSourceHandler,
    CreateCampaignHandler,
    CreateProjectMarkerPlacementHandler,
    CreateProjectMarkerHandler,
    CreateProjectHandler,
    DeleteProjectMarkerHandler,
    GetProjectHandler,
    GetProjectMarkerPlacementsHandler,
    ListProjectMarkersHandler,
    ListProjectsHandler,
    ReviewSourceIssueHandler,
    RunCampaignStage1Handler,
    StartCampaignProductionHandler,
  ],
  exports: [],
})
export class ProjectManagementModule {}
