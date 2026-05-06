import type { AdaptationId } from '../../domain/channel-adaptation.entity.js';
import type { ArticleId } from '../../domain/article.aggregate.js';

export class EditAdaptationCommand {
  constructor(
    public readonly articleId: ArticleId,
    public readonly adaptationId: AdaptationId,
    public readonly adaptedContent: string,
  ) {}
}
