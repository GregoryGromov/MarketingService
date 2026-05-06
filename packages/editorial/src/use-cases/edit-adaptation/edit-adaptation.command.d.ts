import type { AdaptationId } from '../../domain/channel-adaptation.entity.js';
import type { ArticleId } from '../../domain/article.aggregate.js';
export declare class EditAdaptationCommand {
    readonly articleId: ArticleId;
    readonly adaptationId: AdaptationId;
    readonly adaptedContent: string;
    constructor(articleId: ArticleId, adaptationId: AdaptationId, adaptedContent: string);
}
//# sourceMappingURL=edit-adaptation.command.d.ts.map