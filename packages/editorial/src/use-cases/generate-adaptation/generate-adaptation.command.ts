import type { ArticleId } from '../../domain/article.aggregate.js';
import type { AdaptationId } from '../../domain/channel-adaptation.entity.js';

export class GenerateAdaptationCommand {
  constructor(
    public readonly articleId: ArticleId,
    public readonly adaptationId: AdaptationId,
    public readonly model: string | null = null,
  ) {}
}
