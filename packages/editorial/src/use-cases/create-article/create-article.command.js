export class CreateArticleCommand {
    projectId;
    content;
    language;
    releasePlanSnapshot;
    constructor(projectId, content, language, releasePlanSnapshot = null) {
        this.projectId = projectId;
        this.content = content;
        this.language = language;
        this.releasePlanSnapshot = releasePlanSnapshot;
    }
}
//# sourceMappingURL=create-article.command.js.map