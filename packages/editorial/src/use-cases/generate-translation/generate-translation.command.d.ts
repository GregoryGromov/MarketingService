import type { AdaptationId } from '../../domain/channel-adaptation.entity.js';
import type { ArticleId } from '../../domain/article.aggregate.js';
import type { TranslationId } from '../../domain/translation.aggregate.js';
export declare class GenerateTranslationCommand {
    readonly articleId: ArticleId;
    readonly adaptationId: AdaptationId;
    readonly translationId: TranslationId;
    constructor(articleId: ArticleId, adaptationId: AdaptationId, translationId: TranslationId);
}
//# sourceMappingURL=generate-translation.command.d.ts.map