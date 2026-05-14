import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import {
  campaignPresetPublications,
  campaignPresets,
  type CampaignPresetPublicationRow,
  type CampaignPresetRow,
  type NewCampaignPresetPublicationRow,
  type NewCampaignPresetRow,
} from '@marketing-service/database';
import {
  CampaignPreset,
  CampaignPresetPublication,
  CampaignPresetRepository,
  type CampaignPresetId,
  type CampaignPresetProps,
  type CampaignPresetPublicationId,
  type CampaignPresetPublicationProps,
} from '@marketing-service/project-management';
import { DRIZZLE, type DrizzleExecutor } from '../database.module.js';

@Injectable()
export class CampaignPresetDrizzleRepository extends CampaignPresetRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleExecutor) {
    super();
  }

  async findById(id: CampaignPresetId): Promise<CampaignPreset | null> {
    const row = await this.db.query.campaignPresets.findFirst({
      where: eq(campaignPresets.id, id),
    });

    if (!row) {
      return null;
    }

    const publications = await this.db.query.campaignPresetPublications.findMany({
      where: eq(campaignPresetPublications.presetId, id),
      orderBy: [asc(campaignPresetPublications.position), asc(campaignPresetPublications.createdAt)],
    });

    return CampaignPreset.rehydrate(this.toDomainProps(row, publications));
  }

  async findAll(): Promise<CampaignPreset[]> {
    const rows = await this.db.query.campaignPresets.findMany({
      orderBy: [desc(campaignPresets.updatedAt), asc(campaignPresets.createdAt)],
    });

    return this.loadPresets(rows);
  }

  async findActiveSystemPresets(): Promise<CampaignPreset[]> {
    const rows = await this.db.query.campaignPresets.findMany({
      where: and(eq(campaignPresets.isActive, true), eq(campaignPresets.isSystem, true)),
      orderBy: [asc(campaignPresets.name), asc(campaignPresets.createdAt)],
    });

    return this.loadPresets(rows);
  }

  async save(preset: CampaignPreset): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .insert(campaignPresets)
        .values(this.toPresetRow(preset))
        .onConflictDoUpdate({
          target: campaignPresets.id,
          set: this.toPresetRow(preset),
        });

      await tx
        .delete(campaignPresetPublications)
        .where(eq(campaignPresetPublications.presetId, preset.id));

      if (preset.publications.length > 0) {
        await tx.insert(campaignPresetPublications).values(
          preset.publications.map((publication) => this.toPublicationRow(publication)),
        );
      }
    });
  }

  private async loadPresets(rows: CampaignPresetRow[]): Promise<CampaignPreset[]> {
    if (rows.length === 0) {
      return [];
    }

    const presetIds = rows.map((row) => row.id);
    const publications = await this.db.query.campaignPresetPublications.findMany({
      where: inArray(campaignPresetPublications.presetId, presetIds),
      orderBy: [asc(campaignPresetPublications.position), asc(campaignPresetPublications.createdAt)],
    });

    const publicationsByPreset = new Map<string, CampaignPresetPublicationRow[]>();
    for (const publication of publications) {
      const items = publicationsByPreset.get(publication.presetId) ?? [];
      items.push(publication);
      publicationsByPreset.set(publication.presetId, items);
    }

    return rows.map((row) =>
      CampaignPreset.rehydrate(this.toDomainProps(row, publicationsByPreset.get(row.id) ?? [])),
    );
  }

  private toDomainProps(
    row: CampaignPresetRow,
    publications: CampaignPresetPublicationRow[],
  ): CampaignPresetProps {
    return {
      id: row.id as CampaignPresetId,
      name: row.name,
      description: row.description,
      sourceLanguage: row.sourceLanguage,
      sourceType: row.sourceType,
      isActive: row.isActive,
      isSystem: row.isSystem,
      publications: publications.map((publication) =>
        CampaignPresetPublication.rehydrate(this.toPublicationProps(publication)),
      ),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toPublicationProps(row: CampaignPresetPublicationRow): CampaignPresetPublicationProps {
    return {
      id: row.id as CampaignPresetPublicationId,
      presetId: row.presetId as CampaignPresetId,
      dayOffset: row.dayOffset,
      localTime: row.localTime,
      channel: row.channel,
      language: row.language,
      publicationType: row.publicationType,
      style: row.style,
      position: row.position,
      createdAt: row.createdAt,
    };
  }

  private toPresetRow(preset: CampaignPreset): NewCampaignPresetRow {
    return {
      id: preset.id,
      name: preset.name,
      description: preset.description,
      sourceLanguage: preset.sourceLanguage,
      sourceType: preset.sourceType,
      isActive: preset.isActive,
      isSystem: preset.isSystem,
      createdAt: preset.createdAt,
      updatedAt: preset.updatedAt,
    };
  }

  private toPublicationRow(publication: CampaignPresetPublication): NewCampaignPresetPublicationRow {
    return {
      id: publication.id,
      presetId: publication.presetId,
      dayOffset: publication.dayOffset,
      localTime: publication.localTime,
      channel: publication.channel,
      language: publication.language,
      publicationType: publication.publicationType,
      style: publication.style,
      position: publication.position,
      createdAt: publication.createdAt,
    };
  }
}
