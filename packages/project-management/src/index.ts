export {
  type CreateProjectParams,
  Project,
  type ProjectId,
  type ProjectProps,
} from './domain/project.aggregate.js';
export { ProjectRepository } from './domain/project.repository.js';
export {
  type CreateProjectMarkerParams,
  ProjectMarker,
  type ProjectMarkerId,
  type ProjectMarkerProps,
} from './domain/project-marker.aggregate.js';
export { ProjectMarkerRepository } from './domain/project-marker.repository.js';
export {
  type CreateProjectMarkerPlacementParams,
  ProjectMarkerPlacement,
  type ProjectMarkerPlacementId,
  type ProjectMarkerPlacementProps,
} from './domain/project-marker-placement.aggregate.js';
export { ProjectMarkerPlacementRepository } from './domain/project-marker-placement.repository.js';
export { ProjectManagementModule } from './project-management.module.js';
export { CreateProjectCommand } from './use-cases/create-project/create-project.command.js';
export { CreateProjectMarkerCommand } from './use-cases/create-project-marker/create-project-marker.command.js';
export { CreateProjectMarkerPlacementCommand } from './use-cases/create-project-marker-placement/create-project-marker-placement.command.js';
export { DeleteProjectMarkerCommand } from './use-cases/delete-project-marker/delete-project-marker.command.js';
export type { GetProjectResult } from './use-cases/get-project/get-project.handler.js';
export { GetProjectQuery } from './use-cases/get-project/get-project.query.js';
export type { GetProjectMarkerPlacementsResultItem } from './use-cases/get-project-marker-placements/get-project-marker-placements.handler.js';
export { GetProjectMarkerPlacementsQuery } from './use-cases/get-project-marker-placements/get-project-marker-placements.query.js';
export type { ListProjectMarkersResultItem } from './use-cases/list-project-markers/list-project-markers.handler.js';
export { ListProjectMarkersQuery } from './use-cases/list-project-markers/list-project-markers.query.js';
export type { ListProjectsResultItem } from './use-cases/list-projects/list-projects.handler.js';
export { ListProjectsQuery } from './use-cases/list-projects/list-projects.query.js';
