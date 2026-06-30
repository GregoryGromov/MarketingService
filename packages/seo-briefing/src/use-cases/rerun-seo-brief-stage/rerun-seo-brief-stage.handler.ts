import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import {
  type SeoBriefRunControlResult,
  SeoBriefRunControlService,
} from '../../services/seo-brief-run-control.service.js';
import { RerunSeoBriefStageCommand } from './rerun-seo-brief-stage.command.js';

@CommandHandler(RerunSeoBriefStageCommand)
export class RerunSeoBriefStageHandler
  implements ICommandHandler<RerunSeoBriefStageCommand, SeoBriefRunControlResult>
{
  constructor(
    @Inject(SeoBriefRunControlService)
    private readonly control: SeoBriefRunControlService,
  ) {}

  async execute(command: RerunSeoBriefStageCommand): Promise<SeoBriefRunControlResult> {
    return this.control.rerun({
      runId: command.runId,
      startStage: command.input.stage,
      requestedBy: 'rerun_stage',
      seoWeight: command.input.seoWeight,
      productWeight: command.input.productWeight,
    });
  }
}
