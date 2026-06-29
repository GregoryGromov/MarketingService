export interface CreateSeoBriefRunMarketInput {
  country: string;
  language: string;
  locationName?: string | null;
}

export interface CreateSeoBriefRunProductInput {
  name?: string | null;
  description?: string | null;
}

export interface CreateSeoBriefRunAudienceShiftInput {
  before: string;
  after: string;
}

export interface CreateSeoBriefRunSeoProductBalanceInput {
  seoWeight?: number | null;
  productWeight?: number | null;
}

export interface CreateSeoBriefRunDeepSeekPricingInput {
  inputUsdPerMillionTokens?: number | null;
  outputUsdPerMillionTokens?: number | null;
}

export interface CreateSeoBriefRunKnownCompetitorsInput {
  mustInclude?: string[] | null;
  optional?: string[] | null;
  exclude?: string[] | null;
}

export interface CreateSeoBriefRunInput {
  projectId?: string | null;
  aiModelMode?: 'flash' | 'pro' | 'pro_thinking' | null;
  aiModel?: string | null;
  workflowMode?: 'manual' | 'auto_until_selection' | null;
  topicHint?: string | null;
  /**
   * Compatibility field for the first SEO brief iteration.
   * New UI/API clients should send topicHint.
   */
  topicSeed?: string | null;
  hypothesesCount?: number | null;
  serpEnrichmentCount?: number | null;
  requestTimeoutMs?: number | null;
  coverImageUrl?: string | null;
  deepSeekPricing?: CreateSeoBriefRunDeepSeekPricingInput | null;
  competitorKeywordsJsonId?: string | null;
  market: CreateSeoBriefRunMarketInput;
  audience?: string | null;
  userPains?: string[] | null;
  userScenarios?: string[] | null;
  product?: CreateSeoBriefRunProductInput | null;
  keywordExpansionPrompt?: string | null;
  promptInstructionOverrides?: Record<string, string> | null;
  keyMessage?: string | null;
  knownCompetitors?: CreateSeoBriefRunKnownCompetitorsInput | null;
  brandConstraints?: string[] | null;
  claimsConstraints?: string[] | null;
  approvedFacts?: string[] | null;
  forbiddenClaims?: string[] | null;
  bannedPhrases?: string[] | null;
  requiredPhrases?: string[] | null;
  preferredAngle?: string | null;
  excludedTopics?: string[] | null;
  campaignContext?: string | null;
  audienceShift?: CreateSeoBriefRunAudienceShiftInput | null;
  cta?: string | null;
  conclusionDirection?: string | null;
  seoProductBalance?: CreateSeoBriefRunSeoProductBalanceInput | null;
}

export class CreateSeoBriefRunCommand {
  constructor(public readonly input: CreateSeoBriefRunInput) {}
}
