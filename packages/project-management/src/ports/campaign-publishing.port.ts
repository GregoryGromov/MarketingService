import type {
  AdaptationId,
  ArticleId,
  ChannelId,
  ProjectId,
} from '@marketing-service/editorial';
import type { PlannedPublicationId } from '../domain/planned-publication.entity.js';

export interface CampaignScheduledPublicationRecord {
  id: string;
  plannedPublicationId: PlannedPublicationId;
  status: 'scheduled' | 'publishing' | 'published' | 'failed';
  publishAt: Date;
}

export interface CampaignExportPlanRecord {
  id: string;
  plannedPublicationId: PlannedPublicationId;
  publishAt: Date;
}

export interface UpsertCampaignScheduledPublicationParams {
  articleId: ArticleId;
  adaptationId: AdaptationId;
  plannedPublicationId: PlannedPublicationId;
  channelId: ChannelId;
  displayName: string;
  targetLanguage: string;
  publishAt: Date;
}

export interface UpsertCampaignExportPlanParams {
  articleId: ArticleId;
  projectId: ProjectId;
  plannedPublicationId: PlannedPublicationId;
  channelId: ChannelId;
  targetLanguage: string;
  publishAt: Date;
}

export abstract class CampaignPublishingPort {
  abstract upsertScheduledPublication(
    params: UpsertCampaignScheduledPublicationParams,
  ): Promise<CampaignScheduledPublicationRecord>;

  abstract upsertExportPlan(
    params: UpsertCampaignExportPlanParams,
  ): Promise<CampaignExportPlanRecord>;
}
