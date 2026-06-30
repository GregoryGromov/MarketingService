import {
  type NewSeoBriefLlmCallRow,
  type SeoBriefLlmCallRow,
  seoBriefLlmCalls,
} from '@marketing-service/database';
import {
  type SeoBriefJsonValue,
  SeoBriefLlmCallLog,
  type SeoBriefLlmCallLogId,
  type SeoBriefLlmCallLogProps,
  SeoBriefLlmLogRepository,
  type SeoBriefRunId,
  type SeoBriefRunStepId,
} from '@marketing-service/seo-briefing';
import { Inject, Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { DRIZZLE, type DrizzleExecutor } from '../database.module.js';

@Injectable()
export class SeoBriefLlmLogDrizzleRepository extends SeoBriefLlmLogRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleExecutor) {
    super();
  }

  async findById(id: SeoBriefLlmCallLogId): Promise<SeoBriefLlmCallLog | null> {
    const row = await this.db.query.seoBriefLlmCalls.findFirst({
      where: eq(seoBriefLlmCalls.id, id),
    });

    return row ? SeoBriefLlmCallLog.rehydrate(this.toDomainProps(row)) : null;
  }

  async findByRunId(runId: SeoBriefRunId): Promise<SeoBriefLlmCallLog[]> {
    const rows = await this.db.query.seoBriefLlmCalls.findMany({
      where: eq(seoBriefLlmCalls.runId, runId),
      orderBy: [asc(seoBriefLlmCalls.createdAt)],
    });

    return rows.map((row) => SeoBriefLlmCallLog.rehydrate(this.toDomainProps(row)));
  }

  async save(log: SeoBriefLlmCallLog): Promise<void> {
    await this.db
      .insert(seoBriefLlmCalls)
      .values(this.toRow(log))
      .onConflictDoUpdate({
        target: seoBriefLlmCalls.id,
        set: this.toRow(log),
      });
  }

  private toDomainProps(row: SeoBriefLlmCallRow): SeoBriefLlmCallLogProps {
    return {
      id: row.id as SeoBriefLlmCallLogId,
      runId: row.runId as SeoBriefRunId,
      stepId: (row.stepId as SeoBriefRunStepId | null) ?? null,
      operation: row.operation,
      model: row.model,
      promptVersion: row.promptVersion,
      requestPayload: row.requestPayload as SeoBriefJsonValue,
      responsePayload: (row.responsePayload as SeoBriefJsonValue | null) ?? null,
      tokenUsageInput: row.tokenUsageInput,
      tokenUsageOutput: row.tokenUsageOutput,
      estimatedCost: row.estimatedCost,
      startedAt: row.startedAt,
      finishedAt: row.finishedAt,
      status: row.status as SeoBriefLlmCallLogProps['status'],
      errorMessage: row.errorMessage,
      createdAt: row.createdAt,
    };
  }

  private toRow(log: SeoBriefLlmCallLog): NewSeoBriefLlmCallRow {
    return {
      id: log.id,
      runId: log.runId,
      stepId: log.stepId,
      operation: log.operation,
      model: log.model,
      promptVersion: log.promptVersion,
      requestPayload: log.requestPayload,
      responsePayload: log.responsePayload,
      tokenUsageInput: log.tokenUsageInput,
      tokenUsageOutput: log.tokenUsageOutput,
      estimatedCost: log.estimatedCost,
      startedAt: log.startedAt,
      finishedAt: log.finishedAt,
      status: log.status,
      errorMessage: log.errorMessage,
      createdAt: log.createdAt,
    };
  }
}
