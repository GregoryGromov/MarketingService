export class AddAdaptationCommand {
    articleId;
    channelId;
    displayName;
    promptInstructions;
    constructor(articleId, channelId, displayName, promptInstructions) {
        this.articleId = articleId;
        this.channelId = channelId;
        this.displayName = displayName;
        this.promptInstructions = promptInstructions;
    }
}
//# sourceMappingURL=add-adaptation.command.js.map