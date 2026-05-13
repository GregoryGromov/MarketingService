import type { CampaignId } from './campaign.aggregate.js';
import type { CampaignArtifactType } from './campaign-artifact.entity.js';
import type {
  QualityCheckResult,
  QualityCheckResultId,
} from './quality-check-result.entity.js';

export abstract class QualityCheckResultRepository {
  abstract findById(id: QualityCheckResultId): Promise<QualityCheckResult | null>;
  abstract findByCampaignId(campaignId: CampaignId): Promise<QualityCheckResult[]>;
  abstract findByArtifact(
    artifactType: CampaignArtifactType,
    artifactId: string,
  ): Promise<QualityCheckResult[]>;
  abstract save(result: QualityCheckResult): Promise<void>;
}
