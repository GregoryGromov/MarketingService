import type { ArticleId } from '../../domain/article.aggregate.js';
import type { AdaptationId } from '../../domain/channel-adaptation.entity.js';
import type { AdaptationVersionId } from '../../domain/adaptation-version.entity.js';

export class SelectAdaptationVersionCommand {
  constructor(
    public readonly articleId: ArticleId,
    public readonly adaptationId: AdaptationId,
    public readonly versionId: AdaptationVersionId,
  ) {}
}
