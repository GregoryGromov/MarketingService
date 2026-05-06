import type { ProjectId } from '../../domain/article.aggregate.js';
export declare class CreateArticleCommand {
    readonly projectId: ProjectId;
    readonly content: string;
    readonly language: string;
    readonly releasePlanSnapshot: Record<string, unknown> | null;
    constructor(projectId: ProjectId, content: string, language: string, releasePlanSnapshot?: Record<string, unknown> | null);
}
//# sourceMappingURL=create-article.command.d.ts.map