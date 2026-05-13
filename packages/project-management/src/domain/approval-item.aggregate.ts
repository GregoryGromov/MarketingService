import {
  AggregateRoot,
  createDomainEvent,
  generateId,
  type TypedId,
} from '@marketing-service/shared';
import type { CampaignId } from './campaign.aggregate.js';
import type { CampaignArtifactType } from './campaign-artifact.entity.js';
import type { PlannedPublicationId } from './planned-publication.entity.js';
import type { ProjectId } from './project.aggregate.js';

export type ApprovalItemId = TypedId<'approval_item'>;
export type ApprovalItemType =
  | 'source_issue'
  | 'adaptation_quality_exception'
  | 'translation_fidelity_exception'
  | 'final_campaign_approval'
  | 'publishing_exception';
export type ApprovalItemStatus =
  | 'pending'
  | 'approved'
  | 'changes_requested'
  | 'rejected'
  | 'blocked'
  | 'resolved';
export type ApprovalItemSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ApprovalItemPayload = Record<string, unknown>;

export interface CreateApprovalItemParams {
  projectId: ProjectId;
  campaignId: CampaignId;
  plannedPublicationId?: PlannedPublicationId | null;
  artifactType?: CampaignArtifactType | null;
  artifactId?: string | null;
  type: ApprovalItemType;
  status?: ApprovalItemStatus;
  severity?: ApprovalItemSeverity;
  title: string;
  details: ApprovalItemPayload;
  suggestedFix?: ApprovalItemPayload | null;
}

export interface ApprovalItemProps {
  id: ApprovalItemId;
  projectId: ProjectId;
  campaignId: CampaignId;
  plannedPublicationId: PlannedPublicationId | null;
  artifactType: CampaignArtifactType | null;
  artifactId: string | null;
  type: ApprovalItemType;
  status: ApprovalItemStatus;
  severity: ApprovalItemSeverity;
  title: string;
  details: ApprovalItemPayload;
  suggestedFix: ApprovalItemPayload | null;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
}

function normalizeText(value?: string | null): string | null {
  const nextValue = value?.trim();
  return nextValue ? nextValue : null;
}

export class ApprovalItem extends AggregateRoot {
  private constructor(
    public readonly id: ApprovalItemId,
    public readonly projectId: ProjectId,
    public readonly campaignId: CampaignId,
    public readonly plannedPublicationId: PlannedPublicationId | null,
    public readonly artifactType: CampaignArtifactType | null,
    public readonly artifactId: string | null,
    public readonly type: ApprovalItemType,
    public status: ApprovalItemStatus,
    public severity: ApprovalItemSeverity,
    public title: string,
    public details: ApprovalItemPayload,
    public suggestedFix: ApprovalItemPayload | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public resolvedAt: Date | null,
  ) {
    super();
  }

  static create(params: CreateApprovalItemParams): ApprovalItem {
    const now = new Date();
    const item = new ApprovalItem(
      generateId('approval_item'),
      params.projectId,
      params.campaignId,
      params.plannedPublicationId ?? null,
      params.artifactType ?? null,
      normalizeText(params.artifactId),
      params.type,
      params.status ?? 'pending',
      params.severity ?? 'medium',
      params.title.trim(),
      params.details,
      params.suggestedFix ?? null,
      now,
      now,
      null,
    );

    item.addEvent(
      createDomainEvent({
        eventName: 'ApprovalItemCreated',
        aggregateId: item.id,
      }),
    );

    return item;
  }

  static rehydrate(props: ApprovalItemProps): ApprovalItem {
    return new ApprovalItem(
      props.id,
      props.projectId,
      props.campaignId,
      props.plannedPublicationId,
      props.artifactType,
      props.artifactId,
      props.type,
      props.status,
      props.severity,
      props.title,
      props.details,
      props.suggestedFix,
      props.createdAt,
      props.updatedAt,
      props.resolvedAt,
    );
  }

  approve(): void {
    this.status = 'approved';
    this.resolvedAt = new Date();
    this.updatedAt = this.resolvedAt;
  }

  requestChanges(): void {
    this.status = 'changes_requested';
    this.resolvedAt = new Date();
    this.updatedAt = this.resolvedAt;
  }

  reject(): void {
    this.status = 'rejected';
    this.resolvedAt = new Date();
    this.updatedAt = this.resolvedAt;
  }

  block(): void {
    this.status = 'blocked';
    this.resolvedAt = new Date();
    this.updatedAt = this.resolvedAt;
  }

  resolve(): void {
    this.status = 'resolved';
    this.resolvedAt = new Date();
    this.updatedAt = this.resolvedAt;
  }
}
