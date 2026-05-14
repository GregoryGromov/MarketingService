import type { ProjectId } from '../../domain/project.aggregate.js';

export class ListProjectCampaignsQuery {
  constructor(public readonly projectId: ProjectId) {}
}
