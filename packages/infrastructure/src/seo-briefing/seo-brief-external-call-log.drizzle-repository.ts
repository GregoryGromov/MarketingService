import {
  type NewSeoBriefExternalCallRow,
  type SeoBriefExternalCallRow,
  seoBriefExternalCalls,
} from '@marketing-service/database';
import {
  SeoBriefExternalCallLog,
  type SeoBriefExternalCallLogId,
  type SeoBriefExternalCallLogProps,
  SeoBriefExternalCallLogRepository,
  type SeoBriefJsonValue,
  type SeoBriefRunId,
  type SeoBriefRunStepId,
} from '@marketing-service/seo-briefing';
import { Inject, Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { DRIZZLE, type DrizzleExecutor } from '../database.module.js';

@Injectable()
export class SeoBriefExternalCallLogDrizzleRepository extends SeoBriefExternalCallLogRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleExecutor) {
    super();
  }

  async findById(id: SeoBriefExternalCallLogId): Promise<SeoBriefExternalCallLog | null> {
    const row = await this.db.query.seoBriefExternalCalls.findFirst({
      where: eq(seoBriefExternalCalls.id, id),
    });

    return row ? SeoBriefExternalCallLog.rehydrate(this.toDomainProps(row)) : null;
  }

  async findByRunId(runId: SeoBriefRunId): Promise<SeoBriefExternalCallLog[]> {
    const rows = await this.db.query.seoBriefExternalCalls.findMany({
      where: eq(seoBriefExternalCalls.runId, runId),
      orderBy: [asc(seoBriefExternalCalls.createdAt)],
    });

    return rows.map((row) => SeoBriefExternalCallLog.rehydrate(this.toDomainProps(row)));
  }

  async save(log: SeoBriefExternalCallLog): Promise<void> {
    await this.db
      .insert(seoBriefExternalCalls)
      .values(this.toRow(log))
      .onConflictDoUpdate({
        target: seoBriefExternalCalls.id,
        set: this.toRow(log),
      });
  }

  private toDomainProps(row: SeoBriefExternalCallRow): SeoBriefExternalCallLogProps {
    return {
      id: row.id as SeoBriefExternalCallLogId,
      runId: row.runId as SeoBriefRunId,
      stepId: (row.stepId as SeoBriefRunStepId | null) ?? null,
      provider: row.provider,
      endpoint: row.endpoint,
      requestPayload: row.requestPayload as SeoBriefJsonValue,
      responsePayload: (row.responsePayload as SeoBriefJsonValue | null) ?? null,
      estimatedCost: row.estimatedCost,
      cacheHit: row.cacheHit,
      startedAt: row.startedAt,
      finishedAt: row.finishedAt,
      status: row.status as SeoBriefExternalCallLogProps['status'],
      errorMessage: row.errorMessage,
      createdAt: row.createdAt,
    };
  }

  private toRow(log: SeoBriefExternalCallLog): NewSeoBriefExternalCallRow {
    return {
      id: log.id,
      runId: log.runId,
      stepId: log.stepId,
      provider: log.provider,
      endpoint: log.endpoint,
      requestPayload: log.requestPayload,
      responsePayload: log.responsePayload,
      estimatedCost: log.estimatedCost,
      cacheHit: log.cacheHit,
      startedAt: log.startedAt,
      finishedAt: log.finishedAt,
      status: log.status,
      errorMessage: log.errorMessage,
      createdAt: log.createdAt,
    };
  }
}
