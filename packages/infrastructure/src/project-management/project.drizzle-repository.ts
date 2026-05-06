import { Inject, Injectable } from '@nestjs/common';
import { asc, desc, eq } from 'drizzle-orm';
import { projects, type NewProjectRow, type ProjectRow } from '@marketing-service/database';
import {
  Project,
  ProjectRepository,
  type ProjectId,
  type ProjectProps,
} from '@marketing-service/project-management';
import { DRIZZLE, type DrizzleDB } from '../database.module.js';

@Injectable()
export class ProjectDrizzleRepository extends ProjectRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {
    super();
  }

  async findById(id: ProjectId): Promise<Project | null> {
    const row = await this.db.query.projects.findFirst({
      where: eq(projects.id, id),
    });

    return row ? Project.rehydrate(this.toDomainProps(row)) : null;
  }

  async findAll(): Promise<Project[]> {
    const rows = await this.db.query.projects.findMany({
      orderBy: [desc(projects.updatedAt), asc(projects.createdAt)],
    });

    return rows.map((row) => Project.rehydrate(this.toDomainProps(row)));
  }

  async save(project: Project): Promise<void> {
    await this.db
      .insert(projects)
      .values(this.toRow(project))
      .onConflictDoUpdate({
        target: projects.id,
        set: this.toRow(project),
      });
  }

  private toDomainProps(row: ProjectRow): ProjectProps {
    return {
      id: row.id as ProjectId,
      name: row.name,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toRow(project: Project): NewProjectRow {
    return {
      id: project.id,
      name: project.name,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }
}
