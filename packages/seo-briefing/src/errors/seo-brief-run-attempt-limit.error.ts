export class SeoBriefRunAttemptLimitError extends Error {
  constructor(
    public readonly runId: string,
    public readonly stage: string,
    public readonly maxAttempts: number,
  ) {
    super(
      `SEO brief run ${runId} exhausted rerun limit for ${stage}. Max attempts: ${maxAttempts}`,
    );
    this.name = 'SeoBriefRunAttemptLimitError';
  }
}
