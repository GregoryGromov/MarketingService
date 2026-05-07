import type { ProjectId } from './project.aggregate.js';
import type { ProjectMarker, ProjectMarkerId } from './project-marker.aggregate.js';

export abstract class ProjectMarkerRepository {
  abstract findById(id: ProjectMarkerId): Promise<ProjectMarker | null>;
  abstract findByProjectId(projectId: ProjectId): Promise<ProjectMarker[]>;
  abstract save(marker: ProjectMarker): Promise<void>;
  abstract deleteById(id: ProjectMarkerId): Promise<void>;
}
