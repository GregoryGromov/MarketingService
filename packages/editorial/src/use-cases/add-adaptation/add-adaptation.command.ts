import type { ArticleId } from '../../domain/article.aggregate.js';
import type { ChannelId } from '../../domain/channel-adaptation.entity.js';

export class AddAdaptationCommand {
  constructor(
    public readonly articleId: ArticleId,
    public readonly channelId: ChannelId,
    public readonly displayName: string,
    public readonly promptInstructions: string | null,
  ) {}
}
