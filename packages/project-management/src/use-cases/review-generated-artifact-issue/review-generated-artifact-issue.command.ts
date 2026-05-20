import type { CampaignId } from '../../domain/campaign.aggregate.js';

export type ReviewGeneratedArtifactIssueAction = 'fix_ai' | 'manual_edit' | 'ignore';

export class ReviewGeneratedArtifactIssueCommand {
  constructor(
    public readonly campaignId: CampaignId,
    public readonly approvalItemId: string,
    public readonly action: ReviewGeneratedArtifactIssueAction,
    public readonly content?: string,
    public readonly note?: string | null,
  ) {}
}
