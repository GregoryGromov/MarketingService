import type { AdaptationId } from '../../domain/channel-adaptation.entity.js';
import type { ArticleId } from '../../domain/article.aggregate.js';
export declare class ApproveAdaptationCommand {
    readonly articleId: ArticleId;
    readonly adaptationId: AdaptationId;
    constructor(articleId: ArticleId, adaptationId: AdaptationId);
}
//# sourceMappingURL=approve-adaptation.command.d.ts.map