import type { CampaignId } from './campaign.aggregate.js';
import type {
  ApprovalItem,
  ApprovalItemId,
  ApprovalItemStatus,
} from './approval-item.aggregate.js';

export abstract class ApprovalItemRepository {
  abstract findById(id: ApprovalItemId): Promise<ApprovalItem | null>;
  abstract findByCampaignId(campaignId: CampaignId): Promise<ApprovalItem[]>;
  abstract findByCampaignIdAndStatus(
    campaignId: CampaignId,
    status: ApprovalItemStatus,
  ): Promise<ApprovalItem[]>;
  abstract save(item: ApprovalItem): Promise<void>;
}
