import type { ProjectId } from '../../domain/project.aggregate.js';

export class GetProjectMarkerPlacementsQuery {
  constructor(
    public readonly projectId: ProjectId,
    public readonly from: Date | null = null,
    public readonly to: Date | null = null,
  ) {}
}
