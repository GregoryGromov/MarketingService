import type { ProjectId } from '../../domain/project.aggregate.js';

export class ListProjectMarkersQuery {
  constructor(public readonly projectId: ProjectId) {}
}
