import type { SeoBriefRunId } from '../../domain/seo-brief-run.aggregate.js';

export class GetSeoBriefRunQuery {
  constructor(public readonly runId: SeoBriefRunId) {}
}
