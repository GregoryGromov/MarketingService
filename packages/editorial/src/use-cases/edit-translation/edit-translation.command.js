export class EditTranslationCommand {
    articleId;
    adaptationId;
    translationId;
    translatedContent;
    constructor(articleId, adaptationId, translationId, translatedContent) {
        this.articleId = articleId;
        this.adaptationId = adaptationId;
        this.translationId = translationId;
        this.translatedContent = translatedContent;
    }
}
//# sourceMappingURL=edit-translation.command.js.map