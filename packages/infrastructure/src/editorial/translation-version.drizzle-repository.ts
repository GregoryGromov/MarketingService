import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, notInArray } from 'drizzle-orm';
import {
  translationVersions,
  type NewTranslationVersionRow,
  type TranslationVersionRow,
} from '@marketing-service/database';
import {
  TranslationVersion,
  TranslationVersionRepository,
  type TranslationId,
  type TranslationVersionId,
  type TranslationVersionKind,
  type TranslationVersionProps,
} from '@marketing-service/editorial';
import { DRIZZLE, type DrizzleExecutor } from '../database.module.js';

@Injectable()
export class TranslationVersionDrizzleRepository extends TranslationVersionRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleExecutor) {
    super();
  }

  async findById(id: TranslationVersionId): Promise<TranslationVersion | null> {
    const row = await this.db.query.translationVersions.findFirst({
      where: eq(translationVersions.id, id),
    });

    return row ? TranslationVersion.rehydrate(this.toDomainProps(row)) : null;
  }

  async findByTranslationId(translationId: TranslationId): Promise<TranslationVersion[]> {
    const rows = await this.db.query.translationVersions.findMany({
      where: eq(translationVersions.translationId, translationId),
      orderBy: [asc(translationVersions.createdAt)],
    });

    return rows.map((row) => TranslationVersion.rehydrate(this.toDomainProps(row)));
  }

  async save(version: TranslationVersion): Promise<void> {
    await this.db
      .insert(translationVersions)
      .values(this.toRow(version))
      .onConflictDoUpdate({
        target: translationVersions.id,
        set: this.toRow(version),
      });
  }

  async deleteByTranslationIdExcept(
    translationId: TranslationId,
    keepIds: TranslationVersionId[],
  ): Promise<void> {
    if (keepIds.length === 0) {
      await this.db
        .delete(translationVersions)
        .where(eq(translationVersions.translationId, translationId));
      return;
    }

    await this.db
      .delete(translationVersions)
      .where(
        and(
          eq(translationVersions.translationId, translationId),
          notInArray(translationVersions.id, keepIds),
        ),
      );
  }

  private toDomainProps(row: TranslationVersionRow): TranslationVersionProps {
    return {
      id: row.id as TranslationVersionId,
      translationId: row.translationId as TranslationId,
      content: row.content,
      kind: row.kind as TranslationVersionKind,
      sourceVersionId: row.sourceVersionId as TranslationVersionProps['sourceVersionId'],
      meta: (row.meta as Record<string, unknown> | null) ?? null,
      createdAt: row.createdAt,
    };
  }

  private toRow(version: TranslationVersion): NewTranslationVersionRow {
    return {
      id: version.id,
      translationId: version.translationId,
      content: version.content,
      kind: version.kind,
      sourceVersionId: version.sourceVersionId,
      meta: version.meta,
      createdAt: version.createdAt,
    };
  }
}
