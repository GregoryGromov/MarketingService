export const DEFAULT_SEO_BRIEF_KEYWORD_EXPANSION_PROMPT = [
  'Generate realistic Google search queries, not article titles.',
  'Treat country as market context, not as a required keyword suffix.',
  'Most keywords should be generic and non-local; use a geo modifier only when local intent is natural.',
  'No more than 2 keywords may contain a country or city modifier.',
  'Include a mix of broad, specific, beginner-friendly, problem-aware, and commercial queries when relevant.',
  'Avoid awkward geo phrasing, brand names, year modifiers, hype, and scammy wording.',
  'Prefer natural search behavior over forced SEO patterns.',
].join('\n');

export function resolveSeoBriefKeywordExpansionPrompt(value?: string | null): string {
  const normalized = value?.trim();
  return normalized && normalized.length > 0
    ? normalized
    : DEFAULT_SEO_BRIEF_KEYWORD_EXPANSION_PROMPT;
}
