import type { ProjectId } from '../../domain/project.aggregate.js';

export class DeleteProjectCommand {
  constructor(public readonly projectId: ProjectId) {}
}
