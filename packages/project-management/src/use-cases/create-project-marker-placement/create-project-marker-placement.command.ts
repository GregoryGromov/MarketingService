import type { ProjectId } from '../../domain/project.aggregate.js';
import type { ProjectMarkerId } from '../../domain/project-marker.aggregate.js';

export class CreateProjectMarkerPlacementCommand {
  constructor(
    public readonly projectId: ProjectId,
    public readonly markerId: ProjectMarkerId,
    public readonly channelId: string,
    public readonly targetLanguage: string,
    public readonly publishAt: Date,
  ) {}
}
