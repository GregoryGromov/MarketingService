import type { ProjectId } from '../../domain/project.aggregate.js';
import type { ProjectMarkerPlacementId } from '../../domain/project-marker-placement.aggregate.js';

export class DeleteProjectMarkerPlacementCommand {
  constructor(
    public readonly projectId: ProjectId,
    public readonly placementId: ProjectMarkerPlacementId,
  ) {}
}
