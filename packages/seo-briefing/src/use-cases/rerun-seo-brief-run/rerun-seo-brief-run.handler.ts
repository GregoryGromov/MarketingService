import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import {
  type SeoBriefRunControlResult,
  SeoBriefRunControlService,
} from '../../services/seo-brief-run-control.service.js';
import { RerunSeoBriefRunCommand } from './rerun-seo-brief-run.command.js';

@CommandHandler(RerunSeoBriefRunCommand)
export class RerunSeoBriefRunHandler
  implements ICommandHandler<RerunSeoBriefRunCommand, SeoBriefRunControlResult>
{
  constructor(private readonly control: SeoBriefRunControlService) {}

  async execute(command: RerunSeoBriefRunCommand): Promise<SeoBriefRunControlResult> {
    return this.control.rerun({
      runId: command.runId,
      startStage: 'keyword_expansion',
      requestedBy: 'rerun_whole',
      seoWeight: command.input.seoWeight,
      productWeight: command.input.productWeight,
    });
  }
}
