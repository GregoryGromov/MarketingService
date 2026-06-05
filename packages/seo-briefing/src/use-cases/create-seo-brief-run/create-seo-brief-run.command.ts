export interface CreateSeoBriefRunMarketInput {
  country: string;
  language: string;
  locationName?: string | null;
}

export interface CreateSeoBriefRunProductInput {
  name: string;
  description: string;
}

export interface CreateSeoBriefRunAudienceShiftInput {
  before: string;
  after: string;
}

export interface CreateSeoBriefRunSeoProductBalanceInput {
  seoWeight?: number | null;
  productWeight?: number | null;
}

export interface CreateSeoBriefRunKnownCompetitorsInput {
  mustInclude?: string[] | null;
  optional?: string[] | null;
  exclude?: string[] | null;
}

export interface CreateSeoBriefRunInput {
  projectId?: string | null;
  aiModelMode?: 'flash' | 'pro' | 'pro_thinking' | null;
  topicHint?: string | null;
  /**
   * Compatibility field for the first SEO brief iteration.
   * New UI/API clients should send topicHint.
   */
  topicSeed?: string | null;
  hypothesesCount?: number | null;
  serpEnrichmentCount?: number | null;
  competitorKeywordsJsonId?: string | null;
  market: CreateSeoBriefRunMarketInput;
  audience: string;
  userPains?: string[] | null;
  userScenarios?: string[] | null;
  product: CreateSeoBriefRunProductInput;
  keywordExpansionPrompt?: string | null;
  keyMessage?: string | null;
  knownCompetitors?: CreateSeoBriefRunKnownCompetitorsInput | null;
  brandConstraints?: string[] | null;
  claimsConstraints?: string[] | null;
  preferredAngle?: string | null;
  excludedTopics?: string[] | null;
  campaignContext?: string | null;
  audienceShift?: CreateSeoBriefRunAudienceShiftInput | null;
  cta?: string | null;
  seoProductBalance?: CreateSeoBriefRunSeoProductBalanceInput | null;
}

export class CreateSeoBriefRunCommand {
  constructor(public readonly input: CreateSeoBriefRunInput) {}
}
