import type { TranslationId } from './translation.aggregate.js';
import type {
  TranslationVersion,
  TranslationVersionId,
} from './translation-version.entity.js';

export abstract class TranslationVersionRepository {
  abstract findById(id: TranslationVersionId): Promise<TranslationVersion | null>;
  abstract findByTranslationId(translationId: TranslationId): Promise<TranslationVersion[]>;
  abstract save(version: TranslationVersion): Promise<void>;
  abstract deleteByTranslationIdExcept(
    translationId: TranslationId,
    keepIds: TranslationVersionId[],
  ): Promise<void>;
}
