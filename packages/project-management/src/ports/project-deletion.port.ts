import type { ProjectId } from '../domain/project.aggregate.js';

export abstract class ProjectDeletionPort {
  abstract deleteProjectGraph(projectId: ProjectId): Promise<void>;
}
