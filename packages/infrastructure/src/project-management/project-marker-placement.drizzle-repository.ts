import {
  type NewProjectMarkerPlacementRow,
  type ProjectMarkerPlacementRow,
  projectMarkerPlacements,
} from '@marketing-service/database';
import {
  type ProjectId,
  type ProjectMarkerId,
  ProjectMarkerPlacement,
  type ProjectMarkerPlacementId,
  type ProjectMarkerPlacementProps,
  ProjectMarkerPlacementRepository,
} from '@marketing-service/project-management';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, gte, isNull, lte } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../database.module.js';

@Injectable()
export class ProjectMarkerPlacementDrizzleRepository extends ProjectMarkerPlacementRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {
    super();
  }

  async findById(id: ProjectMarkerPlacementId): Promise<ProjectMarkerPlacement | null> {
    const [row] = await this.db
      .select()
      .from(projectMarkerPlacements)
      .where(eq(projectMarkerPlacements.id, id))
      .limit(1);

    return row ? ProjectMarkerPlacement.rehydrate(this.toDomainProps(row)) : null;
  }

  async findByProjectId(
    projectId: ProjectId,
    range?: { from?: Date | null; to?: Date | null },
  ): Promise<ProjectMarkerPlacement[]> {
    const filters = [eq(projectMarkerPlacements.projectId, projectId)];

    if (range?.from) {
      filters.push(gte(projectMarkerPlacements.publishAt, range.from));
    }

    if (range?.to) {
      filters.push(lte(projectMarkerPlacements.publishAt, range.to));
    }

    const rows = await this.db
      .select()
      .from(projectMarkerPlacements)
      .where(and(...filters))
      .orderBy(asc(projectMarkerPlacements.publishAt), asc(projectMarkerPlacements.createdAt));

    return rows.map((row) => ProjectMarkerPlacement.rehydrate(this.toDomainProps(row)));
  }

  async findByLogicalKey(
    markerId: ProjectMarkerId,
    channelId: string,
    targetLanguage: string,
    publishAt: Date,
    marketCountry?: string | null,
  ): Promise<ProjectMarkerPlacement | null> {
    const normalizedMarketCountry = marketCountry?.trim() || null;
    const [row] = await this.db
      .select()
      .from(projectMarkerPlacements)
      .where(
        and(
          eq(projectMarkerPlacements.markerId, markerId),
          eq(projectMarkerPlacements.channelId, channelId),
          eq(projectMarkerPlacements.targetLanguage, targetLanguage.toLowerCase()),
          normalizedMarketCountry
            ? eq(projectMarkerPlacements.marketCountry, normalizedMarketCountry)
            : isNull(projectMarkerPlacements.marketCountry),
          eq(projectMarkerPlacements.publishAt, publishAt),
        ),
      )
      .limit(1);

    return row ? ProjectMarkerPlacement.rehydrate(this.toDomainProps(row)) : null;
  }

  async save(placement: ProjectMarkerPlacement): Promise<void> {
    await this.db
      .insert(projectMarkerPlacements)
      .values(this.toRow(placement))
      .onConflictDoUpdate({
        target: projectMarkerPlacements.id,
        set: this.toRow(placement),
      });
  }

  async deleteById(id: ProjectMarkerPlacementId): Promise<void> {
    await this.db.delete(projectMarkerPlacements).where(eq(projectMarkerPlacements.id, id));
  }

  async deleteByMarkerId(markerId: ProjectMarkerId): Promise<void> {
    await this.db
      .delete(projectMarkerPlacements)
      .where(eq(projectMarkerPlacements.markerId, markerId));
  }

  private toDomainProps(row: ProjectMarkerPlacementRow): ProjectMarkerPlacementProps {
    return {
      id: row.id as ProjectMarkerPlacementId,
      markerId: row.markerId as ProjectMarkerId,
      projectId: row.projectId as ProjectId,
      channelId: row.channelId,
      targetLanguage: row.targetLanguage,
      marketCountry: row.marketCountry,
      marketLocationName: row.marketLocationName,
      publishAt: row.publishAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toRow(placement: ProjectMarkerPlacement): NewProjectMarkerPlacementRow {
    return {
      id: placement.id,
      markerId: placement.markerId,
      projectId: placement.projectId,
      channelId: placement.channelId,
      targetLanguage: placement.targetLanguage,
      marketCountry: placement.marketCountry,
      marketLocationName: placement.marketLocationName,
      publishAt: placement.publishAt,
      createdAt: placement.createdAt,
      updatedAt: placement.updatedAt,
    };
  }
}
