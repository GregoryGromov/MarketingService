export const SEO_BRIEF_OPERATIONAL_LIMITS = {
  duplicateScanLimit: 50,
  duplicateWindowMs: 30 * 60 * 1000,
  keywordExpansionLimit: 9,
  relatedKeywordLimit: 10,
  relatedKeywordSeedLimit: 3,
  serpResearchKeywordLimit: 3,
  serpResultDepth: 5,
  domainMetricsLimit: 5,
  onpageTargetLimit: 3,
  maxKeywordUniverseItems: 20,
  maxClustersToScore: 5,
  maxManualRerunAttemptsPerStage: 3,
  minFinalClusterScore: 45,
  minProductScore: 40,
} as const;

export type SeoBriefOperationalLimits = typeof SEO_BRIEF_OPERATIONAL_LIMITS;
