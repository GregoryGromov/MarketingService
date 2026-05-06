import type { AdaptationId } from '../../domain/channel-adaptation.entity.js';
import type { ArticleId } from '../../domain/article.aggregate.js';

export class ReviseAdaptationSelectionCommand {
  constructor(
    public readonly articleId: ArticleId,
    public readonly adaptationId: AdaptationId,
    public readonly currentContent: string,
    public readonly selectedText: string,
    public readonly instruction: string,
  ) {}
}
