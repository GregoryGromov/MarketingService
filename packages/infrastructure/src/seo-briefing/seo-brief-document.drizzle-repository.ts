import { type NewSeoBriefRow, type SeoBriefRow, seoBriefs } from '@marketing-service/database';
import {
  SeoBriefDocument,
  type SeoBriefDocumentId,
  type SeoBriefDocumentProps,
  SeoBriefDocumentRepository,
  type SeoBriefJsonValue,
  type SeoBriefRunId,
} from '@marketing-service/seo-briefing';
import { Inject, Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { DRIZZLE, type DrizzleExecutor } from '../database.module.js';

@Injectable()
export class SeoBriefDocumentDrizzleRepository extends SeoBriefDocumentRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleExecutor) {
    super();
  }

  async findLatestByRunId(runId: SeoBriefRunId): Promise<SeoBriefDocument | null> {
    const row = await this.db.query.seoBriefs.findFirst({
      where: eq(seoBriefs.runId, runId),
      orderBy: [desc(seoBriefs.updatedAt), desc(seoBriefs.createdAt)],
    });

    return row ? SeoBriefDocument.rehydrate(this.toDomainProps(row)) : null;
  }

  async save(document: SeoBriefDocument): Promise<void> {
    await this.db
      .insert(seoBriefs)
      .values(this.toRow(document))
      .onConflictDoUpdate({
        target: seoBriefs.id,
        set: this.toRow(document),
      });
  }

  private toDomainProps(row: SeoBriefRow): SeoBriefDocumentProps {
    return {
      id: row.id as SeoBriefDocumentId,
      runId: row.runId as SeoBriefRunId,
      selectedClusterPayload: row.selectedClusterPayload as SeoBriefJsonValue,
      briefPayload: row.briefPayload as SeoBriefJsonValue,
      rejectedClustersPayload: (row.rejectedClustersPayload as SeoBriefJsonValue | null) ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toRow(document: SeoBriefDocument): NewSeoBriefRow {
    return {
      id: document.id,
      runId: document.runId,
      selectedClusterPayload: document.selectedClusterPayload,
      briefPayload: document.briefPayload,
      rejectedClustersPayload: document.rejectedClustersPayload,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };
  }
}
