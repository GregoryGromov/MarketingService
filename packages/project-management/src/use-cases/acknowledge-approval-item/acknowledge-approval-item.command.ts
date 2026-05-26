import type { ApprovalItemId } from '../../domain/approval-item.aggregate.js';
import type { ProjectId } from '../../domain/project.aggregate.js';

export class AcknowledgeApprovalItemCommand {
  constructor(
    public readonly projectId: ProjectId,
    public readonly approvalItemId: ApprovalItemId,
  ) {}
}
