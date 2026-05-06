import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import {
  translations,
  type NewTranslationRow,
  type TranslationRow,
} from '@marketing-service/database';
import {
  Translation,
  TranslationRepository,
  type AdaptationId,
  type TranslationId,
  type TranslationProps,
} from '@marketing-service/editorial';
import { DRIZZLE, type DrizzleDB } from '../database.module.js';

@Injectable()
export class TranslationDrizzleRepository extends TranslationRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {
    super();
  }

  async findById(id: TranslationId): Promise<Translation | null> {
    const row = await this.db.query.translations.findFirst({
      where: eq(translations.id, id),
    });

    return row ? Translation.rehydrate(this.toDomainProps(row)) : null;
  }

  async findByAdaptationId(adaptationId: AdaptationId): Promise<Translation[]> {
    const rows = await this.db.query.translations.findMany({
      where: eq(translations.adaptationId, adaptationId),
      orderBy: [asc(translations.createdAt)],
    });

    return rows.map((row) => Translation.rehydrate(this.toDomainProps(row)));
  }

  async findByAdaptationIdAndTargetLanguage(
    adaptationId: AdaptationId,
    targetLanguage: string,
  ): Promise<Translation | null> {
    const row = await this.db.query.translations.findFirst({
      where: and(
        eq(translations.adaptationId, adaptationId),
        eq(translations.targetLanguage, targetLanguage),
      ),
    });

    return row ? Translation.rehydrate(this.toDomainProps(row)) : null;
  }

  async save(translation: Translation): Promise<void> {
    await this.db
      .insert(translations)
      .values(this.toRow(translation))
      .onConflictDoUpdate({
        target: translations.id,
        set: this.toRow(translation),
      });
  }

  private toDomainProps(row: TranslationRow): TranslationProps {
    return {
      id: row.id as TranslationId,
      adaptationId: row.adaptationId as AdaptationId,
      sourceLanguage: row.sourceLanguage,
      targetLanguage: row.targetLanguage,
      status: row.status as TranslationProps['status'],
      translatedContent: row.translatedContent,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toRow(translation: Translation): NewTranslationRow {
    return {
      id: translation.id,
      adaptationId: translation.adaptationId,
      sourceLanguage: translation.sourceLanguage,
      targetLanguage: translation.targetLanguage,
      status: translation.status,
      translatedContent: translation.translatedContent,
      createdAt: translation.createdAt,
      updatedAt: translation.updatedAt,
    };
  }
}
