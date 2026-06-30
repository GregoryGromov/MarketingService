import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import {
  type SeoBriefRunControlResult,
  SeoBriefRunControlService,
} from '../../services/seo-brief-run-control.service.js';
import { RegenerateSeoBriefCommand } from './regenerate-seo-brief.command.js';

@CommandHandler(RegenerateSeoBriefCommand)
export class RegenerateSeoBriefHandler
  implements ICommandHandler<RegenerateSeoBriefCommand, SeoBriefRunControlResult>
{
  constructor(
    @Inject(SeoBriefRunControlService)
    private readonly control: SeoBriefRunControlService,
  ) {}

  async execute(command: RegenerateSeoBriefCommand): Promise<SeoBriefRunControlResult> {
    return this.control.rerun({
      runId: command.runId,
      startStage: 'brief_generation',
      requestedBy: 'regenerate_brief',
    });
  }
}
