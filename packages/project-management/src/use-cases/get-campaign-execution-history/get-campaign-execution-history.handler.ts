import { Inject } from '@nestjs/common';
import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import { CampaignRepository } from '../../domain/campaign.repository.js';
import { PlannedPublicationRepository } from '../../domain/planned-publication.repository.js';
import { QualityCheckResultRepository } from '../../domain/quality-check-result.repository.js';
import { WorkflowRunRepository } from '../../domain/workflow-run.repository.js';
import { GetCampaignExecutionHistoryQuery } from './get-campaign-execution-history.query.js';

export interface CampaignExecutionHistoryAttemptResult {
  id: string;
  plannedPublicationId: string | null;
  plannedPublicationLabel: string | null;
  checkType: string;
  attemptNumber: number;
  result: string;
  createdAt: Date;
  reasonCount: number;
  summary: string | null;
}

export interface CampaignExecutionHistoryWorkflowRunResult {
  id: string;
  status: string;
  currentStep: string;
  errorMessage: string | null;
  startedAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  attempts: CampaignExecutionHistoryAttemptResult[];
}

export interface GetCampaignExecutionHistoryResult {
  campaignId: string;
  projectId: string;
  campaignName: string;
  campaignStatus: string;
  sourceLanguage: string;
  workflowRuns: CampaignExecutionHistoryWorkflowRunResult[];
}

function toTitleCase(token: string): string {
  return token
    .split(/[_\s-]+/)
    .filter((part) => part.length > 0)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

function getChannelLabel(channel: string): string {
  switch (channel) {
    case 'channel_telegram':
      return 'Telegram';
    case 'channel_x':
      return 'X';
    case 'channel_discord':
      return 'Discord';
    default:
      return channel;
  }
}

function buildPlannedPublicationLabel(input: {
  channel: string;
  language: string;
  publicationType: string;
  style: string;
}): string {
  return [
    getChannelLabel(input.channel),
    input.language.toUpperCase(),
    toTitleCase(input.publicationType),
    toTitleCase(input.style),
  ].join(' · ');
}

function mapCheckTypeToWorkflowStep(checkType: string): string | null {
  switch (checkType) {
    case 'source_guideline_check':
      return 'source_check';
    case 'stage_1_adaptation_quality':
      return 'stage_1_adaptation';
    case 'stage_2_translation_fidelity':
      return 'stage_2_translation';
    default:
      return null;
  }
}

function extractSummary(rawAiResult: Record<string, unknown> | null): string | null {
  const summary = rawAiResult?.summary;
  return typeof summary === 'string' && summary.trim().length > 0 ? summary : null;
}

@QueryHandler(GetCampaignExecutionHistoryQuery)
export class GetCampaignExecutionHistoryHandler
  implements
    IQueryHandler<
      GetCampaignExecutionHistoryQuery,
      GetCampaignExecutionHistoryResult | null
    >
{
  constructor(
    @Inject(CampaignRepository)
    private readonly campaignRepository: CampaignRepository,
    @Inject(WorkflowRunRepository)
    private readonly workflowRunRepository: WorkflowRunRepository,
    @Inject(PlannedPublicationRepository)
    private readonly plannedPublicationRepository: PlannedPublicationRepository,
    @Inject(QualityCheckResultRepository)
    private readonly qualityCheckResultRepository: QualityCheckResultRepository,
  ) {}

  async execute(
    query: GetCampaignExecutionHistoryQuery,
  ): Promise<GetCampaignExecutionHistoryResult | null> {
    const campaign = await this.campaignRepository.findById(query.campaignId);
    if (!campaign) {
      return null;
    }

    const [workflowRuns, plannedPublications, qualityChecks] = await Promise.all([
      this.workflowRunRepository.findByCampaignId(campaign.id),
      this.plannedPublicationRepository.findByCampaignId(campaign.id),
      this.qualityCheckResultRepository.findByCampaignId(campaign.id),
    ]);

    const publicationLabels = new Map(
      plannedPublications.map((plannedPublication) => [
        plannedPublication.id,
        buildPlannedPublicationLabel({
          channel: plannedPublication.channel,
          language: plannedPublication.language,
          publicationType: plannedPublication.publicationType,
          style: plannedPublication.style,
        }),
      ]),
    );

    const workflowRunResults: CampaignExecutionHistoryWorkflowRunResult[] = [...workflowRuns]
      .sort((left, right) => right.startedAt.getTime() - left.startedAt.getTime())
      .map((workflowRun) => {
        const startedAtMs = workflowRun.startedAt.getTime();
        const completedAtMs = workflowRun.completedAt?.getTime() ?? workflowRun.updatedAt.getTime();

        const attempts = qualityChecks
          .filter((qualityCheck) => {
            const mappedStep = mapCheckTypeToWorkflowStep(qualityCheck.checkType);
            if (mappedStep !== workflowRun.currentStep) {
              return false;
            }

            const createdAtMs = qualityCheck.createdAt.getTime();
            return createdAtMs >= startedAtMs && createdAtMs <= completedAtMs;
          })
          .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime())
          .map((qualityCheck) => ({
            id: qualityCheck.id,
            plannedPublicationId: qualityCheck.plannedPublicationId,
            plannedPublicationLabel: qualityCheck.plannedPublicationId
              ? publicationLabels.get(qualityCheck.plannedPublicationId) ?? null
              : null,
            checkType: qualityCheck.checkType,
            attemptNumber: qualityCheck.attemptNumber,
            result: qualityCheck.result,
            createdAt: qualityCheck.createdAt,
            reasonCount: qualityCheck.reasons.length,
            summary: extractSummary(qualityCheck.rawAiResult),
          }));

        return {
          id: workflowRun.id,
          status: workflowRun.status,
          currentStep: workflowRun.currentStep,
          errorMessage: workflowRun.errorMessage,
          startedAt: workflowRun.startedAt,
          completedAt: workflowRun.completedAt,
          createdAt: workflowRun.createdAt,
          updatedAt: workflowRun.updatedAt,
          attempts,
        };
      });

    return {
      campaignId: campaign.id,
      projectId: campaign.projectId,
      campaignName: campaign.name,
      campaignStatus: campaign.status,
      sourceLanguage: campaign.sourceLanguage,
      workflowRuns: workflowRunResults,
    };
  }
}
