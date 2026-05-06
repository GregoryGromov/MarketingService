import type { ProjectId } from '../../domain/article.aggregate.js';

export class CreateArticleCommand {
  constructor(
    public readonly projectId: ProjectId,
    public readonly content: string,
    public readonly language: string,
    public readonly releasePlanSnapshot: Record<string, unknown> | null = null,
  ) {}
}
