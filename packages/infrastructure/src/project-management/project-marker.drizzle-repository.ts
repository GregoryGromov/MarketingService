import {
  type NewProjectMarkerRow,
  type ProjectMarkerRow,
  projectMarkers,
} from '@marketing-service/database';
import {
  type ProjectId,
  ProjectMarker,
  type ProjectMarkerId,
  type ProjectMarkerProps,
  ProjectMarkerRepository,
} from '@marketing-service/project-management';
import { Inject, Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../database.module.js';

@Injectable()
export class ProjectMarkerDrizzleRepository extends ProjectMarkerRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {
    super();
  }

  async findById(id: ProjectMarkerId): Promise<ProjectMarker | null> {
    const row = await this.db.query.projectMarkers.findFirst({
      where: eq(projectMarkers.id, id),
    });

    return row ? ProjectMarker.rehydrate(this.toDomainProps(row)) : null;
  }

  async findByProjectId(projectId: ProjectId): Promise<ProjectMarker[]> {
    const rows = await this.db.query.projectMarkers.findMany({
      where: eq(projectMarkers.projectId, projectId),
      orderBy: [asc(projectMarkers.createdAt)],
    });

    return rows.map((row) => ProjectMarker.rehydrate(this.toDomainProps(row)));
  }

  async save(marker: ProjectMarker): Promise<void> {
    await this.db
      .insert(projectMarkers)
      .values(this.toRow(marker))
      .onConflictDoUpdate({
        target: projectMarkers.id,
        set: this.toRow(marker),
      });
  }

  async deleteById(id: ProjectMarkerId): Promise<void> {
    await this.db.delete(projectMarkers).where(eq(projectMarkers.id, id));
  }

  private toDomainProps(row: ProjectMarkerRow): ProjectMarkerProps {
    return {
      id: row.id as ProjectMarkerId,
      projectId: row.projectId as ProjectId,
      title: row.title,
      notes: row.notes,
      colorBg: row.colorBg,
      colorBorder: row.colorBorder,
      colorText: row.colorText,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toRow(marker: ProjectMarker): NewProjectMarkerRow {
    return {
      id: marker.id,
      projectId: marker.projectId,
      title: marker.title,
      notes: marker.notes,
      colorBg: marker.colorBg,
      colorBorder: marker.colorBorder,
      colorText: marker.colorText,
      createdAt: marker.createdAt,
      updatedAt: marker.updatedAt,
    };
  }
}
