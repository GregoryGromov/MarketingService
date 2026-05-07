import type { ProjectId } from '../../domain/project.aggregate.js';

export class CreateProjectMarkerCommand {
  constructor(
    public readonly projectId: ProjectId,
    public readonly title: string,
    public readonly notes: string | null = null,
  ) {}
}
