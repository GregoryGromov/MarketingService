import type { SeoBriefRunStatus } from '../../domain/seo-brief-run.aggregate.js';

export interface ListSeoBriefRunsQueryFilters {
  limit?: number;
  projectId?: string | null;
  status?: SeoBriefRunStatus | null;
}

export class ListSeoBriefRunsQuery {
  constructor(public readonly filters: ListSeoBriefRunsQueryFilters = {}) {}
}
