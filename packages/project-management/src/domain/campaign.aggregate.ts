import {
  AggregateRoot,
  createDomainEvent,
  generateId,
  type TypedId,
} from '@marketing-service/shared';
import type { CampaignPresetId } from './campaign-preset.aggregate.js';
import type { ProjectId } from './project.aggregate.js';

export type CampaignId = TypedId<'campaign'>;
export type CampaignStatus =
  | 'draft'
  | 'source_checking'
  | 'source_needs_review'
  | 'producing'
  | 'needs_attention'
  | 'ready_for_final_approval'
  | 'approved_for_publishing'
  | 'publishing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface CreateCampaignParams {
  projectId: ProjectId;
  presetId: CampaignPresetId;
  name: string;
  startDate: Date;
  sourceLanguage?: string;
  sourceArticleId?: string | null;
  extraInstructions?: string | null;
}

export interface CampaignProps {
  id: CampaignId;
  projectId: ProjectId;
  presetId: CampaignPresetId;
  name: string;
  sourceArticleId: string | null;
  startDate: Date;
  sourceLanguage: string;
  status: CampaignStatus;
  extraInstructions: string | null;
  finalApprovedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

function normalizeText(value?: string | null): string | null {
  const nextValue = value?.trim();
  return nextValue ? nextValue : null;
}

export class Campaign extends AggregateRoot {
  private constructor(
    public readonly id: CampaignId,
    public readonly projectId: ProjectId,
    public readonly presetId: CampaignPresetId,
    public name: string,
    public sourceArticleId: string | null,
    public startDate: Date,
    public sourceLanguage: string,
    public status: CampaignStatus,
    public extraInstructions: string | null,
    public finalApprovedAt: Date | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {
    super();
  }

  static create(params: CreateCampaignParams): Campaign {
    const now = new Date();
    const campaign = new Campaign(
      generateId('campaign'),
      params.projectId,
      params.presetId,
      params.name.trim(),
      normalizeText(params.sourceArticleId),
      params.startDate,
      params.sourceLanguage?.trim().toLowerCase() ?? 'en',
      'draft',
      normalizeText(params.extraInstructions),
      null,
      now,
      now,
    );

    campaign.addEvent(
      createDomainEvent({
        eventName: 'CampaignCreated',
        aggregateId: campaign.id,
      }),
    );

    return campaign;
  }

  static rehydrate(props: CampaignProps): Campaign {
    return new Campaign(
      props.id,
      props.projectId,
      props.presetId,
      props.name,
      props.sourceArticleId,
      props.startDate,
      props.sourceLanguage,
      props.status,
      props.extraInstructions,
      props.finalApprovedAt,
      props.createdAt,
      props.updatedAt,
    );
  }

  attachSourceArticle(sourceArticleId: string): void {
    this.sourceArticleId = normalizeText(sourceArticleId);
    this.updatedAt = new Date();
  }

  markSourceChecking(): void {
    this.status = 'source_checking';
    this.updatedAt = new Date();
  }

  markSourceNeedsReview(): void {
    this.status = 'source_needs_review';
    this.updatedAt = new Date();
  }

  markProducing(): void {
    this.status = 'producing';
    this.updatedAt = new Date();
  }

  markNeedsAttention(): void {
    this.status = 'needs_attention';
    this.updatedAt = new Date();
  }

  markReadyForFinalApproval(): void {
    this.status = 'ready_for_final_approval';
    this.updatedAt = new Date();
  }

  approveForPublishing(): void {
    this.status = 'approved_for_publishing';
    this.finalApprovedAt = new Date();
    this.updatedAt = this.finalApprovedAt;
  }

  markApprovedForPublishing(): void {
    this.status = 'approved_for_publishing';
    this.updatedAt = new Date();
  }

  markPublishing(): void {
    this.status = 'publishing';
    this.updatedAt = new Date();
  }

  complete(): void {
    this.status = 'completed';
    this.updatedAt = new Date();
  }

  fail(): void {
    this.status = 'failed';
    this.updatedAt = new Date();
  }

  cancel(): void {
    this.status = 'cancelled';
    this.updatedAt = new Date();
  }
}
