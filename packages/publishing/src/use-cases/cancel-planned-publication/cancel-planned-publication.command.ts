import type { ArticleId, ChannelId } from '@marketing-service/editorial';

export class CancelPlannedPublicationCommand {
  constructor(
    public readonly articleId: ArticleId,
    public readonly channelId: ChannelId,
    public readonly targetLanguage: string,
  ) {}
}
