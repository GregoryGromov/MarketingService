import type { AdaptationId } from '../../domain/channel-adaptation.entity.js';
import type { ArticleId } from '../../domain/article.aggregate.js';
export declare class ReviseAdaptationSelectionCommand {
    readonly articleId: ArticleId;
    readonly adaptationId: AdaptationId;
    readonly currentContent: string;
    readonly selectedText: string;
    readonly instruction: string;
    constructor(articleId: ArticleId, adaptationId: AdaptationId, currentContent: string, selectedText: string, instruction: string);
}
//# sourceMappingURL=revise-adaptation-selection.command.d.ts.map