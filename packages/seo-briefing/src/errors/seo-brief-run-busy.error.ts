import type { SeoBriefRunStatus } from '../domain/seo-brief-run.aggregate.js';

export class SeoBriefRunBusyError extends Error {
  constructor(
    public readonly runId: string,
    public readonly status: SeoBriefRunStatus,
  ) {
    super(`SEO brief run ${runId} cannot be changed while status is ${status}`);
    this.name = 'SeoBriefRunBusyError';
  }
}
