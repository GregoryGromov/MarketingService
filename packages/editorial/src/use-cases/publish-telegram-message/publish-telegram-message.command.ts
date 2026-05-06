import type { AdaptationId, ArticleId } from '../../index.js';

export class PublishTelegramMessageCommand {
  constructor(
    public readonly articleId: ArticleId,
    public readonly adaptationId: AdaptationId,
    public readonly targetLanguage: string | null = null,
  ) {}
}
