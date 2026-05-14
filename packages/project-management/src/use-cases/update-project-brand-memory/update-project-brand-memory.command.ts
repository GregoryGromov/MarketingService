import type { BrandMemory, ProjectId } from '../../domain/project.aggregate.js';

export class UpdateProjectBrandMemoryCommand {
  constructor(
    public readonly projectId: ProjectId,
    public readonly brandMemory: Partial<BrandMemory>,
  ) {}
}
