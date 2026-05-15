import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, type ICommandHandler } from '@nestjs/cqrs';
import { Campaign } from '../../domain/campaign.aggregate.js';
import { PlannedPublication } from '../../domain/planned-publication.entity.js';
import { CampaignFlowTransactionPort } from '../../ports/campaign-flow-transaction.port.js';
import {
  CreateCampaignCommand,
  type CreateCampaignPlannedPublicationOverride,
} from './create-campaign.command.js';

export interface CreateCampaignResult {
  campaignId: string;
  plannedPublicationIds: string[];
}

function materializeScheduledFor(startDate: Date, dayOffset: number, localTime: string): Date {
  const [hoursToken, minutesToken] = localTime.split(':');
  const hours = Number.parseInt(hoursToken ?? '0', 10);
  const minutes = Number.parseInt(minutesToken ?? '0', 10);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    throw new Error(`Invalid local time "${localTime}" in campaign preset`);
  }

  const scheduledFor = new Date(startDate);
  scheduledFor.setUTCDate(scheduledFor.getUTCDate() + dayOffset);
  scheduledFor.setUTCHours(hours, minutes, 0, 0);

  return scheduledFor;
}

function assertDistinctPresetPublicationOverrides(
  overrides: CreateCampaignPlannedPublicationOverride[],
): void {
  const seen = new Set<string>();

  for (const override of overrides) {
    if (!override.presetPublicationId) {
      continue;
    }

    if (seen.has(override.presetPublicationId)) {
      throw new Error(
        `Duplicate planned publication override for preset publication ${override.presetPublicationId}`,
      );
    }

    seen.add(override.presetPublicationId);
  }
}

@CommandHandler(CreateCampaignCommand)
export class CreateCampaignHandler
  implements ICommandHandler<CreateCampaignCommand, CreateCampaignResult>
{
  constructor(
    @Inject(CampaignFlowTransactionPort)
    private readonly transaction: CampaignFlowTransactionPort,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateCampaignCommand): Promise<CreateCampaignResult> {
    let campaign!: Campaign;
    let plannedPublications: PlannedPublication[] = [];

    await this.transaction.run(
      async ({
        projectRepository,
        campaignPresetRepository,
        campaignRepository,
        plannedPublicationRepository,
      }) => {
        const project = await projectRepository.findById(command.projectId as never);
        if (!project) {
          throw new Error(`Project ${command.projectId} not found`);
        }

        const preset = await campaignPresetRepository.findById(command.presetId as never);
        if (!preset) {
          throw new Error(`Campaign preset ${command.presetId} not found`);
        }

        if (!preset.isActive) {
          throw new Error(`Campaign preset ${command.presetId} is inactive`);
        }

        const submittedPlan = command.plannedPublicationOverrides;
        const presetPublicationIds = new Set(
          preset.publications.map((publication) => publication.id),
        );

        if (submittedPlan) {
          if (submittedPlan.length === 0) {
            throw new Error('Campaign plan cannot be empty');
          }

          assertDistinctPresetPublicationOverrides(submittedPlan);

          for (const row of submittedPlan) {
            if (!row.presetPublicationId) {
              continue;
            }

            if (!presetPublicationIds.has(row.presetPublicationId as never)) {
              throw new Error(
                `Planned publication override ${row.presetPublicationId} does not belong to preset ${preset.id}`,
              );
            }
          }
        }

        const createdCampaign = Campaign.create({
          projectId: project.id,
          presetId: preset.id,
          name: command.name,
          startDate: command.startDate,
          sourceLanguage: command.sourceLanguage ?? preset.sourceLanguage,
          extraInstructions: command.extraInstructions ?? null,
        });
        campaign = createdCampaign;

        const campaignPlan =
          submittedPlan && submittedPlan.length > 0
            ? submittedPlan
            : [...preset.publications]
                .sort((left, right) => left.position - right.position)
                .map((publication) => ({
                  presetPublicationId: publication.id,
                  dayOffset: publication.dayOffset,
                  localTime: publication.localTime,
                  channel: publication.channel,
                  language: publication.language,
                  publicationType: publication.publicationType,
                  style: publication.style,
                }));

        plannedPublications = campaignPlan.map((publication) =>
          PlannedPublication.create({
            campaignId: createdCampaign.id,
            presetPublicationId: (publication.presetPublicationId ?? null) as never,
            dayOffset: publication.dayOffset,
            localTime: publication.localTime,
            scheduledFor: materializeScheduledFor(
              createdCampaign.startDate,
              publication.dayOffset,
              publication.localTime,
            ),
            channel: publication.channel,
            language: publication.language,
            publicationType: publication.publicationType,
            style: publication.style,
            publishMode: 'auto_publish',
          }),
        );

        await campaignRepository.save(createdCampaign);
        await plannedPublicationRepository.saveMany(plannedPublications);
      },
    );

    this.eventBus.publishAll(campaign.pullEvents());

    return {
      campaignId: campaign.id,
      plannedPublicationIds: plannedPublications.map((plannedPublication) => plannedPublication.id),
    };
  }
}
