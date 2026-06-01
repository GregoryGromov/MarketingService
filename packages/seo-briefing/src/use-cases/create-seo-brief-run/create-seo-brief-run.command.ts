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

export interface CreateSeoBriefRunInput {
  projectId?: string | null;
  topicSeed: string;
  market: CreateSeoBriefRunMarketInput;
  audience: string;
  product: CreateSeoBriefRunProductInput;
  keywordExpansionPrompt?: string | null;
  keyMessage?: string | null;
  audienceShift?: CreateSeoBriefRunAudienceShiftInput | null;
  cta?: string | null;
  seoProductBalance?: CreateSeoBriefRunSeoProductBalanceInput | null;
}

export class CreateSeoBriefRunCommand {
  constructor(public readonly input: CreateSeoBriefRunInput) {}
}
