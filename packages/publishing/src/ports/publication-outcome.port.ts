import type {
  PlannedPublicationId,
  PublicationId,
  PublicationStatus,
} from '../domain/publication.aggregate.js';

export interface SyncPublicationOutcomeParams {
  publicationId: PublicationId;
  plannedPublicationId: PlannedPublicationId | null;
  status: PublicationStatus;
  publishAt: Date;
  externalAccountRef: string | null;
  externalPostId: string | null;
  publishedAt: Date | null;
  errorMessage: string | null;
}

export interface SyncPublishingLinkRemovedParams {
  plannedPublicationId: PlannedPublicationId | null;
}

export abstract class PublicationOutcomePort {
  abstract syncPublicationOutcome(params: SyncPublicationOutcomeParams): Promise<void>;
  abstract syncPublishingLinkRemoved(params: SyncPublishingLinkRemovedParams): Promise<void>;
}
