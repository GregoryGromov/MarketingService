import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateProjectHandler } from './use-cases/create-project/create-project.handler.js';
import { CreateProjectMarkerHandler } from './use-cases/create-project-marker/create-project-marker.handler.js';
import { CreateProjectMarkerPlacementHandler } from './use-cases/create-project-marker-placement/create-project-marker-placement.handler.js';
import { DeleteProjectMarkerHandler } from './use-cases/delete-project-marker/delete-project-marker.handler.js';
import { GetProjectHandler } from './use-cases/get-project/get-project.handler.js';
import { GetProjectMarkerPlacementsHandler } from './use-cases/get-project-marker-placements/get-project-marker-placements.handler.js';
import { ListProjectMarkersHandler } from './use-cases/list-project-markers/list-project-markers.handler.js';
import { ListProjectsHandler } from './use-cases/list-projects/list-projects.handler.js';

@Module({
  imports: [CqrsModule],
  providers: [
    CreateProjectMarkerPlacementHandler,
    CreateProjectMarkerHandler,
    CreateProjectHandler,
    DeleteProjectMarkerHandler,
    GetProjectHandler,
    GetProjectMarkerPlacementsHandler,
    ListProjectMarkersHandler,
    ListProjectsHandler,
  ],
  exports: [],
})
export class ProjectManagementModule {}
