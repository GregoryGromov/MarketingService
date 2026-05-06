import type { Project, ProjectId } from './project.aggregate.js';

export abstract class ProjectRepository {
  abstract findById(id: ProjectId): Promise<Project | null>;
  abstract findAll(): Promise<Project[]>;
  abstract save(project: Project): Promise<void>;
}
