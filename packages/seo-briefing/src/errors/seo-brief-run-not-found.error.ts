export class SeoBriefRunNotFoundError extends Error {
  constructor(public readonly runId: string) {
    super(`SEO brief run ${runId} not found`);
    this.name = 'SeoBriefRunNotFoundError';
  }
}
