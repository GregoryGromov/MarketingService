import type { ProjectId } from '../../domain/article.aggregate.js';

export class ListProjectArticlesQuery {
  constructor(public readonly projectId: ProjectId) {}
}
