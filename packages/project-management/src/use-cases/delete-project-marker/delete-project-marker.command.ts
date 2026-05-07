import type { ProjectId, ProjectMarkerId } from '../../index.js';

export class DeleteProjectMarkerCommand {
  constructor(
    public readonly projectId: ProjectId,
    public readonly markerId: ProjectMarkerId,
  ) {}
}
