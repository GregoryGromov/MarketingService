import type { ProjectId } from '../../domain/article.aggregate';

export class CreateArticleCommand {
  constructor(
    public readonly projectId: ProjectId,
    public readonly content: string,
    public readonly language: string,
  ) {}
}
