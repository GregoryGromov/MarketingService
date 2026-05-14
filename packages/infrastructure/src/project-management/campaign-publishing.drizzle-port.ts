import type { DrizzleExecutor } from '../database.module.js';
import { PublicationDrizzleRepository } from '../publishing/publication.drizzle-repository.js';
import { PublicationPlanDrizzleRepository } from '../publishing/publication-plan.drizzle-repository.js';
import {
  CampaignPublishingPort,
  type CampaignExportPlanRecord,
  type CampaignScheduledPublicationRecord,
  type UpsertCampaignExportPlanParams,
  type UpsertCampaignScheduledPublicationParams,
} from '@marketing-service/project-management';
import { Publication, PublicationPlan } from '@marketing-service/publishing';

function mapPublication(publication: Publication): CampaignScheduledPublicationRecord {
  return {
    id: publication.id,
    plannedPublicationId: publication.plannedPublicationId as CampaignScheduledPublicationRecord['plannedPublicationId'],
    status: publication.status,
    publishAt: publication.publishAt,
  };
}

function mapPublicationPlan(plan: PublicationPlan): CampaignExportPlanRecord {
  return {
    id: plan.id,
    plannedPublicationId: plan.plannedPublicationId as CampaignExportPlanRecord['plannedPublicationId'],
    publishAt: plan.publishAt,
  };
}

export class CampaignPublishingDrizzlePort extends CampaignPublishingPort {
  private readonly publicationRepository: PublicationDrizzleRepository;
  private readonly publicationPlanRepository: PublicationPlanDrizzleRepository;

  constructor(db: DrizzleExecutor) {
    super();
    this.publicationRepository = new PublicationDrizzleRepository(db);
    this.publicationPlanRepository = new PublicationPlanDrizzleRepository(db);
  }

  async upsertScheduledPublication(
    params: UpsertCampaignScheduledPublicationParams,
  ): Promise<CampaignScheduledPublicationRecord> {
    const existing = await this.publicationRepository.findByPlannedPublicationId(
      params.plannedPublicationId,
    );

    if (existing) {
      if (
        existing.articleId !== params.articleId ||
        existing.adaptationId !== params.adaptationId ||
        existing.channelId !== params.channelId ||
        existing.targetLanguage !== params.targetLanguage.toLowerCase()
      ) {
        throw new Error(
          `Planned publication ${params.plannedPublicationId} is already linked to a different publication record`,
        );
      }

      existing.reschedule(params.publishAt);
      await this.publicationRepository.save(existing);
      return mapPublication(existing);
    }

    const publication = Publication.create({
      articleId: params.articleId,
      adaptationId: params.adaptationId,
      plannedPublicationId: params.plannedPublicationId,
      channelId: params.channelId,
      displayName: params.displayName,
      targetLanguage: params.targetLanguage,
      publishAt: params.publishAt,
    });

    await this.publicationRepository.save(publication);
    return mapPublication(publication);
  }

  async upsertExportPlan(
    params: UpsertCampaignExportPlanParams,
  ): Promise<CampaignExportPlanRecord> {
    const existing = await this.publicationPlanRepository.findByPlannedPublicationId(
      params.plannedPublicationId,
    );

    if (existing) {
      if (
        existing.articleId !== params.articleId ||
        existing.projectId !== params.projectId ||
        existing.channelId !== params.channelId ||
        existing.targetLanguage !== params.targetLanguage.toLowerCase()
      ) {
        throw new Error(
          `Planned publication ${params.plannedPublicationId} is already linked to a different export plan`,
        );
      }

      existing.reschedule(params.publishAt);
      await this.publicationPlanRepository.save(existing);
      return mapPublicationPlan(existing);
    }

    const plan = PublicationPlan.create({
      articleId: params.articleId,
      projectId: params.projectId,
      plannedPublicationId: params.plannedPublicationId,
      channelId: params.channelId,
      targetLanguage: params.targetLanguage,
      publishAt: params.publishAt,
    });

    await this.publicationPlanRepository.save(plan);
    return mapPublicationPlan(plan);
  }
}
