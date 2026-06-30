import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import {
  type SeoBriefRunControlResult,
  SeoBriefRunControlService,
} from '../../services/seo-brief-run-control.service.js';
import { ContinueSeoBriefRunCommand } from './continue-seo-brief-run.command.js';

@CommandHandler(ContinueSeoBriefRunCommand)
export class ContinueSeoBriefRunHandler
  implements ICommandHandler<ContinueSeoBriefRunCommand, SeoBriefRunControlResult>
{
  constructor(
    @Inject(SeoBriefRunControlService)
    private readonly control: SeoBriefRunControlService,
  ) {}

  async execute(command: ContinueSeoBriefRunCommand): Promise<SeoBriefRunControlResult> {
    return this.control.advance({
      runId: command.runId,
    });
  }
}
