import { generateId, type TypedId } from '@marketing-service/shared';
import type { CampaignPresetId } from './campaign-preset.aggregate.js';
import { normalizePublicationTypeForChannel } from '../publication-type.js';

export type CampaignPresetPublicationId = TypedId<'campaign_preset_publication'>;

export interface CreateCampaignPresetPublicationParams {
  presetId: CampaignPresetId;
  dayOffset: number;
  localTime: string;
  channel: string;
  language: string;
  publicationType: string;
  style: string;
  position: number;
}

export interface CampaignPresetPublicationProps {
  id: CampaignPresetPublicationId;
  presetId: CampaignPresetId;
  dayOffset: number;
  localTime: string;
  channel: string;
  language: string;
  publicationType: string;
  style: string;
  position: number;
  createdAt: Date;
}

function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

export class CampaignPresetPublication {
  private constructor(
    public readonly id: CampaignPresetPublicationId,
    public readonly presetId: CampaignPresetId,
    public readonly dayOffset: number,
    public readonly localTime: string,
    public readonly channel: string,
    public readonly language: string,
    public readonly publicationType: string,
    public readonly style: string,
    public readonly position: number,
    public readonly createdAt: Date,
  ) {}

  static create(params: CreateCampaignPresetPublicationParams): CampaignPresetPublication {
    const channel = normalizeToken(params.channel);
    return new CampaignPresetPublication(
      generateId('campaign_preset_publication'),
      params.presetId,
      params.dayOffset,
      params.localTime.trim(),
      channel,
      normalizeToken(params.language),
      normalizePublicationTypeForChannel(channel, params.publicationType),
      normalizeToken(params.style),
      params.position,
      new Date(),
    );
  }

  static rehydrate(props: CampaignPresetPublicationProps): CampaignPresetPublication {
    const channel = normalizeToken(props.channel);
    return new CampaignPresetPublication(
      props.id,
      props.presetId,
      props.dayOffset,
      props.localTime,
      channel,
      props.language,
      normalizePublicationTypeForChannel(channel, props.publicationType),
      props.style,
      props.position,
      props.createdAt,
    );
  }
}
