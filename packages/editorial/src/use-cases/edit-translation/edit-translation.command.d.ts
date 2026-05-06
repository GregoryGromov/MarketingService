import type { AdaptationId } from '../../domain/channel-adaptation.entity.js';
import type { ArticleId } from '../../domain/article.aggregate.js';
import type { TranslationId } from '../../domain/translation.aggregate.js';
export declare class EditTranslationCommand {
    readonly articleId: ArticleId;
    readonly adaptationId: AdaptationId;
    readonly translationId: TranslationId;
    readonly translatedContent: string;
    constructor(articleId: ArticleId, adaptationId: AdaptationId, translationId: TranslationId, translatedContent: string);
}
//# sourceMappingURL=edit-translation.command.d.ts.map