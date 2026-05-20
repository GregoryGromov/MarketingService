import type { ProjectId } from '../../domain/project.aggregate.js';

export class GetProjectApprovalInboxQuery {
  constructor(public readonly projectId: ProjectId) {}
}
