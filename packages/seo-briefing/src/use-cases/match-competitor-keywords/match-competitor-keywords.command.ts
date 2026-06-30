export type CompetitorKeywordMatchingMode = 'algorithmic' | 'ai';

export class MatchCompetitorKeywordsCommand {
  constructor(
    public readonly runId: string,
    public readonly mode: CompetitorKeywordMatchingMode = 'algorithmic',
  ) {}
}
