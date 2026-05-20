import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ApproveCampaignForPublishingHandler } from './use-cases/approve-campaign-for-publishing/approve-campaign-for-publishing.handler.js';
import { AttachCampaignSourceHandler } from './use-cases/attach-campaign-source/attach-campaign-source.handler.js';
import { CreateCampaignHandler } from './use-cases/create-campaign/create-campaign.handler.js';
import { CreateCampaignPresetHandler } from './use-cases/create-campaign-preset/create-campaign-preset.handler.js';
import { CreateProjectHandler } from './use-cases/create-project/create-project.handler.js';
import { CreateProjectMarkerHandler } from './use-cases/create-project-marker/create-project-marker.handler.js';
import { CreateProjectMarkerPlacementHandler } from './use-cases/create-project-marker-placement/create-project-marker-placement.handler.js';
import { DeleteCampaignHandler } from './use-cases/delete-campaign/delete-campaign.handler.js';
import { DeleteProjectHandler } from './use-cases/delete-project/delete-project.handler.js';
import { DeleteProjectMarkerHandler } from './use-cases/delete-project-marker/delete-project-marker.handler.js';
import { GetCampaignApprovalInboxHandler } from './use-cases/get-campaign-approval-inbox/get-campaign-approval-inbox.handler.js';
import { GetCampaignDetailHandler } from './use-cases/get-campaign-detail/get-campaign-detail.handler.js';
import { GetCampaignExecutionHistoryHandler } from './use-cases/get-campaign-execution-history/get-campaign-execution-history.handler.js';
import { GetCampaignPublishingOverviewHandler } from './use-cases/get-campaign-publishing-overview/get-campaign-publishing-overview.handler.js';
import { GetProjectHandler } from './use-cases/get-project/get-project.handler.js';
import { GetProjectApprovalInboxHandler } from './use-cases/get-project-approval-inbox/get-project-approval-inbox.handler.js';
import { GetProjectMarkerPlacementsHandler } from './use-cases/get-project-marker-placements/get-project-marker-placements.handler.js';
import { ListCampaignPresetsHandler } from './use-cases/list-campaign-presets/list-campaign-presets.handler.js';
import { ListProjectMarkersHandler } from './use-cases/list-project-markers/list-project-markers.handler.js';
import { ListProjectCampaignsHandler } from './use-cases/list-project-campaigns/list-project-campaigns.handler.js';
import { ListProjectsHandler } from './use-cases/list-projects/list-projects.handler.js';
import { ReviewSourceIssueHandler } from './use-cases/review-source-issue/review-source-issue.handler.js';
import { ReviewGeneratedArtifactIssueHandler } from './use-cases/review-generated-artifact-issue/review-generated-artifact-issue.handler.js';
import { RescheduleCampaignPlannedPublicationHandler } from './use-cases/reschedule-campaign-planned-publication/reschedule-campaign-planned-publication.handler.js';
import { RunCampaignStage1Executor } from './use-cases/run-campaign-stage-1/run-campaign-stage-1.handler.js';
import { RunCampaignStage1Handler } from './use-cases/run-campaign-stage-1/run-campaign-stage-1.enqueue-handler.js';
import { RunCampaignStage2Executor } from './use-cases/run-campaign-stage-2/run-campaign-stage-2.handler.js';
import { RunCampaignStage2Handler } from './use-cases/run-campaign-stage-2/run-campaign-stage-2.enqueue-handler.js';
import { StartCampaignProductionExecutor } from './use-cases/start-campaign-production/start-campaign-production.executor.js';
import { StartCampaignProductionHandler } from './use-cases/start-campaign-production/start-campaign-production.handler.js';
import { UpdateCampaignPresetHandler } from './use-cases/update-campaign-preset/update-campaign-preset.handler.js';
import { UpdateProjectBrandMemoryHandler } from './use-cases/update-project-brand-memory/update-project-brand-memory.handler.js';

@Module({
  imports: [CqrsModule],
  providers: [
    ApproveCampaignForPublishingHandler,
    AttachCampaignSourceHandler,
    CreateCampaignHandler,
    CreateCampaignPresetHandler,
    CreateProjectMarkerPlacementHandler,
    CreateProjectMarkerHandler,
    CreateProjectHandler,
    DeleteCampaignHandler,
    DeleteProjectHandler,
    DeleteProjectMarkerHandler,
    GetCampaignApprovalInboxHandler,
    GetCampaignDetailHandler,
    GetCampaignExecutionHistoryHandler,
    GetCampaignPublishingOverviewHandler,
    GetProjectHandler,
    GetProjectApprovalInboxHandler,
    GetProjectMarkerPlacementsHandler,
    ListCampaignPresetsHandler,
    ListProjectCampaignsHandler,
    ListProjectMarkersHandler,
    ListProjectsHandler,
    ReviewGeneratedArtifactIssueHandler,
    ReviewSourceIssueHandler,
    RescheduleCampaignPlannedPublicationHandler,
    RunCampaignStage1Executor,
    RunCampaignStage1Handler,
    RunCampaignStage2Executor,
    RunCampaignStage2Handler,
    StartCampaignProductionExecutor,
    StartCampaignProductionHandler,
    UpdateCampaignPresetHandler,
    UpdateProjectBrandMemoryHandler,
  ],
  exports: [
    RunCampaignStage1Executor,
    RunCampaignStage2Executor,
    StartCampaignProductionExecutor,
  ],
})
export class ProjectManagementModule {}
