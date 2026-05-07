import type { ProjectId } from '@marketing-service/editorial';

export class GetProjectPublicationPlansQuery {
  constructor(
    public readonly projectId: ProjectId,
    public readonly from: Date | null = null,
    public readonly to: Date | null = null,
  ) {}
}
