import { generateId, type TypedId } from '@marketing-service/shared';
import type { CampaignId } from './campaign.aggregate.js';
import type { PlannedPublicationId } from './planned-publication.entity.js';

export type CampaignArtifactId = TypedId<'campaign_artifact'>;
export type CampaignArtifactType = 'article' | 'adaptation' | 'translation' | 'publication';

export interface CreateCampaignArtifactParams {
  campaignId: CampaignId;
  plannedPublicationId?: PlannedPublicationId | null;
  artifactType: CampaignArtifactType;
  artifactId: string;
  role: string;
}

export interface CampaignArtifactProps {
  id: CampaignArtifactId;
  campaignId: CampaignId;
  plannedPublicationId: PlannedPublicationId | null;
  artifactType: CampaignArtifactType;
  artifactId: string;
  role: string;
  createdAt: Date;
}

export class CampaignArtifact {
  private constructor(
    public readonly id: CampaignArtifactId,
    public readonly campaignId: CampaignId,
    public readonly plannedPublicationId: PlannedPublicationId | null,
    public readonly artifactType: CampaignArtifactType,
    public readonly artifactId: string,
    public readonly role: string,
    public readonly createdAt: Date,
  ) {}

  static create(params: CreateCampaignArtifactParams): CampaignArtifact {
    return new CampaignArtifact(
      generateId('campaign_artifact'),
      params.campaignId,
      params.plannedPublicationId ?? null,
      params.artifactType,
      params.artifactId,
      params.role.trim(),
      new Date(),
    );
  }

  static rehydrate(props: CampaignArtifactProps): CampaignArtifact {
    return new CampaignArtifact(
      props.id,
      props.campaignId,
      props.plannedPublicationId,
      props.artifactType,
      props.artifactId,
      props.role,
      props.createdAt,
    );
  }
}
