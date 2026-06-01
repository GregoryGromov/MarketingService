export interface SeoBriefBrandMemoryDocument {
  title: string;
  url: string | null;
  notes: string | null;
}

export interface SeoBriefBrandMemorySnapshot {
  brandName: string | null;
  productDescription: string | null;
  targetAudience: string | null;
  approvedFacts: string[];
  forbiddenClaims: string[];
  glossary: Record<string, string>;
  bannedPhrases: string[];
  requiredPhrases: string[];
  brandDocs: SeoBriefBrandMemoryDocument[];
  adaptationPromptRules: SeoBriefJsonObject | null;
}

export type SeoBriefJsonPrimitive = string | number | boolean | null;
export type SeoBriefJsonValue =
  | SeoBriefJsonPrimitive
  | { [key: string]: SeoBriefJsonValue }
  | SeoBriefJsonValue[];
export type SeoBriefJsonObject = Record<string, SeoBriefJsonValue>;
