export class EditAdaptationCommand {
    articleId;
    adaptationId;
    adaptedContent;
    constructor(articleId, adaptationId, adaptedContent) {
        this.articleId = articleId;
        this.adaptationId = adaptationId;
        this.adaptedContent = adaptedContent;
    }
}
//# sourceMappingURL=edit-adaptation.command.js.map