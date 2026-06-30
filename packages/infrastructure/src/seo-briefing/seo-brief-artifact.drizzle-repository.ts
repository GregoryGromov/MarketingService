import {
  type NewSeoBriefRunArtifactRow,
  type SeoBriefRunArtifactRow,
  seoBriefRunArtifacts,
} from '@marketing-service/database';
import {
  SeoBriefArtifact,
  type SeoBriefArtifactId,
  type SeoBriefArtifactProps,
  SeoBriefArtifactRepository,
  type SeoBriefJsonValue,
  type SeoBriefRunId,
} from '@marketing-service/seo-briefing';
import { Inject, Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { DRIZZLE, type DrizzleExecutor } from '../database.module.js';

@Injectable()
export class SeoBriefArtifactDrizzleRepository extends SeoBriefArtifactRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleExecutor) {
    super();
  }

  async findByRunId(runId: SeoBriefRunId): Promise<SeoBriefArtifact[]> {
    const rows = await this.db.query.seoBriefRunArtifacts.findMany({
      where: eq(seoBriefRunArtifacts.runId, runId),
      orderBy: [asc(seoBriefRunArtifacts.createdAt)],
    });

    return rows.map((row) => SeoBriefArtifact.rehydrate(this.toDomainProps(row)));
  }

  async save(artifact: SeoBriefArtifact): Promise<void> {
    await this.db
      .insert(seoBriefRunArtifacts)
      .values(this.toRow(artifact))
      .onConflictDoUpdate({
        target: seoBriefRunArtifacts.id,
        set: this.toRow(artifact),
      });
  }

  private toDomainProps(row: SeoBriefRunArtifactRow): SeoBriefArtifactProps {
    return {
      id: row.id as SeoBriefArtifactId,
      runId: row.runId as SeoBriefRunId,
      stage: row.stage as SeoBriefArtifactProps['stage'],
      artifactType: row.artifactType,
      payload: row.payload as SeoBriefJsonValue,
      attempt: row.attempt,
      createdAt: row.createdAt,
    };
  }

  private toRow(artifact: SeoBriefArtifact): NewSeoBriefRunArtifactRow {
    return {
      id: artifact.id,
      runId: artifact.runId,
      stage: artifact.stage,
      artifactType: artifact.artifactType,
      payload: artifact.payload,
      attempt: artifact.attempt,
      createdAt: artifact.createdAt,
    };
  }
}
