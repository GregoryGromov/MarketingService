export interface RejectSeoBriefRunInput {
  reason?: string | null;
}

export class RejectSeoBriefRunCommand {
  constructor(
    public readonly runId: string,
    public readonly input: RejectSeoBriefRunInput = {},
  ) {}
}
