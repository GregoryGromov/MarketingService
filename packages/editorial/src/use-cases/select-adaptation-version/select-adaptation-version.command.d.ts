import type { ArticleId } from '../../domain/article.aggregate.js';
import type { AdaptationId } from '../../domain/channel-adaptation.entity.js';
import type { AdaptationVersionId } from '../../domain/adaptation-version.entity.js';
export declare class SelectAdaptationVersionCommand {
    readonly articleId: ArticleId;
    readonly adaptationId: AdaptationId;
    readonly versionId: AdaptationVersionId;
    constructor(articleId: ArticleId, adaptationId: AdaptationId, versionId: AdaptationVersionId);
}
//# sourceMappingURL=select-adaptation-version.command.d.ts.map