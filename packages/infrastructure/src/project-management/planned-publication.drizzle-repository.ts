import { Inject, Injectable } from '@nestjs/common';
import { asc, desc, eq } from 'drizzle-orm';
import {
  plannedPublications,
  type NewPlannedPublicationRow,
  type PlannedPublicationRow,
} from '@marketing-service/database';
import {
  PlannedPublication,
  PlannedPublicationRepository,
  type CampaignId,
  type PlannedPublicationId,
  type PlannedPublicationProps,
  type PlannedPublicationStatus,
} from '@marketing-service/project-management';
import { DRIZZLE, type DrizzleExecutor } from '../database.module.js';

@Injectable()
export class PlannedPublicationDrizzleRepository extends PlannedPublicationRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleExecutor) {
    super();
  }

  async findById(id: PlannedPublicationId): Promise<PlannedPublication | null> {
    const row = await this.db.query.plannedPublications.findFirst({
      where: eq(plannedPublications.id, id),
    });

    return row ? PlannedPublication.rehydrate(this.toDomainProps(row)) : null;
  }

  async findByCampaignId(campaignId: CampaignId): Promise<PlannedPublication[]> {
    const rows = await this.db.query.plannedPublications.findMany({
      where: eq(plannedPublications.campaignId, campaignId),
      orderBy: [asc(plannedPublications.scheduledFor), asc(plannedPublications.createdAt)],
    });

    return rows.map((row) => PlannedPublication.rehydrate(this.toDomainProps(row)));
  }

  async findByCampaignIdAndStatus(
    campaignId: CampaignId,
    status: PlannedPublicationStatus,
  ): Promise<PlannedPublication[]> {
    const rows = await this.db.query.plannedPublications.findMany({
      where: eq(plannedPublications.campaignId, campaignId),
      orderBy: [desc(plannedPublications.updatedAt), asc(plannedPublications.createdAt)],
    });

    return rows
      .filter((row) => row.status === status)
      .map((row) => PlannedPublication.rehydrate(this.toDomainProps(row)));
  }

  async save(plannedPublication: PlannedPublication): Promise<void> {
    await this.db
      .insert(plannedPublications)
      .values(this.toRow(plannedPublication))
      .onConflictDoUpdate({
        target: plannedPublications.id,
        set: this.toRow(plannedPublication),
      });
  }

  async saveMany(plannedPublicationItems: PlannedPublication[]): Promise<void> {
    if (plannedPublicationItems.length === 0) {
      return;
    }

    await this.db.transaction(async (tx) => {
      for (const plannedPublication of plannedPublicationItems) {
        await tx
          .insert(plannedPublications)
          .values(this.toRow(plannedPublication))
          .onConflictDoUpdate({
            target: plannedPublications.id,
            set: this.toRow(plannedPublication),
          });
      }
    });
  }

  private toDomainProps(row: PlannedPublicationRow): PlannedPublicationProps {
    return {
      id: row.id as PlannedPublicationId,
      campaignId: row.campaignId as CampaignId,
      presetPublicationId: row.presetPublicationId as PlannedPublicationProps['presetPublicationId'],
      dayOffset: row.dayOffset,
      localTime: row.localTime,
      scheduledFor: row.scheduledFor,
      channel: row.channel,
      language: row.language,
      publicationType: row.publicationType,
      style: row.style,
      publishMode: row.publishMode as PlannedPublicationProps['publishMode'],
      status: row.status as PlannedPublicationStatus,
      notes: row.notes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toRow(plannedPublication: PlannedPublication): NewPlannedPublicationRow {
    return {
      id: plannedPublication.id,
      campaignId: plannedPublication.campaignId,
      presetPublicationId: plannedPublication.presetPublicationId,
      dayOffset: plannedPublication.dayOffset,
      localTime: plannedPublication.localTime,
      scheduledFor: plannedPublication.scheduledFor,
      channel: plannedPublication.channel,
      language: plannedPublication.language,
      publicationType: plannedPublication.publicationType,
      style: plannedPublication.style,
      publishMode: plannedPublication.publishMode,
      status: plannedPublication.status,
      notes: plannedPublication.notes,
      createdAt: plannedPublication.createdAt,
      updatedAt: plannedPublication.updatedAt,
    };
  }
}
