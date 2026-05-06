import type { AdaptationId } from '../../domain/channel-adaptation.entity.js';
import type { ArticleId } from '../../domain/article.aggregate.js';
export declare class GenerateAdaptationCommand {
    readonly articleId: ArticleId;
    readonly adaptationId: AdaptationId;
    constructor(articleId: ArticleId, adaptationId: AdaptationId);
}
//# sourceMappingURL=generate-adaptation.command.d.ts.map