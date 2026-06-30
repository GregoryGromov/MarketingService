import type { ICommand } from '@nestjs/cqrs';
import type { SeoBriefJsonValue } from '../../domain/seo-briefing.types.js';

export class UpdateFinalSeoBriefCommand implements ICommand {
  constructor(
    public readonly runId: string,
    public readonly briefPayload: SeoBriefJsonValue,
  ) {}
}
