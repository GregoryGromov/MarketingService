import type { ProjectId } from './project.aggregate.js';
import type { ProjectMarkerId } from './project-marker.aggregate.js';
import type {
  ProjectMarkerPlacement,
  ProjectMarkerPlacementId,
} from './project-marker-placement.aggregate.js';

export abstract class ProjectMarkerPlacementRepository {
  abstract findById(id: ProjectMarkerPlacementId): Promise<ProjectMarkerPlacement | null>;
  abstract findByProjectId(
    projectId: ProjectId,
    range?: { from?: Date | null; to?: Date | null },
  ): Promise<ProjectMarkerPlacement[]>;
  abstract findByLogicalKey(
    markerId: ProjectMarkerId,
    channelId: string,
    targetLanguage: string,
    publishAt: Date,
    marketCountry?: string | null,
  ): Promise<ProjectMarkerPlacement | null>;
  abstract save(placement: ProjectMarkerPlacement): Promise<void>;
  abstract deleteById(id: ProjectMarkerPlacementId): Promise<void>;
  abstract deleteByMarkerId(markerId: ProjectMarkerId): Promise<void>;
}
