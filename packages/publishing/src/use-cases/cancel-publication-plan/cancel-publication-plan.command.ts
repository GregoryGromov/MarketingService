import type { PublicationPlanId } from '../../domain/publication-plan.aggregate.js';

export class CancelPublicationPlanCommand {
  constructor(
    public readonly planId: PublicationPlanId,
  ) {}
}
