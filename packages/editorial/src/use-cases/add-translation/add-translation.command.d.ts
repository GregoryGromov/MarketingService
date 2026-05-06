import type { AdaptationId } from '../../domain/channel-adaptation.entity.js';
import type { ArticleId } from '../../domain/article.aggregate.js';
export declare class AddTranslationCommand {
    readonly articleId: ArticleId;
    readonly adaptationId: AdaptationId;
    readonly targetLanguage: string;
    constructor(articleId: ArticleId, adaptationId: AdaptationId, targetLanguage: string);
}
//# sourceMappingURL=add-translation.command.d.ts.map