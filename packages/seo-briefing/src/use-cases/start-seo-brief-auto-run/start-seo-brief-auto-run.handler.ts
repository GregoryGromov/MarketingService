import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import {
  type SeoBriefRunControlResult,
  SeoBriefRunControlService,
} from '../../services/seo-brief-run-control.service.js';
import { StartSeoBriefAutoRunCommand } from './start-seo-brief-auto-run.command.js';

@CommandHandler(StartSeoBriefAutoRunCommand)
export class StartSeoBriefAutoRunHandler
  implements ICommandHandler<StartSeoBriefAutoRunCommand, SeoBriefRunControlResult>
{
  constructor(
    @Inject(SeoBriefRunControlService)
    private readonly control: SeoBriefRunControlService,
  ) {}

  async execute(command: StartSeoBriefAutoRunCommand): Promise<SeoBriefRunControlResult> {
    return this.control.runAutoUntilSelection({
      runId: command.runId,
    });
  }
}
