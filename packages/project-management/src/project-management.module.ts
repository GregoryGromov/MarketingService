import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ApproveCampaignForPublishingHandler } from './use-cases/approve-campaign-for-publishing/approve-campaign-for-publishing.handler.js';
import { AttachCampaignSourceHandler } from './use-cases/attach-campaign-source/attach-campaign-source.handler.js';
import { CreateCampaignHandler } from './use-cases/create-campaign/create-campaign.handler.js';
import { CreateProjectHandler } from './use-cases/create-project/create-project.handler.js';
import { CreateProjectMarkerHandler } from './use-cases/create-project-marker/create-project-marker.handler.js';
import { CreateProjectMarkerPlacementHandler } from './use-cases/create-project-marker-placement/create-project-marker-placement.handler.js';
import { DeleteProjectMarkerHandler } from './use-cases/delete-project-marker/delete-project-marker.handler.js';
import { GetCampaignApprovalInboxHandler } from './use-cases/get-campaign-approval-inbox/get-campaign-approval-inbox.handler.js';
import { GetCampaignDetailHandler } from './use-cases/get-campaign-detail/get-campaign-detail.handler.js';
import { GetCampaignPublishingOverviewHandler } from './use-cases/get-campaign-publishing-overview/get-campaign-publishing-overview.handler.js';
import { GetProjectHandler } from './use-cases/get-project/get-project.handler.js';
import { GetProjectMarkerPlacementsHandler } from './use-cases/get-project-marker-placements/get-project-marker-placements.handler.js';
import { ListCampaignPresetsHandler } from './use-cases/list-campaign-presets/list-campaign-presets.handler.js';
import { ListProjectMarkersHandler } from './use-cases/list-project-markers/list-project-markers.handler.js';
import { ListProjectCampaignsHandler } from './use-cases/list-project-campaigns/list-project-campaigns.handler.js';
import { ListProjectsHandler } from './use-cases/list-projects/list-projects.handler.js';
import { ReviewSourceIssueHandler } from './use-cases/review-source-issue/review-source-issue.handler.js';
import { RunCampaignStage1Handler } from './use-cases/run-campaign-stage-1/run-campaign-stage-1.handler.js';
import { RunCampaignStage2Handler } from './use-cases/run-campaign-stage-2/run-campaign-stage-2.handler.js';
import { StartCampaignProductionHandler } from './use-cases/start-campaign-production/start-campaign-production.handler.js';
import { UpdateProjectBrandMemoryHandler } from './use-cases/update-project-brand-memory/update-project-brand-memory.handler.js';

@Module({
  imports: [CqrsModule],
  providers: [
    ApproveCampaignForPublishingHandler,
    AttachCampaignSourceHandler,
    CreateCampaignHandler,
    CreateProjectMarkerPlacementHandler,
    CreateProjectMarkerHandler,
    CreateProjectHandler,
    DeleteProjectMarkerHandler,
    GetCampaignApprovalInboxHandler,
    GetCampaignDetailHandler,
    GetCampaignPublishingOverviewHandler,
    GetProjectHandler,
    GetProjectMarkerPlacementsHandler,
    ListCampaignPresetsHandler,
    ListProjectCampaignsHandler,
    ListProjectMarkersHandler,
    ListProjectsHandler,
    ReviewSourceIssueHandler,
    RunCampaignStage1Handler,
    RunCampaignStage2Handler,
    StartCampaignProductionHandler,
    UpdateProjectBrandMemoryHandler,
  ],
  exports: [],
})
export class ProjectManagementModule {}
