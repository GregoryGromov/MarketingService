import {
  type NewSeoBriefRunStepRow,
  type SeoBriefRunStepRow,
  seoBriefRunSteps,
} from '@marketing-service/database';
import {
  type SeoBriefRunId,
  SeoBriefRunStep,
  type SeoBriefRunStepId,
  type SeoBriefRunStepProps,
  SeoBriefRunStepRepository,
} from '@marketing-service/seo-briefing';
import { Inject, Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { DRIZZLE, type DrizzleExecutor } from '../database.module.js';

@Injectable()
export class SeoBriefRunStepDrizzleRepository extends SeoBriefRunStepRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleExecutor) {
    super();
  }

  async findByRunId(runId: SeoBriefRunId): Promise<SeoBriefRunStep[]> {
    const rows = await this.db.query.seoBriefRunSteps.findMany({
      where: eq(seoBriefRunSteps.runId, runId),
      orderBy: [asc(seoBriefRunSteps.createdAt)],
    });

    return rows.map((row) => SeoBriefRunStep.rehydrate(this.toDomainProps(row)));
  }

  async save(step: SeoBriefRunStep): Promise<void> {
    await this.db
      .insert(seoBriefRunSteps)
      .values(this.toRow(step))
      .onConflictDoUpdate({
        target: seoBriefRunSteps.id,
        set: this.toRow(step),
      });
  }

  private toDomainProps(row: SeoBriefRunStepRow): SeoBriefRunStepProps {
    return {
      id: row.id as SeoBriefRunStepId,
      runId: row.runId as SeoBriefRunId,
      stage: row.stage as SeoBriefRunStepProps['stage'],
      status: row.status as SeoBriefRunStepProps['status'],
      attemptNumber: row.attemptNumber,
      startedAt: row.startedAt,
      finishedAt: row.finishedAt,
      errorMessage: row.errorMessage,
      createdAt: row.createdAt,
    };
  }

  private toRow(step: SeoBriefRunStep): NewSeoBriefRunStepRow {
    return {
      id: step.id,
      runId: step.runId,
      stage: step.stage,
      status: step.status,
      attemptNumber: step.attemptNumber,
      startedAt: step.startedAt,
      finishedAt: step.finishedAt,
      errorMessage: step.errorMessage,
      createdAt: step.createdAt,
    };
  }
}
