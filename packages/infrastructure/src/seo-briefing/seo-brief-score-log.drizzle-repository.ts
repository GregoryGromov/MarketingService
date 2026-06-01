import {
  type NewSeoBriefScoreLogRow,
  type SeoBriefScoreLogRow,
  seoBriefScoreLogs,
} from '@marketing-service/database';
import {
  type SeoBriefJsonValue,
  type SeoBriefRunId,
  type SeoBriefRunStepId,
  SeoBriefScoreLog,
  type SeoBriefScoreLogId,
  type SeoBriefScoreLogProps,
  SeoBriefScoreLogRepository,
} from '@marketing-service/seo-briefing';
import { Inject, Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { DRIZZLE, type DrizzleExecutor } from '../database.module.js';

@Injectable()
export class SeoBriefScoreLogDrizzleRepository extends SeoBriefScoreLogRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleExecutor) {
    super();
  }

  async findByRunId(runId: SeoBriefRunId): Promise<SeoBriefScoreLog[]> {
    const rows = await this.db.query.seoBriefScoreLogs.findMany({
      where: eq(seoBriefScoreLogs.runId, runId),
      orderBy: [asc(seoBriefScoreLogs.createdAt)],
    });

    return rows.map((row) => SeoBriefScoreLog.rehydrate(this.toDomainProps(row)));
  }

  async save(log: SeoBriefScoreLog): Promise<void> {
    await this.db
      .insert(seoBriefScoreLogs)
      .values(this.toRow(log))
      .onConflictDoUpdate({
        target: seoBriefScoreLogs.id,
        set: this.toRow(log),
      });
  }

  private toDomainProps(row: SeoBriefScoreLogRow): SeoBriefScoreLogProps {
    return {
      id: row.id as SeoBriefScoreLogId,
      runId: row.runId as SeoBriefRunId,
      stepId: (row.stepId as SeoBriefRunStepId | null) ?? null,
      formulaName: row.formulaName,
      inputPayload: row.inputPayload as SeoBriefJsonValue,
      resultPayload: row.resultPayload as SeoBriefJsonValue,
      createdAt: row.createdAt,
    };
  }

  private toRow(log: SeoBriefScoreLog): NewSeoBriefScoreLogRow {
    return {
      id: log.id,
      runId: log.runId,
      stepId: log.stepId,
      formulaName: log.formulaName,
      inputPayload: log.inputPayload,
      resultPayload: log.resultPayload,
      createdAt: log.createdAt,
    };
  }
}
