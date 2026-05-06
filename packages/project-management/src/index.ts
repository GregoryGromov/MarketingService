export { ProjectManagementModule } from './project-management.module.js';
export {
  Project,
  type CreateProjectParams,
  type ProjectId,
  type ProjectProps,
} from './domain/project.aggregate.js';
export { ProjectRepository } from './domain/project.repository.js';
export { CreateProjectCommand } from './use-cases/create-project/create-project.command.js';
export { GetProjectQuery } from './use-cases/get-project/get-project.query.js';
export type { GetProjectResult } from './use-cases/get-project/get-project.handler.js';
export { ListProjectsQuery } from './use-cases/list-projects/list-projects.query.js';
export type { ListProjectsResultItem } from './use-cases/list-projects/list-projects.handler.js';
