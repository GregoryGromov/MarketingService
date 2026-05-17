import {
  approvalItems,
  articleSourceVersions,
  articles,
  campaignArtifacts,
  campaigns,
  channelAdaptationVersions,
  channelAdaptations,
  projectMarkerPlacements,
  projectMarkers,
  projects,
  publicationPlans,
  publications,
  plannedPublications,
  qualityCheckResults,
  translations,
  translationVersions,
  workflowRuns,
} from '@marketing-service/database';
import { type ProjectId, ProjectDeletionPort } from '@marketing-service/project-management';
import { Inject, Injectable } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../database.module.js';

@Injectable()
export class ProjectDeletionDrizzlePort extends ProjectDeletionPort {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {
    super();
  }

  async deleteProjectGraph(projectId: ProjectId): Promise<void> {
    await this.db.transaction(async (tx) => {
      const articleRows = await tx
        .select({ id: articles.id })
        .from(articles)
        .where(eq(articles.projectId, projectId));
      const articleIds = articleRows.map((row) => row.id);

      const adaptationRows = articleIds.length
        ? await tx
            .select({ id: channelAdaptations.id })
            .from(channelAdaptations)
            .where(inArray(channelAdaptations.articleId, articleIds))
        : [];
      const adaptationIds = adaptationRows.map((row) => row.id);

      const translationRows = adaptationIds.length
        ? await tx
            .select({ id: translations.id })
            .from(translations)
            .where(inArray(translations.adaptationId, adaptationIds))
        : [];
      const translationIds = translationRows.map((row) => row.id);

      const campaignRows = await tx
        .select({ id: campaigns.id })
        .from(campaigns)
        .where(eq(campaigns.projectId, projectId));
      const campaignIds = campaignRows.map((row) => row.id);

      if (articleIds.length) {
        await tx.delete(publications).where(inArray(publications.articleId, articleIds));
        await tx.delete(articleSourceVersions).where(inArray(articleSourceVersions.articleId, articleIds));
      }

      await tx.delete(publicationPlans).where(eq(publicationPlans.projectId, projectId));

      if (translationIds.length) {
        await tx
          .delete(translationVersions)
          .where(inArray(translationVersions.translationId, translationIds));
      }

      if (adaptationIds.length) {
        await tx.delete(translations).where(inArray(translations.adaptationId, adaptationIds));
        await tx
          .delete(channelAdaptationVersions)
          .where(inArray(channelAdaptationVersions.adaptationId, adaptationIds));
        await tx
          .delete(channelAdaptations)
          .where(inArray(channelAdaptations.articleId, articleIds));
      }

      if (campaignIds.length) {
        await tx.delete(campaignArtifacts).where(inArray(campaignArtifacts.campaignId, campaignIds));
        await tx
          .delete(qualityCheckResults)
          .where(inArray(qualityCheckResults.campaignId, campaignIds));
        await tx.delete(workflowRuns).where(inArray(workflowRuns.campaignId, campaignIds));
        await tx
          .delete(plannedPublications)
          .where(inArray(plannedPublications.campaignId, campaignIds));
        await tx.delete(campaigns).where(inArray(campaigns.id, campaignIds));
      }

      await tx.delete(approvalItems).where(eq(approvalItems.projectId, projectId));
      await tx.delete(projectMarkerPlacements).where(eq(projectMarkerPlacements.projectId, projectId));
      await tx.delete(projectMarkers).where(eq(projectMarkers.projectId, projectId));

      if (articleIds.length) {
        await tx.delete(articles).where(inArray(articles.id, articleIds));
      }

      await tx.delete(projects).where(eq(projects.id, projectId));
    });
  }
}
