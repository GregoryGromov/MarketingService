import {
  AggregateRoot,
  createDomainEvent,
  generateId,
  type TypedId,
} from '@marketing-service/shared';
import { CampaignPresetPublication } from './campaign-preset-publication.entity.js';

export type CampaignPresetId = TypedId<'campaign_preset'>;

export interface CreateCampaignPresetParams {
  name: string;
  description: string;
  sourceLanguage: string;
  sourceType: string;
  publications?: CampaignPresetPublication[];
  isActive?: boolean;
  isSystem?: boolean;
}

export interface CampaignPresetProps {
  id: CampaignPresetId;
  name: string;
  description: string;
  sourceLanguage: string;
  sourceType: string;
  publications: CampaignPresetPublication[];
  isActive: boolean;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateCampaignPresetParams {
  name: string;
  description: string;
  sourceLanguage: string;
  sourceType: string;
  isActive: boolean;
}

function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

function sortPublications(
  publications: CampaignPresetPublication[],
): CampaignPresetPublication[] {
  return [...publications].sort((left, right) => left.position - right.position);
}

export class CampaignPreset extends AggregateRoot {
  private constructor(
    public readonly id: CampaignPresetId,
    public name: string,
    public description: string,
    public sourceLanguage: string,
    public sourceType: string,
    public publications: CampaignPresetPublication[],
    public isActive: boolean,
    public isSystem: boolean,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {
    super();
  }

  static create(params: CreateCampaignPresetParams): CampaignPreset {
    const now = new Date();
    const preset = new CampaignPreset(
      generateId('campaign_preset'),
      params.name.trim(),
      params.description.trim(),
      normalizeToken(params.sourceLanguage),
      normalizeToken(params.sourceType),
      sortPublications(params.publications ?? []),
      params.isActive ?? true,
      params.isSystem ?? true,
      now,
      now,
    );

    preset.addEvent(
      createDomainEvent({
        eventName: 'CampaignPresetCreated',
        aggregateId: preset.id,
      }),
    );

    return preset;
  }

  static rehydrate(props: CampaignPresetProps): CampaignPreset {
    return new CampaignPreset(
      props.id,
      props.name,
      props.description,
      props.sourceLanguage,
      props.sourceType,
      sortPublications(props.publications),
      props.isActive,
      props.isSystem,
      props.createdAt,
      props.updatedAt,
    );
  }

  activate(): void {
    if (this.isActive) {
      return;
    }

    this.isActive = true;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    if (!this.isActive) {
      return;
    }

    this.isActive = false;
    this.updatedAt = new Date();
  }

  update(params: UpdateCampaignPresetParams): void {
    this.name = params.name.trim();
    this.description = params.description.trim();
    this.sourceLanguage = normalizeToken(params.sourceLanguage);
    this.sourceType = normalizeToken(params.sourceType);
    this.isActive = params.isActive;
    this.updatedAt = new Date();
  }

  replacePublications(publications: CampaignPresetPublication[]): void {
    this.publications = sortPublications(publications);
    this.updatedAt = new Date();
  }
}
