import { generateId, type TypedId } from '@marketing-service/shared';
import type { CampaignId } from './campaign.aggregate.js';
import type { CampaignPresetPublicationId } from './campaign-preset-publication.entity.js';
import { normalizePublicationTypeForChannel } from '../publication-type.js';

export type PlannedPublicationId = TypedId<'planned_publication'>;
export type PlannedPublicationStatus =
  | 'pending'
  | 'source_blocked'
  | 'adapting'
  | 'stage_1_failed'
  | 'translating'
  | 'stage_2_failed'
  | 'ready'
  | 'blocked'
  | 'publication_scheduled'
  | 'published'
  | 'exported'
  | 'failed';
export type PlannedPublicationPublishMode = 'auto_publish' | 'manual_export';

export interface CreatePlannedPublicationParams {
  campaignId: CampaignId;
  presetPublicationId?: CampaignPresetPublicationId | null;
  dayOffset: number;
  localTime: string;
  scheduledFor: Date;
  channel: string;
  language: string;
  publicationType: string;
  style: string;
  publishMode?: PlannedPublicationPublishMode | null;
  notes?: string | null;
}

export interface PlannedPublicationProps {
  id: PlannedPublicationId;
  campaignId: CampaignId;
  presetPublicationId: CampaignPresetPublicationId | null;
  dayOffset: number;
  localTime: string;
  scheduledFor: Date;
  channel: string;
  language: string;
  publicationType: string;
  style: string;
  publishMode: PlannedPublicationPublishMode | null;
  status: PlannedPublicationStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeText(value?: string | null): string | null {
  const nextValue = value?.trim();
  return nextValue ? nextValue : null;
}

export class PlannedPublication {
  private constructor(
    public readonly id: PlannedPublicationId,
    public readonly campaignId: CampaignId,
    public readonly presetPublicationId: CampaignPresetPublicationId | null,
    public dayOffset: number,
    public localTime: string,
    public scheduledFor: Date,
    public readonly channel: string,
    public readonly language: string,
    public readonly publicationType: string,
    public readonly style: string,
    public publishMode: PlannedPublicationPublishMode | null,
    public status: PlannedPublicationStatus,
    public notes: string | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  static create(params: CreatePlannedPublicationParams): PlannedPublication {
    const now = new Date();
    const channel = normalizeToken(params.channel);
    return new PlannedPublication(
      generateId('planned_publication'),
      params.campaignId,
      params.presetPublicationId ?? null,
      params.dayOffset,
      params.localTime.trim(),
      params.scheduledFor,
      channel,
      normalizeToken(params.language),
      normalizePublicationTypeForChannel(channel, params.publicationType),
      normalizeToken(params.style),
      params.publishMode ?? null,
      'pending',
      normalizeText(params.notes),
      now,
      now,
    );
  }

  static rehydrate(props: PlannedPublicationProps): PlannedPublication {
    const channel = normalizeToken(props.channel);
    return new PlannedPublication(
      props.id,
      props.campaignId,
      props.presetPublicationId,
      props.dayOffset,
      props.localTime,
      props.scheduledFor,
      channel,
      props.language,
      normalizePublicationTypeForChannel(channel, props.publicationType),
      props.style,
      props.publishMode,
      props.status,
      props.notes,
      props.createdAt,
      props.updatedAt,
    );
  }

  markSourceBlocked(): void {
    this.status = 'source_blocked';
    this.updatedAt = new Date();
  }

  markPending(): void {
    this.status = 'pending';
    this.updatedAt = new Date();
  }

  markAdapting(): void {
    this.status = 'adapting';
    this.updatedAt = new Date();
  }

  markStage1Failed(): void {
    this.status = 'stage_1_failed';
    this.updatedAt = new Date();
  }

  markTranslating(): void {
    this.status = 'translating';
    this.updatedAt = new Date();
  }

  markStage2Failed(): void {
    this.status = 'stage_2_failed';
    this.updatedAt = new Date();
  }

  markReady(): void {
    this.status = 'ready';
    this.updatedAt = new Date();
  }

  block(): void {
    this.status = 'blocked';
    this.updatedAt = new Date();
  }

  markPublicationScheduled(): void {
    this.status = 'publication_scheduled';
    this.updatedAt = new Date();
  }

  markPublished(): void {
    this.status = 'published';
    this.updatedAt = new Date();
  }

  markExported(): void {
    this.status = 'exported';
    this.updatedAt = new Date();
  }

  markFailed(): void {
    this.status = 'failed';
    this.updatedAt = new Date();
  }

  reschedule(params: { scheduledFor: Date; dayOffset: number; localTime: string }): void {
    this.scheduledFor = params.scheduledFor;
    this.dayOffset = params.dayOffset;
    this.localTime = params.localTime.trim();
    this.updatedAt = new Date();
  }
}
