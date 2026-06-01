import type { SeoBriefRerunnableStage } from '../../domain/seo-brief-run-step.entity.js';

export interface RerunSeoBriefStageInput {
  stage: SeoBriefRerunnableStage;
  seoWeight?: number | null;
  productWeight?: number | null;
}

export class RerunSeoBriefStageCommand {
  constructor(
    public readonly runId: string,
    public readonly input: RerunSeoBriefStageInput,
  ) {}
}
