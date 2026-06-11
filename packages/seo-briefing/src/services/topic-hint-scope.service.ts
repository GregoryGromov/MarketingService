export interface TopicHintScope {
  requiredTopicTerms: string[];
  topicCoverageInstruction: string;
}

const STOPWORDS = new Set([
  'about',
  'after',
  'also',
  'and',
  'are',
  'can',
  'for',
  'from',
  'get',
  'how',
  'into',
  'make',
  'market',
  'markets',
  'money',
  'people',
  'the',
  'their',
  'this',
  'through',
  'to',
  'use',
  'using',
  'what',
  'where',
  'who',
  'why',
  'with',
]);

const ENTITY_ALIASES: Array<{ aliases: string[]; patterns: RegExp[] }> = [
  {
    aliases: ['tron', 'trc20', 'usdt on tron', 'tron network'],
    patterns: [/\btron\b/i, /\btrc[-\s]?20\b/i],
  },
  {
    aliases: ['ethereum', 'erc20', 'usdt on ethereum', 'ethereum network'],
    patterns: [/\bethereum\b/i, /\berc[-\s]?20\b/i],
  },
  {
    aliases: ['solana', 'spl', 'usdt on solana', 'solana network'],
    patterns: [/\bsolana\b/i, /\bspl\b/i],
  },
  {
    aliases: ['bnb smart chain', 'bsc', 'bep20', 'usdt on bsc'],
    patterns: [/\bbnb\b/i, /\bbsc\b/i, /\bbep[-\s]?20\b/i],
  },
  {
    aliases: ['ton', 'the open network', 'usdt on ton'],
    patterns: [/\bton\b/i, /\bthe open network\b/i],
  },
  {
    aliases: ['polygon', 'matic', 'usdt on polygon'],
    patterns: [/\bpolygon\b/i, /\bmatic\b/i],
  },
  {
    aliases: ['arbitrum', 'usdt on arbitrum'],
    patterns: [/\barbitrum\b/i],
  },
  {
    aliases: ['optimism', 'usdt on optimism'],
    patterns: [/\boptimism\b/i, /\bop mainnet\b/i],
  },
];

export function deriveTopicHintScope(topicHint: string | null | undefined): TopicHintScope {
  const requiredTopicTerms = deriveRequiredTopicTerms(topicHint);
  return {
    requiredTopicTerms,
    topicCoverageInstruction: requiredTopicTerms.length
      ? [
          'Treat requiredTopicTerms as hard scope anchors extracted from topic_hint.',
          `The SEO plan must explicitly preserve at least one of: ${requiredTopicTerms.join(', ')}.`,
          'Generic adjacent queries may support the brief, but they must not replace the concrete topic scope.',
        ].join(' ')
      : 'No concrete topic anchors were extracted; use topic_hint as broad scope guidance.',
  };
}

export function deriveRequiredTopicTerms(topicHint: string | null | undefined): string[] {
  const normalized = normalizeTopicHint(topicHint);
  if (!normalized) {
    return [];
  }

  const terms: string[] = [];
  for (const entity of ENTITY_ALIASES) {
    if (entity.patterns.some((pattern) => pattern.test(normalized))) {
      terms.push(...entity.aliases);
    }
  }

  const phraseTerms = extractQuotedOrCompoundTerms(normalized);
  const tokenTerms = normalized
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim().toLowerCase())
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));

  return uniqueTerms([...terms, ...phraseTerms, ...tokenTerms]).slice(0, 12);
}

function normalizeTopicHint(topicHint: string | null | undefined): string {
  return typeof topicHint === 'string' ? topicHint.trim().replace(/\s+/g, ' ') : '';
}

function extractQuotedOrCompoundTerms(topicHint: string): string[] {
  const quoted = Array.from(topicHint.matchAll(/["'`“”‘’]([^"'`“”‘’]{3,80})["'`“”‘’]/g)).map(
    (match) => match[1],
  );
  const usdtCompounds = Array.from(
    topicHint.matchAll(/\b(?:usdt|tether)\s+(?:on|in|for|via)\s+[a-z0-9\s-]{3,40}/gi),
  ).map((match) => match[0]);

  return [...quoted, ...usdtCompounds]
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length >= 3);
}

function uniqueTerms(terms: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const term of terms) {
    const normalized = term.trim().toLowerCase().replace(/\s+/g, ' ');
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}
