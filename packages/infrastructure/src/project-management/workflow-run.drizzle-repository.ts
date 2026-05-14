import { Inject, Injectable } from '@nestjs/common';
import { asc, desc, eq } from 'drizzle-orm';
import {
  workflowRuns,
  type NewWorkflowRunRow,
  type WorkflowRunRow,
} from '@marketing-service/database';
import {
  WorkflowRun,
  WorkflowRunRepository,
  type CampaignId,
  type WorkflowRunId,
  type WorkflowRunProps,
} from '@marketing-service/project-management';
import { DRIZZLE, type DrizzleExecutor } from '../database.module.js';

@Injectable()
export class WorkflowRunDrizzleRepository extends WorkflowRunRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleExecutor) {
    super();
  }

  async findById(id: WorkflowRunId): Promise<WorkflowRun | null> {
    const row = await this.db.query.workflowRuns.findFirst({
      where: eq(workflowRuns.id, id),
    });

    return row ? WorkflowRun.rehydrate(this.toDomainProps(row)) : null;
  }

  async findByCampaignId(campaignId: CampaignId): Promise<WorkflowRun[]> {
    const rows = await this.db.query.workflowRuns.findMany({
      where: eq(workflowRuns.campaignId, campaignId),
      orderBy: [desc(workflowRuns.createdAt)],
    });

    return rows.map((row) => WorkflowRun.rehydrate(this.toDomainProps(row)));
  }

  async findActiveByCampaignId(campaignId: CampaignId): Promise<WorkflowRun | null> {
    const row = await this.db.query.workflowRuns.findFirst({
      where: eq(workflowRuns.campaignId, campaignId),
      orderBy: [desc(workflowRuns.createdAt)],
    });

    if (!row || row.status !== 'running') {
      return null;
    }

    return WorkflowRun.rehydrate(this.toDomainProps(row));
  }

  async save(workflowRun: WorkflowRun): Promise<void> {
    await this.db
      .insert(workflowRuns)
      .values(this.toRow(workflowRun))
      .onConflictDoUpdate({
        target: workflowRuns.id,
        set: this.toRow(workflowRun),
      });
  }

  private toDomainProps(row: WorkflowRunRow): WorkflowRunProps {
    return {
      id: row.id as WorkflowRunId,
      campaignId: row.campaignId as CampaignId,
      status: row.status as WorkflowRunProps['status'],
      currentStep: row.currentStep,
      errorMessage: row.errorMessage,
      startedAt: row.startedAt,
      completedAt: row.completedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toRow(workflowRun: WorkflowRun): NewWorkflowRunRow {
    return {
      id: workflowRun.id,
      campaignId: workflowRun.campaignId,
      status: workflowRun.status,
      currentStep: workflowRun.currentStep,
      errorMessage: workflowRun.errorMessage,
      startedAt: workflowRun.startedAt,
      completedAt: workflowRun.completedAt,
      createdAt: workflowRun.createdAt,
      updatedAt: workflowRun.updatedAt,
    };
  }
}
