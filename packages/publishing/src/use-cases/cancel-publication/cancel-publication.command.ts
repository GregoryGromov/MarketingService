import type { PublicationId } from '../../domain/publication.aggregate.js';

export class CancelPublicationCommand {
  constructor(
    public readonly publicationId: PublicationId,
  ) {}
}
