export interface RerunSeoBriefRunInput {
  seoWeight?: number | null;
  productWeight?: number | null;
}

export class RerunSeoBriefRunCommand {
  constructor(
    public readonly runId: string,
    public readonly input: RerunSeoBriefRunInput = {},
  ) {}
}
