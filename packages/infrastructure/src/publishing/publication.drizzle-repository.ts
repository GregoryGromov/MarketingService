import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, lte } from 'drizzle-orm';
import {
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
import type { AdaptationId, ArticleId, ChannelId } from '@marketing-service/editorial';
import { DRIZZLE, type DrizzleDB } from '../database.module.js';

@Injectable()
export class PublicationDrizzleRepository extends PublicationRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {
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
