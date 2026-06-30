import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, type ICommandHandler } from '@nestjs/cqrs';
import { ApprovalItemRepository } from '../../domain/approval-item.repository.js';
import { AcknowledgeApprovalItemCommand } from './acknowledge-approval-item.command.js';

export interface AcknowledgeApprovalItemResult {
  approvalItemId: string;
  status: string;
}

@CommandHandler(AcknowledgeApprovalItemCommand)
export class AcknowledgeApprovalItemHandler
  implements
    ICommandHandler<
      AcknowledgeApprovalItemCommand,
      AcknowledgeApprovalItemResult
    >
{
  constructor(
    @Inject(ApprovalItemRepository)
    private readonly approvalItemRepository: ApprovalItemRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    command: AcknowledgeApprovalItemCommand,
  ): Promise<AcknowledgeApprovalItemResult> {
    const approvalItem = await this.approvalItemRepository.findById(
      command.approvalItemId,
    );

    if (!approvalItem) {
      throw new Error(`Approval item ${command.approvalItemId} not found`);
    }

    if (approvalItem.projectId !== command.projectId) {
      throw new Error(
        `Approval item ${command.approvalItemId} does not belong to project ${command.projectId}`,
      );
    }

    if (approvalItem.type !== 'publishing_exception') {
      throw new Error(
        `Approval item ${command.approvalItemId} cannot be acknowledged`,
      );
    }

    if (approvalItem.status === 'pending') {
      approvalItem.resolve();
      await this.approvalItemRepository.save(approvalItem);
      this.eventBus.publishAll(approvalItem.pullEvents());
    }

    return {
      approvalItemId: approvalItem.id,
      status: approvalItem.status,
    };
  }
}
