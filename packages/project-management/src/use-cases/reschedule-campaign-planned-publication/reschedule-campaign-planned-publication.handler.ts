import type { ChannelAdaptation } from '@marketing-service/editorial';
import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { CampaignFlowTransactionPort } from '../../ports/campaign-flow-transaction.port.js';
import {
  toMoscowDayOffset,
  toMoscowLocalTimeToken,
} from '../../time/moscow-time.js';
import { RescheduleCampaignPlannedPublicationCommand } from './reschedule-campaign-planned-publication.command.js';

const STAGE_1_BASE_ADAPTATION_ROLE = 'stage_1_base_adaptation';

export interface RescheduleCampaignPlannedPublicationResult {
  plannedPublicationId: string;
  publishAt: Date;
  dayOffset: number;
  localTime: string;
}

async function resolveApprovedAdaptation(
  plannedPublicationId: string,
  campaignArtifactRepository: {
    findByPlannedPublicationId(plannedPublicationId: never): Promise<Array<{
      artifactType: string;
      artifactId: string;
      role: string;
    }>>;
  },
  channelAdaptationRepository: {
    findById(adaptationId: never): Promise<ChannelAdaptation | null>;
  },
): Promise<ChannelAdaptation> {
  const artifacts = await campaignArtifactRepository.findByPlannedPublicationId(
    plannedPublicationId as never,
  );
  const adaptationArtifact = artifacts.find(
    (artifact) =>
      artifact.artifactType === 'adaptation' &&
      artifact.role === STAGE_1_BASE_ADAPTATION_ROLE,
  );

  if (!adaptationArtifact) {
    throw new Error(
      `Planned publication ${plannedPublicationId} has no approved Stage 1 adaptation artifact`,
    );
  }

  const adaptation = await channelAdaptationRepository.findById(
    adaptationArtifact.artifactId as never,
  );
  if (!adaptation) {
    throw new Error(
      `Adaptation ${adaptationArtifact.artifactId} for planned publication ${plannedPublicationId} not found`,
    );
  }

  return adaptation;
}

@CommandHandler(RescheduleCampaignPlannedPublicationCommand)
export class RescheduleCampaignPlannedPublicationHandler
  implements
    ICommandHandler<
      RescheduleCampaignPlannedPublicationCommand,
      RescheduleCampaignPlannedPublicationResult
    >
{
  constructor(
    @Inject(CampaignFlowTransactionPort)
    private readonly transaction: CampaignFlowTransactionPort,
  ) {}

  async execute(
    command: RescheduleCampaignPlannedPublicationCommand,
  ): Promise<RescheduleCampaignPlannedPublicationResult> {
    return this.transaction.run(async ({
      campaignRepository,
      plannedPublicationRepository,
      campaignArtifactRepository,
      channelAdaptationRepository,
      campaignPublishingPort,
    }) => {
      const campaign = await campaignRepository.findById(command.campaignId);
      if (!campaign) {
        throw new Error(`Campaign ${command.campaignId} not found`);
      }

      const plannedPublication = await plannedPublicationRepository.findById(
        command.plannedPublicationId,
      );
      if (!plannedPublication || plannedPublication.campaignId !== campaign.id) {
        throw new Error(
          `Planned publication ${command.plannedPublicationId} not found in campaign ${command.campaignId}`,
        );
      }

      const scheduledPublication = await campaignPublishingPort.findScheduledPublication(
        plannedPublication.id,
      );
      if (scheduledPublication?.status === 'published') {
        throw new Error('Published publication cannot be rescheduled');
      }

      if (scheduledPublication?.status === 'publishing') {
        throw new Error('Publication is being delivered right now and cannot be rescheduled');
      }

      const dayOffset = toMoscowDayOffset(campaign.startDate, command.publishAt);
      const localTime = toMoscowLocalTimeToken(command.publishAt);
      plannedPublication.reschedule({
        scheduledFor: command.publishAt,
        dayOffset,
        localTime,
      });
      await plannedPublicationRepository.save(plannedPublication);

      if (plannedPublication.publishMode === 'manual_export') {
        await campaignPublishingPort.upsertExportPlan({
          articleId: campaign.sourceArticleId as never,
          projectId: campaign.projectId,
          plannedPublicationId: plannedPublication.id,
          channelId: plannedPublication.channel as never,
          targetLanguage: plannedPublication.language,
          publishAt: plannedPublication.scheduledFor,
        });
      } else {
        const adaptation = await resolveApprovedAdaptation(
          plannedPublication.id,
          campaignArtifactRepository,
          channelAdaptationRepository,
        );

        await campaignPublishingPort.upsertScheduledPublication({
          articleId: adaptation.articleId,
          adaptationId: adaptation.id,
          plannedPublicationId: plannedPublication.id,
          channelId: adaptation.channelId,
          displayName: adaptation.displayName,
          targetLanguage: plannedPublication.language,
          publishAt: plannedPublication.scheduledFor,
        });
      }

      return {
        plannedPublicationId: plannedPublication.id,
        publishAt: plannedPublication.scheduledFor,
        dayOffset: plannedPublication.dayOffset,
        localTime: plannedPublication.localTime,
      };
    });
  }
}
