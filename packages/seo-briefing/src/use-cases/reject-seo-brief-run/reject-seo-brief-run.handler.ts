import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import {
  type SeoBriefRunControlResult,
  SeoBriefRunControlService,
} from '../../services/seo-brief-run-control.service.js';
import { RejectSeoBriefRunCommand } from './reject-seo-brief-run.command.js';

@CommandHandler(RejectSeoBriefRunCommand)
export class RejectSeoBriefRunHandler
  implements ICommandHandler<RejectSeoBriefRunCommand, SeoBriefRunControlResult>
{
  constructor(private readonly control: SeoBriefRunControlService) {}

  async execute(command: RejectSeoBriefRunCommand): Promise<SeoBriefRunControlResult> {
    return this.control.reject({
      runId: command.runId,
      reason: command.input.reason,
    });
  }
}
