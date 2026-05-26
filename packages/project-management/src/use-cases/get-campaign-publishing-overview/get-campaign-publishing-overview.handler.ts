import { Inject } from '@nestjs/common';
import {
  ArticleRepository,
  ChannelAdaptationRepository,
  TranslationRepository,
} from '@marketing-service/editorial';
import { resolvePublicationExternalUrl } from '@marketing-service/shared';
import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import { existsSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { CampaignArtifactRepository } from '../../domain/campaign-artifact.repository.js';
import { CampaignRepository } from '../../domain/campaign.repository.js';
import { PlannedPublicationRepository } from '../../domain/planned-publication.repository.js';
import { CampaignPublishingPort } from '../../ports/campaign-publishing.port.js';
import { GetCampaignPublishingOverviewQuery } from './get-campaign-publishing-overview.query.js';

const STAGE_1_BASE_ADAPTATION_ROLE = 'stage_1_base_adaptation';

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
  articleId: string | null;
  adaptationId: string | null;
  translationId: string | null;
  artifactType: 'adaptation' | 'translation' | null;
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
  externalUrl: string | null;
  imageUrl: string | null;
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

function createCampaignMediaUrl(filePath: string): string {
  return `/campaign-media/${encodeURIComponent(basename(dirname(filePath)))}/${encodeURIComponent(
    basename(filePath),
  )}`;
}

function resolvePublicationImageUrl(defaultCoverUrl: string | null | undefined, channelId: string): string | null {
  const originalPath = defaultCoverUrl?.trim();
  if (!originalPath) {
    return null;
  }

  const variantPath = join(dirname(originalPath), `${channelId}.jpg`);
  if (existsSync(variantPath)) {
    return createCampaignMediaUrl(variantPath);
  }

  if (existsSync(originalPath)) {
    return createCampaignMediaUrl(originalPath);
  }

  return null;
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
    @Inject(CampaignArtifactRepository)
    private readonly campaignArtifactRepository: CampaignArtifactRepository,
    @Inject(ChannelAdaptationRepository)
    private readonly channelAdaptationRepository: ChannelAdaptationRepository,
    @Inject(TranslationRepository)
    private readonly translationRepository: TranslationRepository,
    @Inject(CampaignPublishingPort)
    private readonly campaignPublishingPort: CampaignPublishingPort,
    @Inject(ArticleRepository)
    private readonly articleRepository: ArticleRepository,
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
    const imageUrlByArticleId = new Map<string, string | null>();

    const getImageUrl = async (articleId: string | null, channelId: string): Promise<string | null> => {
      if (!articleId) {
        return null;
      }

      const cacheKey = `${articleId}:${channelId}`;
      if (imageUrlByArticleId.has(cacheKey)) {
        return imageUrlByArticleId.get(cacheKey) ?? null;
      }

      const article = await this.articleRepository.findById(articleId as never);
      const imageUrl = resolvePublicationImageUrl(article?.defaultCoverUrl ?? null, channelId);
      imageUrlByArticleId.set(cacheKey, imageUrl);
      return imageUrl;
    };

    for (const plannedPublication of plannedPublications) {
      const [scheduledPublication, exportPlan, artifacts] = await Promise.all([
        this.campaignPublishingPort.findScheduledPublication(plannedPublication.id),
        this.campaignPublishingPort.findExportPlan(plannedPublication.id),
        this.campaignArtifactRepository.findByPlannedPublicationId(plannedPublication.id),
      ]);

      const adaptationArtifact = artifacts.find(
        (artifact) =>
          artifact.artifactType === 'adaptation' &&
          artifact.role === STAGE_1_BASE_ADAPTATION_ROLE,
      ) ?? null;
      const translationArtifact = artifacts.find(
        (artifact) => artifact.artifactType === 'translation',
      ) ?? null;

      const adaptation = adaptationArtifact
        ? await this.channelAdaptationRepository.findById(adaptationArtifact.artifactId as never)
        : null;
      const translation = translationArtifact
        ? await this.translationRepository.findById(translationArtifact.artifactId as never)
        : null;
      const articleId = adaptation?.articleId ?? null;

      const item: CampaignPublishingOverviewItemResult = {
        plannedPublicationId: plannedPublication.id,
        articleId,
        adaptationId: adaptation?.id ?? null,
        translationId: translation?.id ?? null,
        artifactType: translation ? 'translation' : adaptation ? 'adaptation' : null,
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
        externalUrl: resolvePublicationExternalUrl({
          channelId: plannedPublication.channel,
          externalAccountRef: scheduledPublication?.externalAccountRef ?? null,
          externalPostId: scheduledPublication?.externalPostId ?? null,
        }),
        imageUrl: await getImageUrl(articleId, plannedPublication.channel),
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
