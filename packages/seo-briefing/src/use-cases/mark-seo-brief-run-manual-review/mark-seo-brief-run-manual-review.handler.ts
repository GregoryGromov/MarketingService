import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import {
  type SeoBriefRunControlResult,
  SeoBriefRunControlService,
} from '../../services/seo-brief-run-control.service.js';
import { MarkSeoBriefRunManualReviewCommand } from './mark-seo-brief-run-manual-review.command.js';

@CommandHandler(MarkSeoBriefRunManualReviewCommand)
export class MarkSeoBriefRunManualReviewHandler
  implements ICommandHandler<MarkSeoBriefRunManualReviewCommand, SeoBriefRunControlResult>
{
  constructor(
    @Inject(SeoBriefRunControlService)
    private readonly control: SeoBriefRunControlService,
  ) {}

  async execute(command: MarkSeoBriefRunManualReviewCommand): Promise<SeoBriefRunControlResult> {
    return this.control.markManualReview({
      runId: command.runId,
      reason: command.input.reason,
    });
  }
}
