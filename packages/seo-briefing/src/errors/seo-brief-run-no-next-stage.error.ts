export class SeoBriefRunNoNextStageError extends Error {
  constructor(public readonly runId: string) {
    super(`SEO brief run ${runId} has no next stage to execute`);
    this.name = 'SeoBriefRunNoNextStageError';
  }
}
