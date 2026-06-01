export class SeoBriefKeywordHypothesesNotFoundError extends Error {
  constructor(runId: string) {
    super(`SEO brief run ${runId} does not have saved keyword hypotheses`);
  }
}
