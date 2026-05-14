import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import {
  channelAdaptations,
  type ChannelAdaptationRow,
  type NewChannelAdaptationRow,
} from '@marketing-service/database';
import {
  ChannelAdaptation,
  ChannelAdaptationRepository,
  type AdaptationId,
  type ArticleId,
  type ChannelAdaptationProps,
  type ChannelId,
} from '@marketing-service/editorial';
import { DRIZZLE, type DrizzleExecutor } from '../database.module.js';

@Injectable()
export class ChannelAdaptationDrizzleRepository extends ChannelAdaptationRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleExecutor) {
    super();
  }

  async findById(id: AdaptationId): Promise<ChannelAdaptation | null> {
    const row = await this.db.query.channelAdaptations.findFirst({
      where: eq(channelAdaptations.id, id),
    });

    return row ? ChannelAdaptation.rehydrate(this.toDomainProps(row)) : null;
  }

  async findByArticleId(articleId: ArticleId): Promise<ChannelAdaptation[]> {
    const rows = await this.db.query.channelAdaptations.findMany({
      where: eq(channelAdaptations.articleId, articleId),
    });

    return rows.map((row) => ChannelAdaptation.rehydrate(this.toDomainProps(row)));
  }

  async findByArticleIdAndChannelId(
    articleId: ArticleId,
    channelId: ChannelId,
  ): Promise<ChannelAdaptation | null> {
    const row = await this.db.query.channelAdaptations.findFirst({
      where: and(
        eq(channelAdaptations.articleId, articleId),
        eq(channelAdaptations.channelId, channelId),
      ),
    });

    return row ? ChannelAdaptation.rehydrate(this.toDomainProps(row)) : null;
  }

  async save(adaptation: ChannelAdaptation): Promise<void> {
    await this.db
      .insert(channelAdaptations)
      .values(this.toRow(adaptation))
      .onConflictDoUpdate({
        target: channelAdaptations.id,
        set: this.toRow(adaptation),
      });
  }

  private toDomainProps(row: ChannelAdaptationRow): ChannelAdaptationProps {
    return {
      id: row.id as AdaptationId,
      articleId: row.articleId as ArticleId,
      channelId: row.channelId as ChannelId,
      displayName: row.displayName,
      promptInstructions: row.promptInstructions,
      sourceLanguage: row.sourceLanguage,
      status: row.status as ChannelAdaptationProps['status'],
      adaptedContent: row.adaptedContent,
      selectedVersionId: row.selectedVersionId as ChannelAdaptationProps['selectedVersionId'],
      approvedVersionId: row.approvedVersionId as ChannelAdaptationProps['approvedVersionId'],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toRow(adaptation: ChannelAdaptation): NewChannelAdaptationRow {
    return {
      id: adaptation.id,
      articleId: adaptation.articleId,
      channelId: adaptation.channelId,
      displayName: adaptation.displayName,
      promptInstructions: adaptation.promptInstructions,
      sourceLanguage: adaptation.sourceLanguage,
      status: adaptation.status,
      adaptedContent: adaptation.adaptedContent,
      selectedVersionId: adaptation.selectedVersionId,
      approvedVersionId: adaptation.approvedVersionId,
      createdAt: adaptation.createdAt,
      updatedAt: adaptation.updatedAt,
    };
  }
}
