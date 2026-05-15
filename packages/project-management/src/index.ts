export {
  type BrandMemory,
  type BrandMemoryDocument,
  type CreateProjectParams,
  Project,
  type ProjectId,
  type ProjectProps,
} from './domain/project.aggregate.js';
export { ProjectRepository } from './domain/project.repository.js';
export {
  type CampaignPresetPublicationId,
  CampaignPresetPublication,
  type CampaignPresetPublicationProps,
  type CreateCampaignPresetPublicationParams,
} from './domain/campaign-preset-publication.entity.js';
export {
  type CampaignPresetId,
  CampaignPreset,
  type CampaignPresetProps,
  type CreateCampaignPresetParams,
} from './domain/campaign-preset.aggregate.js';
export { CampaignPresetRepository } from './domain/campaign-preset.repository.js';
export {
  type CampaignId,
  type CampaignStatus,
  Campaign,
  type CampaignProps,
  type CreateCampaignParams,
} from './domain/campaign.aggregate.js';
export { CampaignRepository } from './domain/campaign.repository.js';
export {
  type CreatePlannedPublicationParams,
  type PlannedPublicationId,
  type PlannedPublicationProps,
  type PlannedPublicationPublishMode,
  type PlannedPublicationStatus,
  PlannedPublication,
} from './domain/planned-publication.entity.js';
export { PlannedPublicationRepository } from './domain/planned-publication.repository.js';
export {
  type CampaignArtifactId,
  type CampaignArtifactProps,
  type CampaignArtifactType,
  CampaignArtifact,
  type CreateCampaignArtifactParams,
} from './domain/campaign-artifact.entity.js';
export { CampaignArtifactRepository } from './domain/campaign-artifact.repository.js';
export {
  type ApprovalItemId,
  type ApprovalItemPayload,
  type ApprovalItemProps,
  type ApprovalItemSeverity,
  type ApprovalItemStatus,
  type ApprovalItemType,
  ApprovalItem,
  type CreateApprovalItemParams,
} from './domain/approval-item.aggregate.js';
export { ApprovalItemRepository } from './domain/approval-item.repository.js';
export {
  type CreateQualityCheckResultParams,
  type QualityCheckOutcome,
  type QualityCheckReason,
  type QualityCheckResultId,
  type QualityCheckResultProps,
  type QualityCheckType,
  QualityCheckResult,
} from './domain/quality-check-result.entity.js';
export { QualityCheckResultRepository } from './domain/quality-check-result.repository.js';
export {
  type CreateWorkflowRunParams,
  type WorkflowRunId,
  type WorkflowRunProps,
  type WorkflowRunStatus,
  WorkflowRun,
} from './domain/workflow-run.aggregate.js';
export { WorkflowRunRepository } from './domain/workflow-run.repository.js';
export {
  type CreateProjectMarkerParams,
  ProjectMarker,
  type ProjectMarkerId,
  type ProjectMarkerProps,
} from './domain/project-marker.aggregate.js';
export { ProjectMarkerRepository } from './domain/project-marker.repository.js';
export {
  type CreateProjectMarkerPlacementParams,
  ProjectMarkerPlacement,
  type ProjectMarkerPlacementId,
  type ProjectMarkerPlacementProps,
} from './domain/project-marker-placement.aggregate.js';
export { ProjectMarkerPlacementRepository } from './domain/project-marker-placement.repository.js';
export {
  type AiGeneratedTextResult,
  type AiGatewayQualityOutcome,
  type AiGatewayReason,
  type AiGatewaySeverity,
  type AiGatewaySourceValidationOutcome,
  type AiGatewaySuggestedFix,
  type AiQualityCheckResult,
  AiGatewayPort,
  type CheckAdaptationQualityParams,
  type CheckTranslationFidelityParams,
  type GenerateAdaptationAiParams,
  type GenerateTranslationAiParams,
  type ReviseAdaptationAiParams,
  type ReviseTranslationAiParams,
  type ValidateSourceLongreadParams,
  type ValidateSourceLongreadResult,
} from './ports/ai-gateway.port.js';
export {
  CAMPAIGN_PRODUCTION_QUEUE,
  CAMPAIGN_SOURCE_CHECK_JOB,
  CAMPAIGN_STAGE_1_JOB,
  CAMPAIGN_STAGE_2_JOB,
  CampaignProductionJobPort,
  type CampaignProductionJobPayload,
  type EnqueuedCampaignProductionJob,
} from './ports/campaign-production-job.port.js';
export {
  CampaignPublishingPort,
  type CampaignExportPlanRecord,
  type CampaignScheduledPublicationRecord,
  type UpsertCampaignExportPlanParams,
  type UpsertCampaignScheduledPublicationParams,
} from './ports/campaign-publishing.port.js';
export {
  CampaignFlowTransactionPort,
  type CampaignFlowTransactionContext,
} from './ports/campaign-flow-transaction.port.js';
export { ProjectManagementModule } from './project-management.module.js';
export { ApproveCampaignForPublishingCommand } from './use-cases/approve-campaign-for-publishing/approve-campaign-for-publishing.command.js';
export type { ApproveCampaignForPublishingResult } from './use-cases/approve-campaign-for-publishing/approve-campaign-for-publishing.handler.js';
export { AttachCampaignSourceCommand } from './use-cases/attach-campaign-source/attach-campaign-source.command.js';
export type { AttachCampaignSourceResult } from './use-cases/attach-campaign-source/attach-campaign-source.handler.js';
export {
  CreateCampaignCommand,
  type CreateCampaignPlannedPublicationOverride,
} from './use-cases/create-campaign/create-campaign.command.js';
export type { CreateCampaignResult } from './use-cases/create-campaign/create-campaign.handler.js';
export { CreateProjectCommand } from './use-cases/create-project/create-project.command.js';
export { CreateProjectMarkerCommand } from './use-cases/create-project-marker/create-project-marker.command.js';
export { CreateProjectMarkerPlacementCommand } from './use-cases/create-project-marker-placement/create-project-marker-placement.command.js';
export { DeleteProjectMarkerCommand } from './use-cases/delete-project-marker/delete-project-marker.command.js';
export type {
  CampaignApprovalInboxItemResult,
  GetCampaignApprovalInboxResult,
} from './use-cases/get-campaign-approval-inbox/get-campaign-approval-inbox.handler.js';
export { GetCampaignApprovalInboxQuery } from './use-cases/get-campaign-approval-inbox/get-campaign-approval-inbox.query.js';
export type { GetCampaignDetailResult } from './use-cases/get-campaign-detail/get-campaign-detail.handler.js';
export { GetCampaignDetailQuery } from './use-cases/get-campaign-detail/get-campaign-detail.query.js';
export type {
  CampaignExecutionHistoryAttemptResult,
  CampaignExecutionHistoryWorkflowRunResult,
  GetCampaignExecutionHistoryResult,
} from './use-cases/get-campaign-execution-history/get-campaign-execution-history.handler.js';
export { GetCampaignExecutionHistoryQuery } from './use-cases/get-campaign-execution-history/get-campaign-execution-history.query.js';
export type {
  CampaignPublishingOverviewItemResult,
  CampaignPublishingOverviewMetrics,
  GetCampaignPublishingOverviewResult,
} from './use-cases/get-campaign-publishing-overview/get-campaign-publishing-overview.handler.js';
export { GetCampaignPublishingOverviewQuery } from './use-cases/get-campaign-publishing-overview/get-campaign-publishing-overview.query.js';
export type { GetProjectResult } from './use-cases/get-project/get-project.handler.js';
export { GetProjectQuery } from './use-cases/get-project/get-project.query.js';
export type { GetProjectMarkerPlacementsResultItem } from './use-cases/get-project-marker-placements/get-project-marker-placements.handler.js';
export { GetProjectMarkerPlacementsQuery } from './use-cases/get-project-marker-placements/get-project-marker-placements.query.js';
export type { ListProjectMarkersResultItem } from './use-cases/list-project-markers/list-project-markers.handler.js';
export { ListProjectMarkersQuery } from './use-cases/list-project-markers/list-project-markers.query.js';
export type {
  ListCampaignPresetPublicationResultItem,
  ListCampaignPresetsResultItem,
} from './use-cases/list-campaign-presets/list-campaign-presets.handler.js';
export { ListCampaignPresetsQuery } from './use-cases/list-campaign-presets/list-campaign-presets.query.js';
export type { ListProjectCampaignsResultItem } from './use-cases/list-project-campaigns/list-project-campaigns.handler.js';
export { ListProjectCampaignsQuery } from './use-cases/list-project-campaigns/list-project-campaigns.query.js';
export type { ListProjectsResultItem } from './use-cases/list-projects/list-projects.handler.js';
export { ListProjectsQuery } from './use-cases/list-projects/list-projects.query.js';
export { ReviewSourceIssueCommand } from './use-cases/review-source-issue/review-source-issue.command.js';
export type { ReviewSourceIssueResult } from './use-cases/review-source-issue/review-source-issue.handler.js';
export { RunCampaignStage1Command } from './use-cases/run-campaign-stage-1/run-campaign-stage-1.command.js';
export { RunCampaignStage1Executor } from './use-cases/run-campaign-stage-1/run-campaign-stage-1.handler.js';
export type {
  RunCampaignStage1ItemResult,
  RunCampaignStage1Result,
} from './use-cases/run-campaign-stage-1/run-campaign-stage-1.handler.js';
export type { RunCampaignStage1QueuedResult } from './use-cases/run-campaign-stage-1/run-campaign-stage-1.enqueue-handler.js';
export { RunCampaignStage2Command } from './use-cases/run-campaign-stage-2/run-campaign-stage-2.command.js';
export { RunCampaignStage2Executor } from './use-cases/run-campaign-stage-2/run-campaign-stage-2.handler.js';
export type {
  RunCampaignStage2ItemResult,
  RunCampaignStage2Result,
} from './use-cases/run-campaign-stage-2/run-campaign-stage-2.handler.js';
export type { RunCampaignStage2QueuedResult } from './use-cases/run-campaign-stage-2/run-campaign-stage-2.enqueue-handler.js';
export { StartCampaignProductionCommand } from './use-cases/start-campaign-production/start-campaign-production.command.js';
export type { StartCampaignProductionResult } from './use-cases/start-campaign-production/start-campaign-production.handler.js';
export { StartCampaignProductionExecutor } from './use-cases/start-campaign-production/start-campaign-production.executor.js';
export type { StartCampaignProductionExecutionResult } from './use-cases/start-campaign-production/start-campaign-production.executor.js';
export { UpdateProjectBrandMemoryCommand } from './use-cases/update-project-brand-memory/update-project-brand-memory.command.js';
export type { UpdateProjectBrandMemoryResult } from './use-cases/update-project-brand-memory/update-project-brand-memory.handler.js';
