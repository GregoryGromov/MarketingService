export class PublishTelegramMessageCommand {
    articleId;
    adaptationId;
    targetLanguage;
    constructor(articleId, adaptationId, targetLanguage = null) {
        this.articleId = articleId;
        this.adaptationId = adaptationId;
        this.targetLanguage = targetLanguage;
    }
}
//# sourceMappingURL=publish-telegram-message.command.js.map