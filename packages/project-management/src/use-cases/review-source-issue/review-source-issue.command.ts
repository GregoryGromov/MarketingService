export type ReviewSourceIssueAction = 'accept_fix' | 'manual_edit' | 'ignore' | 'block';

export class ReviewSourceIssueCommand {
  constructor(
    public readonly campaignId: string,
    public readonly approvalItemId: string,
    public readonly action: ReviewSourceIssueAction,
    public readonly content?: string,
    public readonly language?: string,
    public readonly note?: string | null,
  ) {}
}
