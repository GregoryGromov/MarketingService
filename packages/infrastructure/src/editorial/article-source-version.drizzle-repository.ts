import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, notInArray } from 'drizzle-orm';
import {
  articleSourceVersions,
  type ArticleSourceVersionRow,
  type NewArticleSourceVersionRow,
} from '@marketing-service/database';
import {
  ArticleSourceVersion,
  ArticleSourceVersionRepository,
  type ArticleId,
  type ArticleSourceVersionId,
  type ArticleSourceVersionKind,
  type ArticleSourceVersionProps,
} from '@marketing-service/editorial';
import { DRIZZLE, type DrizzleExecutor } from '../database.module.js';

@Injectable()
export class ArticleSourceVersionDrizzleRepository extends ArticleSourceVersionRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleExecutor) {
    super();
  }

  async findById(id: ArticleSourceVersionId): Promise<ArticleSourceVersion | null> {
    const row = await this.db.query.articleSourceVersions.findFirst({
      where: eq(articleSourceVersions.id, id),
    });

    return row ? ArticleSourceVersion.rehydrate(this.toDomainProps(row)) : null;
  }

  async findByArticleId(articleId: ArticleId): Promise<ArticleSourceVersion[]> {
    const rows = await this.db.query.articleSourceVersions.findMany({
      where: eq(articleSourceVersions.articleId, articleId),
      orderBy: [asc(articleSourceVersions.createdAt)],
    });

    return rows.map((row) => ArticleSourceVersion.rehydrate(this.toDomainProps(row)));
  }

  async save(version: ArticleSourceVersion): Promise<void> {
    await this.db
      .insert(articleSourceVersions)
      .values(this.toRow(version))
      .onConflictDoUpdate({
        target: articleSourceVersions.id,
        set: this.toRow(version),
      });
  }

  async deleteByArticleIdExcept(
    articleId: ArticleId,
    keepIds: ArticleSourceVersionId[],
  ): Promise<void> {
    if (keepIds.length === 0) {
      await this.db.delete(articleSourceVersions).where(eq(articleSourceVersions.articleId, articleId));
      return;
    }

    await this.db
      .delete(articleSourceVersions)
      .where(and(eq(articleSourceVersions.articleId, articleId), notInArray(articleSourceVersions.id, keepIds)));
  }

  private toDomainProps(row: ArticleSourceVersionRow): ArticleSourceVersionProps {
    return {
      id: row.id as ArticleSourceVersionId,
      articleId: row.articleId as ArticleId,
      content: row.content,
      language: row.language,
      kind: row.kind as ArticleSourceVersionKind,
      sourceVersionId: row.sourceVersionId as ArticleSourceVersionId | null,
      meta: row.meta as Record<string, unknown> | null,
      createdAt: row.createdAt,
    };
  }

  private toRow(version: ArticleSourceVersion): NewArticleSourceVersionRow {
    return {
      id: version.id,
      articleId: version.articleId,
      content: version.content,
      language: version.language,
      kind: version.kind,
      sourceVersionId: version.sourceVersionId,
      meta: version.meta,
      createdAt: version.createdAt,
    };
  }
}
