import { Inject, Injectable } from '@nestjs/common';
import { asc, desc, eq } from 'drizzle-orm';
import { projects, type NewProjectRow, type ProjectRow } from '@marketing-service/database';
import {
  type AdaptationPromptRules,
  type BrandMemoryDocument,
  Project,
  ProjectRepository,
  type ProjectId,
  type ProjectProps,
} from '@marketing-service/project-management';
import { DRIZZLE, type DrizzleExecutor } from '../database.module.js';

@Injectable()
export class ProjectDrizzleRepository extends ProjectRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleExecutor) {
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
      brandMemory: {
        brandName: row.brandName,
        productDescription: row.productDescription,
        targetAudience: row.targetAudience,
        approvedFacts: (row.approvedFacts as string[] | null) ?? [],
        forbiddenClaims: (row.forbiddenClaims as string[] | null) ?? [],
        glossary: (row.glossary as Record<string, string> | null) ?? {},
        bannedPhrases: (row.bannedPhrases as string[] | null) ?? [],
        requiredPhrases: (row.requiredPhrases as string[] | null) ?? [],
        brandDocs: (row.brandDocs as BrandMemoryDocument[] | null) ?? [],
        adaptationPromptRules:
          (row.adaptationPromptRules as AdaptationPromptRules | null) ?? {
            generalInstructions: null,
            telegram: null,
            x: null,
            discord: null,
            blog: null,
            mediaAspectRatios: {
              telegram: '1:1',
              x: '16:9',
              discord: '16:9',
              blog: '1200:630',
            },
          },
      },
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toRow(project: Project): NewProjectRow {
    return {
      id: project.id,
      name: project.name,
      brandName: project.brandMemory.brandName,
      productDescription: project.brandMemory.productDescription,
      targetAudience: project.brandMemory.targetAudience,
      approvedFacts: project.brandMemory.approvedFacts,
      forbiddenClaims: project.brandMemory.forbiddenClaims,
      glossary: project.brandMemory.glossary,
      bannedPhrases: project.brandMemory.bannedPhrases,
      requiredPhrases: project.brandMemory.requiredPhrases,
      brandDocs: project.brandMemory.brandDocs,
      adaptationPromptRules: project.brandMemory.adaptationPromptRules,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }
}
