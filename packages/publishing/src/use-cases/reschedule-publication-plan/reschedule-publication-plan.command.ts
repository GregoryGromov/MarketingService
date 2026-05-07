import type { PublicationPlanId } from '../../domain/publication-plan.aggregate.js';

export class ReschedulePublicationPlanCommand {
  constructor(
    public readonly planId: PublicationPlanId,
    public readonly publishAt: Date,
  ) {}
}
