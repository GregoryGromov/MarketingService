import type { AdaptationId, ArticleId } from '@marketing-service/editorial';

export class ScheduleTelegramPublicationCommand {
  constructor(
    public readonly articleId: ArticleId,
    public readonly adaptationId: AdaptationId,
    public readonly targetLanguage: string,
    public readonly publishAt: Date,
  ) {}
}
