import {
  approvalItems,
  articleSourceVersions,
  articles,
  campaignArtifacts,
  campaigns,
  channelAdaptationVersions,
  channelAdaptations,
  plannedPublications,
  publicationPlans,
  publications,
  qualityCheckResults,
  translations,
  translationVersions,
  workflowRuns,
} from '@marketing-service/database';
import { CampaignDeletionPort, type CampaignId } from '@marketing-service/project-management';
import { Inject, Injectable } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../database.module.js';

@Injectable()
export class CampaignDeletionDrizzlePort extends CampaignDeletionPort {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {
    super();
  }

  async deleteCampaignGraph(campaignId: CampaignId): Promise<void> {
    await this.db.transaction(async (tx) => {
      const campaignRow = await tx.query.campaigns.findFirst({
        where: eq(campaigns.id, campaignId),
      });
      if (!campaignRow) {
        return;
      }

      const sourceArticleId = campaignRow.sourceArticleId;

      const plannedPublicationRows = await tx
        .select({ id: plannedPublications.id })
        .from(plannedPublications)
        .where(eq(plannedPublications.campaignId, campaignId));
      const plannedPublicationIds = plannedPublicationRows.map((row) => row.id);

      if (plannedPublicationIds.length) {
        await tx
          .delete(publications)
          .where(inArray(publications.plannedPublicationId, plannedPublicationIds));
        await tx
          .delete(publicationPlans)
          .where(inArray(publicationPlans.plannedPublicationId, plannedPublicationIds));
      }

      await tx.delete(approvalItems).where(eq(approvalItems.campaignId, campaignId));
      await tx.delete(qualityCheckResults).where(eq(qualityCheckResults.campaignId, campaignId));
      await tx.delete(workflowRuns).where(eq(workflowRuns.campaignId, campaignId));
      await tx.delete(campaignArtifacts).where(eq(campaignArtifacts.campaignId, campaignId));
      await tx.delete(plannedPublications).where(eq(plannedPublications.campaignId, campaignId));

      if (sourceArticleId) {
        const adaptationRows = await tx
          .select({ id: channelAdaptations.id })
          .from(channelAdaptations)
          .where(eq(channelAdaptations.articleId, sourceArticleId));
        const adaptationIds = adaptationRows.map((row) => row.id);

        const translationRows = adaptationIds.length
          ? await tx
              .select({ id: translations.id })
              .from(translations)
              .where(inArray(translations.adaptationId, adaptationIds))
          : [];
        const translationIds = translationRows.map((row) => row.id);

        await tx.delete(publications).where(eq(publications.articleId, sourceArticleId));
        await tx.delete(publicationPlans).where(eq(publicationPlans.articleId, sourceArticleId));
        await tx
          .delete(articleSourceVersions)
          .where(eq(articleSourceVersions.articleId, sourceArticleId));

        if (translationIds.length) {
          await tx
            .delete(translationVersions)
            .where(inArray(translationVersions.translationId, translationIds));
          await tx.delete(translations).where(inArray(translations.id, translationIds));
        }

        if (adaptationIds.length) {
          await tx
            .delete(channelAdaptationVersions)
            .where(inArray(channelAdaptationVersions.adaptationId, adaptationIds));
          await tx.delete(channelAdaptations).where(inArray(channelAdaptations.id, adaptationIds));
        }

        await tx.delete(articles).where(eq(articles.id, sourceArticleId));
      }

      await tx.delete(campaigns).where(eq(campaigns.id, campaignId));
    });
  }
}
