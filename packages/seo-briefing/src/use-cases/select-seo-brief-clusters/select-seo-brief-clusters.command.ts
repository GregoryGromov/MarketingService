export class SelectSeoBriefClustersCommand {
  constructor(
    public readonly runId: string,
    public readonly selectedClusterName?: string | null,
  ) {}
}
