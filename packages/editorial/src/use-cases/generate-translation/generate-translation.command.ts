import type { AdaptationId } from '../../domain/channel-adaptation.entity.js';
import type { ArticleId } from '../../domain/article.aggregate.js';
import type { TranslationId } from '../../domain/translation.aggregate.js';

export class GenerateTranslationCommand {
  constructor(
    public readonly articleId: ArticleId,
    public readonly adaptationId: AdaptationId,
    public readonly translationId: TranslationId,
  ) {}
}
