export class ReviseAdaptationSelectionCommand {
    articleId;
    adaptationId;
    currentContent;
    selectedText;
    instruction;
    constructor(articleId, adaptationId, currentContent, selectedText, instruction) {
        this.articleId = articleId;
        this.adaptationId = adaptationId;
        this.currentContent = currentContent;
        this.selectedText = selectedText;
        this.instruction = instruction;
    }
}
//# sourceMappingURL=revise-adaptation-selection.command.js.map