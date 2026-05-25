import { Inject, Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { articles, type ArticleRow, type NewArticleRow } from '@marketing-service/database';
import {
  Article,
  ArticleRepository,
  type ArticleId,
  type ArticleProps,
} from '@marketing-service/editorial';
import { DRIZZLE, type DrizzleExecutor } from '../database.module.js';

@Injectable()
export class ArticleDrizzleRepository extends ArticleRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleExecutor) {
    super();
  }

  async findById(id: ArticleId): Promise<Article | null> {
    const row = await this.db.query.articles.findFirst({
      where: eq(articles.id, id),
    });

    return row ? Article.rehydrate(this.toDomainProps(row)) : null;
  }

  async findByProjectId(projectId: ArticleProps['projectId']): Promise<Article[]> {
    const rows = await this.db.query.articles.findMany({
      where: eq(articles.projectId, projectId),
      orderBy: [desc(articles.updatedAt)],
    });

    return rows.map((row) => Article.rehydrate(this.toDomainProps(row)));
  }

  async save(article: Article): Promise<void> {
    await this.db
      .insert(articles)
      .values(this.toRow(article))
      .onConflictDoUpdate({
        target: articles.id,
        set: this.toRow(article),
      });
  }

  private toDomainProps(row: ArticleRow): ArticleProps {
    return {
      id: row.id as ArticleId,
      projectId: row.projectId as ArticleProps['projectId'],
      status: row.status as ArticleProps['status'],
      paused: row.paused,
      defaultCoverUrl: row.defaultCoverUrl,
      releasePlanSnapshot: row.releasePlanSnapshot as ArticleProps['releasePlanSnapshot'],
      original: {
        content: row.originalContent,
        language: row.originalLanguage,
        uploadedAt: row.originalUploadedAt,
      },
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toRow(article: Article): NewArticleRow {
    return {
      id: article.id,
      projectId: article.projectId,
      status: article.status,
      paused: article.paused,
      defaultCoverUrl: article.defaultCoverUrl,
      releasePlanSnapshot: article.releasePlanSnapshot,
      originalContent: article.original.content,
      originalLanguage: article.original.language,
      originalUploadedAt: article.original.uploadedAt,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
    };
  }
}
