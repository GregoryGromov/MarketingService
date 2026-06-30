export class SeoBriefSerpDerivedKeywordsNotFoundError extends Error {
  readonly name = 'SeoBriefSerpDerivedKeywordsNotFoundError';

  constructor(runId: string) {
    super(`SEO brief run ${runId} does not have SERP-derived keyword candidates yet`);
  }
}
