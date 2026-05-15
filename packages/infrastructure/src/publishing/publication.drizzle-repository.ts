import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, gte, lte } from 'drizzle-orm';
import {
  articles,
  publications,
  type NewPublicationRow,
  type PublicationRow,
} from '@marketing-service/database';
import {
  Publication,
  PublicationRepository,
  type PublicationId,
  type PublicationProps,
} from '@marketing-service/publishing';
import type { AdaptationId, ArticleId, ChannelId, ProjectId } from '@marketing-service/editorial';
import type { PlannedPublicationId } from '@marketing-service/project-management';
import { DRIZZLE, type DrizzleExecutor } from '../database.module.js';

@Injectable()
export class PublicationDrizzleRepository extends PublicationRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleExecutor) {
    super();
  }

  async findById(id: PublicationId): Promise<Publication | null> {
    const [row] = await this.db
      .select()
      .from(publications)
      .where(eq(publications.id, id))
      .limit(1);

    return row ? Publication.rehydrate(this.toDomainProps(row)) : null;
  }

  async findByArticleId(articleId: ArticleId): Promise<Publication[]> {
    const rows = await this.db
      .select()
      .from(publications)
      .where(eq(publications.articleId, articleId))
      .orderBy(asc(publications.publishAt), asc(publications.createdAt));

    return rows.map((row) => Publication.rehydrate(this.toDomainProps(row)));
  }

  async findByProjectId(
    projectId: ProjectId,
    options?: {
      from?: Date | null;
      to?: Date | null;
    },
  ): Promise<Publication[]> {
    const conditions = [eq(articles.projectId, projectId)];

    if (options?.from) {
      conditions.push(gte(publications.publishAt, options.from));
    }

    if (options?.to) {
      conditions.push(lte(publications.publishAt, options.to));
    }

    const rows = await this.db
      .select({ publication: publications })
      .from(publications)
      .innerJoin(articles, eq(publications.articleId, articles.id))
      .where(and(...conditions))
      .orderBy(asc(publications.publishAt), asc(publications.createdAt));

    return rows.map(({ publication }) => Publication.rehydrate(this.toDomainProps(publication)));
  }

  async findByPlannedPublicationId(
    plannedPublicationId: PlannedPublicationId,
  ): Promise<Publication | null> {
    const [row] = await this.db
      .select()
      .from(publications)
      .where(eq(publications.plannedPublicationId, plannedPublicationId))
      .limit(1);

    return row ? Publication.rehydrate(this.toDomainProps(row)) : null;
  }

  async findByLogicalKey(
    articleId: ArticleId,
    adaptationId: AdaptationId,
    channelId: ChannelId,
    targetLanguage: string,
  ): Promise<Publication | null> {
    const [row] = await this.db
      .select()
      .from(publications)
      .where(and(
        eq(publications.articleId, articleId),
        eq(publications.adaptationId, adaptationId),
        eq(publications.channelId, channelId),
        eq(publications.targetLanguage, targetLanguage.toLowerCase()),
      ))
      .limit(1);

    return row ? Publication.rehydrate(this.toDomainProps(row)) : null;
  }

  async findDue(now: Date, limit = 20): Promise<Publication[]> {
    const rows = await this.db
      .select()
      .from(publications)
      .where(and(
        eq(publications.status, 'scheduled'),
        lte(publications.publishAt, now),
      ))
      .orderBy(asc(publications.publishAt), asc(publications.createdAt))
      .limit(limit);

    return rows.map((row) => Publication.rehydrate(this.toDomainProps(row)));
  }

  async deleteById(id: PublicationId): Promise<void> {
    await this.db
      .delete(publications)
      .where(eq(publications.id, id));
  }

  async save(publication: Publication): Promise<void> {
    await this.db
      .insert(publications)
      .values(this.toRow(publication))
      .onConflictDoUpdate({
        target: publications.id,
        set: this.toRow(publication),
      });
  }

  private toDomainProps(row: PublicationRow): PublicationProps {
    return {
      id: row.id as PublicationId,
      articleId: row.articleId as ArticleId,
      adaptationId: row.adaptationId as AdaptationId,
      plannedPublicationId: row.plannedPublicationId as PublicationProps['plannedPublicationId'],
      channelId: row.channelId as ChannelId,
      displayName: row.displayName,
      targetLanguage: row.targetLanguage,
      publishAt: row.publishAt,
      status: row.status as PublicationProps['status'],
      telegramChatId: row.telegramChatId,
      telegramMessageId: row.telegramMessageId,
      publishedAt: row.publishedAt,
      errorMessage: row.errorMessage,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toRow(publication: Publication): NewPublicationRow {
    return {
      id: publication.id,
      articleId: publication.articleId,
      adaptationId: publication.adaptationId,
      plannedPublicationId: publication.plannedPublicationId,
      channelId: publication.channelId,
      displayName: publication.displayName,
      targetLanguage: publication.targetLanguage,
      publishAt: publication.publishAt,
      status: publication.status,
      telegramChatId: publication.telegramChatId,
      telegramMessageId: publication.telegramMessageId,
      publishedAt: publication.publishedAt,
      errorMessage: publication.errorMessage,
      createdAt: publication.createdAt,
      updatedAt: publication.updatedAt,
    };
  }
}
