import { Inject } from '@nestjs/common';
import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import { CampaignRepository } from '../../domain/campaign.repository.js';
import { PlannedPublicationRepository } from '../../domain/planned-publication.repository.js';
import { CampaignPublishingPort } from '../../ports/campaign-publishing.port.js';
import { GetCampaignPublishingOverviewQuery } from './get-campaign-publishing-overview.query.js';

export interface CampaignPublishingOverviewMetrics {
  total: number;
  ready: number;
  scheduled: number;
  publishing: number;
  published: number;
  exported: number;
  failed: number;
}

export interface CampaignPublishingOverviewItemResult {
  plannedPublicationId: string;
  channel: string;
  language: string;
  publishMode: string | null;
  plannedStatus: string;
  scheduledFor: Date;
  publicationId: string | null;
  publicationStatus: string | null;
  exportPlanId: string | null;
  externalAccountRef: string | null;
  externalPostId: string | null;
  publishedAt: Date | null;
  errorMessage: string | null;
}

export interface GetCampaignPublishingOverviewResult {
  campaignId: string;
  campaignStatus: string;
  metrics: CampaignPublishingOverviewMetrics;
  items: CampaignPublishingOverviewItemResult[];
}

function createEmptyMetrics(): CampaignPublishingOverviewMetrics {
  return {
    total: 0,
    ready: 0,
    scheduled: 0,
    publishing: 0,
    published: 0,
    exported: 0,
    failed: 0,
  };
}

function countPublication(metrics: CampaignPublishingOverviewMetrics, item: CampaignPublishingOverviewItemResult): void {
  metrics.total += 1;

  if (item.plannedStatus === 'ready') {
    metrics.ready += 1;
    return;
  }

  if (item.plannedStatus === 'exported') {
    metrics.exported += 1;
    return;
  }

  if (item.plannedStatus === 'published') {
    metrics.published += 1;
    return;
  }

  if (item.plannedStatus === 'failed' || item.publicationStatus === 'failed') {
    metrics.failed += 1;
    return;
  }

  if (item.publicationStatus === 'publishing') {
    metrics.publishing += 1;
    return;
  }

  if (
    item.plannedStatus === 'publication_scheduled' ||
    item.publicationStatus === 'scheduled'
  ) {
    metrics.scheduled += 1;
    return;
  }
}

@QueryHandler(GetCampaignPublishingOverviewQuery)
export class GetCampaignPublishingOverviewHandler
  implements
    IQueryHandler<
      GetCampaignPublishingOverviewQuery,
      GetCampaignPublishingOverviewResult | null
    >
{
  constructor(
    @Inject(CampaignRepository)
    private readonly campaignRepository: CampaignRepository,
    @Inject(PlannedPublicationRepository)
    private readonly plannedPublicationRepository: PlannedPublicationRepository,
    @Inject(CampaignPublishingPort)
    private readonly campaignPublishingPort: CampaignPublishingPort,
  ) {}

  async execute(
    query: GetCampaignPublishingOverviewQuery,
  ): Promise<GetCampaignPublishingOverviewResult | null> {
    const campaign = await this.campaignRepository.findById(query.campaignId as never);
    if (!campaign) {
      return null;
    }

    const plannedPublications = (
      await this.plannedPublicationRepository.findByCampaignId(campaign.id)
    ).sort((left, right) => left.scheduledFor.getTime() - right.scheduledFor.getTime());

    const items: CampaignPublishingOverviewItemResult[] = [];
    const metrics = createEmptyMetrics();

    for (const plannedPublication of plannedPublications) {
      const [scheduledPublication, exportPlan] = await Promise.all([
        this.campaignPublishingPort.findScheduledPublication(plannedPublication.id),
        this.campaignPublishingPort.findExportPlan(plannedPublication.id),
      ]);

      const item: CampaignPublishingOverviewItemResult = {
        plannedPublicationId: plannedPublication.id,
        channel: plannedPublication.channel,
        language: plannedPublication.language,
        publishMode: plannedPublication.publishMode,
        plannedStatus: plannedPublication.status,
        scheduledFor:
          scheduledPublication?.publishAt ??
          exportPlan?.publishAt ??
          plannedPublication.scheduledFor,
        publicationId: scheduledPublication?.id ?? null,
        publicationStatus: scheduledPublication?.status ?? null,
        exportPlanId: exportPlan?.id ?? null,
        externalAccountRef: scheduledPublication?.externalAccountRef ?? null,
        externalPostId: scheduledPublication?.externalPostId ?? null,
        publishedAt: scheduledPublication?.publishedAt ?? null,
        errorMessage: scheduledPublication?.errorMessage ?? null,
      };

      countPublication(metrics, item);
      items.push(item);
    }

    return {
      campaignId: campaign.id,
      campaignStatus: campaign.status,
      metrics,
      items,
    };
  }
}
