import type { SeoBriefRun, SeoBriefRunId, SeoBriefRunStatus } from './seo-brief-run.aggregate.js';

export interface SeoBriefRunListFilters {
  limit?: number;
  projectId?: string | null;
  status?: SeoBriefRunStatus | null;
}

export abstract class SeoBriefRunRepository {
  abstract findById(id: SeoBriefRunId): Promise<SeoBriefRun | null>;
  abstract findByProjectId(projectId: string): Promise<SeoBriefRun[]>;
  abstract findMany(filters?: SeoBriefRunListFilters): Promise<SeoBriefRun[]>;
  abstract save(run: SeoBriefRun): Promise<void>;
}
