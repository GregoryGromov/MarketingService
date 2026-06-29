export const DEFAULT_SEO_BRIEF_KEYWORD_EXPANSION_PROMPT = [
  'Generate realistic Google search queries, not article titles.',
  'Treat the selected country as market context, not as a required keyword suffix.',
  'Most keywords should be generic and non-local. Use a geo modifier only when local intent is natural, such as P2P, exchange access, cash-in/cash-out behavior, or country-specific crypto questions.',
  'No more than 2 keywords may contain a country or city modifier.',
  'Generate queries that real cautious USDT holders would type before putting idle USDT into an earning product.',
  'The primary article intent is comparison and risk evaluation, not a broad listicle about what to do with USDT.',
  'Prioritize queries that compare CEX Earn products with on-chain USDT savings, or help users understand risks before depositing.',
  'Include queries around: CEX Earn vs on-chain savings; Binance Earn alternatives; Binance Earn USDT risks; Bybit Earn alternatives; OKX Earn USDT risks; Coinbase Earn alternatives; CEX Earn risks; USDT Earn risks; stablecoin yield risk; earn on USDT without trading; on-chain USDT savings; self-custody USDT yield; counterparty risk; smart contract risk; USDT lock-up products; USDT withdrawal risk; how to compare USDT Earn products.',
  'Include some broad queries such as "what to do with idle USDT" only if they can support the comparison article. Do not let broad "idle USDT" queries dominate the keyword set.',
  'Classify each query by intent: comparison, risk, alternative, beginner education, commercial investigation, or broad support.',
  'Avoid irrelevant or overly broad queries: what is crypto; how to buy bitcoin; best meme coins; crypto trading signals; airdrop farming; highest crypto APY; guaranteed stablecoin yield.',
  'Return keyword hypotheses only.',
].join('\n');

export function resolveSeoBriefKeywordExpansionPrompt(value?: string | null): string {
  const normalized = value?.trim();
  return normalized && normalized.length > 0
    ? normalized
    : DEFAULT_SEO_BRIEF_KEYWORD_EXPANSION_PROMPT;
}
