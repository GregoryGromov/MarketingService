import type { AdaptationId } from './channel-adaptation.entity.js';
import type { Translation, TranslationId } from './translation.aggregate.js';

export abstract class TranslationRepository {
  abstract findById(id: TranslationId): Promise<Translation | null>;
  abstract findByAdaptationId(adaptationId: AdaptationId): Promise<Translation[]>;
  abstract findByAdaptationIdAndTargetLanguage(
    adaptationId: AdaptationId,
    targetLanguage: string,
  ): Promise<Translation | null>;
  abstract save(translation: Translation): Promise<void>;
}
