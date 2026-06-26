export interface SeoBriefBrandMemoryDocument {
  title: string;
  url: string | null;
  notes: string | null;
}

export interface SeoBriefCompetitorsMemory {
  mustInclude: string[];
  optional: string[];
  exclude: string[];
}

export interface SeoBriefCompetitorKeywordMapMemory {
  generatedAt: string;
  nextRefreshAt?: string | null;
  refreshIntervalHours?: number | null;
  competitorKeywordsJsonId: string;
  market: {
    country: string;
    language: string;
    locationName: string | null;
  };
  targets: string[];
  targetCount: number;
  itemCount: number;
  deduplicatedKeywordCount: number;
  targetResults: SeoBriefJsonValue[];
  items: SeoBriefJsonValue[];
  allKeywordsFlat: SeoBriefJsonValue[];
}

export interface SeoBriefBrandMemorySnapshot {
  brandName: string | null;
  productDescription: string | null;
  targetAudience: string | null;
  targetAudiences?: string[];
  keyMessage?: string | null;
  defaultCta?: string | null;
  brandConstraints?: string[];
  claimsConstraints?: string[];
  approvedFacts: string[];
  forbiddenClaims: string[];
  glossary: Record<string, string>;
  bannedPhrases: string[];
  requiredPhrases: string[];
  brandDocs: SeoBriefBrandMemoryDocument[];
  adaptationPromptRules: SeoBriefJsonObject | null;
  seoCompetitors?: SeoBriefCompetitorsMemory;
  seoCompetitorKeywordMap?: SeoBriefCompetitorKeywordMapMemory | null;
}

export type SeoBriefJsonPrimitive = string | number | boolean | null;
export type SeoBriefJsonValue =
  | SeoBriefJsonPrimitive
  | { [key: string]: SeoBriefJsonValue }
  | SeoBriefJsonValue[];
export type SeoBriefJsonObject = Record<string, SeoBriefJsonValue>;
