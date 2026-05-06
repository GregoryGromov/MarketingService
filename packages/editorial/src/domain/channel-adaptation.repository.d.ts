import type { ArticleId } from './article.aggregate.js';
import type { AdaptationId, ChannelAdaptation, ChannelId } from './channel-adaptation.entity.js';
export declare abstract class ChannelAdaptationRepository {
    abstract findById(id: AdaptationId): Promise<ChannelAdaptation | null>;
    abstract findByArticleId(articleId: ArticleId): Promise<ChannelAdaptation[]>;
    abstract findByArticleIdAndChannelId(articleId: ArticleId, channelId: ChannelId): Promise<ChannelAdaptation | null>;
    abstract save(adaptation: ChannelAdaptation): Promise<void>;
}
//# sourceMappingURL=channel-adaptation.repository.d.ts.map