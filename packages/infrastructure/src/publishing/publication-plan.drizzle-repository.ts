import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, gte, lte } from 'drizzle-orm';
import {
  publicationPlans,
  type NewPublicationPlanRow,
  type PublicationPlanRow,
} from '@marketing-service/database';
import {
  PublicationPlan,
  PublicationPlanRepository,
  type PublicationPlanId,
  type PublicationPlanProps,
} from '@marketing-service/publishing';
import type { ArticleId, ChannelId, ProjectId } from '@marketing-service/editorial';
import { DRIZZLE, type DrizzleDB } from '../database.module.js';

@Injectable()
export class PublicationPlanDrizzleRepository extends PublicationPlanRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {
    super();
  }

  async findById(id: PublicationPlanId): Promise<PublicationPlan | null> {
    const [row] = await this.db
      .select()
      .from(publicationPlans)
      .where(eq(publicationPlans.id, id))
      .limit(1);

    return row ? PublicationPlan.rehydrate(this.toDomainProps(row)) : null;
  }

  async findByArticleId(articleId: ArticleId): Promise<PublicationPlan[]> {
    const rows = await this.db
      .select()
      .from(publicationPlans)
      .where(eq(publicationPlans.articleId, articleId))
      .orderBy(asc(publicationPlans.publishAt), asc(publicationPlans.createdAt));

    return rows.map((row) => PublicationPlan.rehydrate(this.toDomainProps(row)));
  }

  async findByProjectId(
    projectId: ProjectId,
    range?: { from?: Date | null; to?: Date | null },
  ): Promise<PublicationPlan[]> {
    const filters = [eq(publicationPlans.projectId, projectId)];

    if (range?.from) {
      filters.push(gte(publicationPlans.publishAt, range.from));
    }

    if (range?.to) {
      filters.push(lte(publicationPlans.publishAt, range.to));
    }

    const rows = await this.db
      .select()
      .from(publicationPlans)
      .where(and(...filters))
      .orderBy(asc(publicationPlans.publishAt), asc(publicationPlans.createdAt));

    return rows.map((row) => PublicationPlan.rehydrate(this.toDomainProps(row)));
  }

  async findByLogicalKey(
    articleId: ArticleId,
    channelId: ChannelId,
    targetLanguage: string,
    publishAt: Date,
  ): Promise<PublicationPlan | null> {
    const [row] = await this.db
      .select()
      .from(publicationPlans)
      .where(and(
        eq(publicationPlans.articleId, articleId),
        eq(publicationPlans.channelId, channelId),
        eq(publicationPlans.targetLanguage, targetLanguage.toLowerCase()),
        eq(publicationPlans.publishAt, publishAt),
      ))
      .limit(1);

    return row ? PublicationPlan.rehydrate(this.toDomainProps(row)) : null;
  }

  async save(plan: PublicationPlan): Promise<void> {
    await this.db
      .insert(publicationPlans)
      .values(this.toRow(plan))
      .onConflictDoUpdate({
        target: publicationPlans.id,
        set: this.toRow(plan),
      });
  }

  async deleteById(id: PublicationPlanId): Promise<void> {
    await this.db
      .delete(publicationPlans)
      .where(eq(publicationPlans.id, id));
  }

  private toDomainProps(row: PublicationPlanRow): PublicationPlanProps {
    return {
      id: row.id as PublicationPlanId,
      articleId: row.articleId as ArticleId,
      projectId: row.projectId as ProjectId,
      channelId: row.channelId as ChannelId,
      targetLanguage: row.targetLanguage,
      publishAt: row.publishAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toRow(plan: PublicationPlan): NewPublicationPlanRow {
    return {
      id: plan.id,
      articleId: plan.articleId,
      projectId: plan.projectId,
      channelId: plan.channelId,
      targetLanguage: plan.targetLanguage,
      publishAt: plan.publishAt,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  }
}
