import {
  AggregateRoot,
  createDomainEvent,
  generateId,
  type TypedId,
} from '@marketing-service/shared';
import type { CampaignId } from './campaign.aggregate.js';

export type WorkflowRunId = TypedId<'workflow_run'>;
export type WorkflowRunStatus = 'running' | 'completed' | 'failed' | 'cancelled';

export interface CreateWorkflowRunParams {
  campaignId: CampaignId;
  currentStep: string;
}

export interface WorkflowRunProps {
  id: WorkflowRunId;
  campaignId: CampaignId;
  status: WorkflowRunStatus;
  currentStep: string;
  errorMessage: string | null;
  startedAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class WorkflowRun extends AggregateRoot {
  private constructor(
    public readonly id: WorkflowRunId,
    public readonly campaignId: CampaignId,
    public status: WorkflowRunStatus,
    public currentStep: string,
    public errorMessage: string | null,
    public readonly startedAt: Date,
    public completedAt: Date | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {
    super();
  }

  static create(params: CreateWorkflowRunParams): WorkflowRun {
    const now = new Date();
    const run = new WorkflowRun(
      generateId('workflow_run'),
      params.campaignId,
      'running',
      params.currentStep.trim(),
      null,
      now,
      null,
      now,
      now,
    );

    run.addEvent(
      createDomainEvent({
        eventName: 'WorkflowRunStarted',
        aggregateId: run.id,
      }),
    );

    return run;
  }

  static rehydrate(props: WorkflowRunProps): WorkflowRun {
    return new WorkflowRun(
      props.id,
      props.campaignId,
      props.status,
      props.currentStep,
      props.errorMessage,
      props.startedAt,
      props.completedAt,
      props.createdAt,
      props.updatedAt,
    );
  }

  moveToStep(step: string): void {
    this.currentStep = step.trim();
    this.updatedAt = new Date();
  }

  complete(): void {
    this.status = 'completed';
    this.completedAt = new Date();
    this.updatedAt = this.completedAt;
    this.errorMessage = null;
  }

  fail(message: string): void {
    this.status = 'failed';
    this.errorMessage = message.trim();
    this.completedAt = new Date();
    this.updatedAt = this.completedAt;
  }

  cancel(): void {
    this.status = 'cancelled';
    this.completedAt = new Date();
    this.updatedAt = this.completedAt;
  }
}
