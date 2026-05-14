import { Inject, Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import {
  campaignArtifacts,
  type CampaignArtifactRow,
  type NewCampaignArtifactRow,
} from '@marketing-service/database';
import {
  CampaignArtifact,
  CampaignArtifactRepository,
  type CampaignArtifactId,
  type CampaignArtifactProps,
  type CampaignId,
  type PlannedPublicationId,
} from '@marketing-service/project-management';
import { DRIZZLE, type DrizzleExecutor } from '../database.module.js';

@Injectable()
export class CampaignArtifactDrizzleRepository extends CampaignArtifactRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleExecutor) {
    super();
  }

  async findById(id: CampaignArtifactId): Promise<CampaignArtifact | null> {
    const row = await this.db.query.campaignArtifacts.findFirst({
      where: eq(campaignArtifacts.id, id),
    });

    return row ? CampaignArtifact.rehydrate(this.toDomainProps(row)) : null;
  }

  async findByCampaignId(campaignId: CampaignId): Promise<CampaignArtifact[]> {
    const rows = await this.db.query.campaignArtifacts.findMany({
      where: eq(campaignArtifacts.campaignId, campaignId),
      orderBy: [asc(campaignArtifacts.createdAt)],
    });

    return rows.map((row) => CampaignArtifact.rehydrate(this.toDomainProps(row)));
  }

  async findByCampaignIdAndRole(campaignId: CampaignId, role: string): Promise<CampaignArtifact[]> {
    const rows = await this.db.query.campaignArtifacts.findMany({
      where: eq(campaignArtifacts.campaignId, campaignId),
      orderBy: [asc(campaignArtifacts.createdAt)],
    });

    return rows
      .filter((row) => row.role === role)
      .map((row) => CampaignArtifact.rehydrate(this.toDomainProps(row)));
  }

  async findByPlannedPublicationId(
    plannedPublicationId: PlannedPublicationId,
  ): Promise<CampaignArtifact[]> {
    const rows = await this.db.query.campaignArtifacts.findMany({
      where: eq(campaignArtifacts.plannedPublicationId, plannedPublicationId),
      orderBy: [asc(campaignArtifacts.createdAt)],
    });

    return rows.map((row) => CampaignArtifact.rehydrate(this.toDomainProps(row)));
  }

  async save(artifact: CampaignArtifact): Promise<void> {
    await this.db
      .insert(campaignArtifacts)
      .values(this.toRow(artifact))
      .onConflictDoUpdate({
        target: campaignArtifacts.id,
        set: this.toRow(artifact),
      });
  }

  private toDomainProps(row: CampaignArtifactRow): CampaignArtifactProps {
    return {
      id: row.id as CampaignArtifactId,
      campaignId: row.campaignId as CampaignId,
      plannedPublicationId: row.plannedPublicationId as PlannedPublicationId | null,
      artifactType: row.artifactType as CampaignArtifactProps['artifactType'],
      artifactId: row.artifactId,
      role: row.role,
      createdAt: row.createdAt,
    };
  }

  private toRow(artifact: CampaignArtifact): NewCampaignArtifactRow {
    return {
      id: artifact.id,
      campaignId: artifact.campaignId,
      plannedPublicationId: artifact.plannedPublicationId,
      artifactType: artifact.artifactType,
      artifactId: artifact.artifactId,
      role: artifact.role,
      createdAt: artifact.createdAt,
    };
  }
}
