import type { AdaptationId, ArticleId } from '../../index.js';
export declare class PublishTelegramMessageCommand {
    readonly articleId: ArticleId;
    readonly adaptationId: AdaptationId;
    readonly targetLanguage: string | null;
    constructor(articleId: ArticleId, adaptationId: AdaptationId, targetLanguage?: string | null);
}
//# sourceMappingURL=publish-telegram-message.command.d.ts.map