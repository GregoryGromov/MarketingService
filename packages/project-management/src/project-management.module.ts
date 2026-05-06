import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateProjectHandler } from './use-cases/create-project/create-project.handler.js';
import { GetProjectHandler } from './use-cases/get-project/get-project.handler.js';
import { ListProjectsHandler } from './use-cases/list-projects/list-projects.handler.js';

@Module({
  imports: [CqrsModule],
  providers: [
    CreateProjectHandler,
    GetProjectHandler,
    ListProjectsHandler,
  ],
  exports: [],
})
export class ProjectManagementModule {}
