import type { ArticleId } from '../../domain/article.aggregate.js';
import type { ChannelId } from '../../domain/channel-adaptation.entity.js';
export declare class AddAdaptationCommand {
    readonly articleId: ArticleId;
    readonly channelId: ChannelId;
    readonly displayName: string;
    readonly promptInstructions: string | null;
    constructor(articleId: ArticleId, channelId: ChannelId, displayName: string, promptInstructions: string | null);
}
//# sourceMappingURL=add-adaptation.command.d.ts.map