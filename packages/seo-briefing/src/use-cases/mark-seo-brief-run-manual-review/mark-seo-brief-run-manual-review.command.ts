export interface MarkSeoBriefRunManualReviewInput {
  reason?: string | null;
}

export class MarkSeoBriefRunManualReviewCommand {
  constructor(
    public readonly runId: string,
    public readonly input: MarkSeoBriefRunManualReviewInput = {},
  ) {}
}
