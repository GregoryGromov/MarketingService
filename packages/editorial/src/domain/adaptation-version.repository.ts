import type { AdaptationId } from './channel-adaptation.entity.js';
import type {
  AdaptationVersion,
  AdaptationVersionId,
} from './adaptation-version.entity.js';

export abstract class AdaptationVersionRepository {
  abstract findById(id: AdaptationVersionId): Promise<AdaptationVersion | null>;
  abstract findByAdaptationId(adaptationId: AdaptationId): Promise<AdaptationVersion[]>;
  abstract save(version: AdaptationVersion): Promise<void>;
  abstract deleteByAdaptationIdExcept(
    adaptationId: AdaptationId,
    keepIds: AdaptationVersionId[],
  ): Promise<void>;
}
