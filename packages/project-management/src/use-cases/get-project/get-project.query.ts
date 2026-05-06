import type { ProjectId } from '../../domain/project.aggregate.js';

export class GetProjectQuery {
  constructor(public readonly projectId: ProjectId) {}
}
