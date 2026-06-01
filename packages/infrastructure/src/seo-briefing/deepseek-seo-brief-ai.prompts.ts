import type {
  BuildProductBridgeParams,
  ClusterKeywordsParams,
  ExpandKeywordsParams,
  ExplainClusterSelectionParams,
  GenerateSeoBriefParams,
  SelectRelatedKeywordsParams,
  TriageKeywordsParams,
} from '@marketing-service/seo-briefing';
import {
  DEFAULT_SEO_BRIEF_KEYWORD_EXPANSION_PROMPT,
  resolveSeoBriefKeywordExpansionPrompt,
} from '@marketing-service/seo-briefing';

interface SeoBriefStructuredPrompt {
  operation: string;
  promptVersion: string;
  temperature: number;
  systemPrompt: string;
  userPrompt: string;
}

export const SEO_BRIEF_AI_PROMPT_VERSIONS = {
  expandKeywords: 'seo-brief.expand-keywords.v3',
  triageKeywords: 'seo-brief.triage-keywords.v1',
  clusterKeywords: 'seo-brief.cluster-keywords.v1',
  selectRelatedKeywords: 'seo-brief.select-related-keywords.v1',
  buildProductBridge: 'seo-brief.product-bridge.v1',
  explainClusterSelection: 'seo-brief.cluster-selection.v1',
  generateSeoBrief: 'seo-brief.generate-brief.v1',
} as const;

export function buildExpandKeywordsPrompt(params: ExpandKeywordsParams): SeoBriefStructuredPrompt {
  const keywordExpansionPrompt = resolveSeoBriefKeywordExpansionPrompt(
    params.keywordExpansionPrompt,
  );

  return {
    operation: 'expandKeywords',
    promptVersion: SEO_BRIEF_AI_PROMPT_VERSIONS.expandKeywords,
    temperature: 0.2,
    systemPrompt: [
      'You are an SEO research strategist.',
      'Return only valid JSON.',
      'Do not use markdown or code fences.',
      'Schema:',
      '{"hypotheses":[{"keyword":"string","intent":"informational|commercial|transactional|navigational","rationale":"string","audienceFit":"string"}]}',
      'Generate exactly the requested number of initial keyword hypotheses for further SEO validation.',
      'Generate realistic Google search queries, not article titles.',
      'Use the target language from the input.',
      'Treat country as market context, not as a required keyword suffix.',
      'Do not append the country name to most keywords.',
      'Only include a geo modifier when local intent is clearly natural and realistic.',
      'No more than 2 keywords may contain a country or city modifier.',
      'Include a mix of broad informational, specific, beginner-friendly, problem-aware, and commercial queries when relevant.',
      'Avoid duplicated or near-duplicated keywords.',
      'Avoid awkward geo phrasing, year modifiers, brand names, hype, and scammy wording.',
      'Do not estimate search volume, competition, CPC, or ranking difficulty.',
      'Keep rationale short and practical.',
      'Keep audienceFit short and specific to the target audience.',
      `Default operator guidance:\n${DEFAULT_SEO_BRIEF_KEYWORD_EXPANSION_PROMPT}`,
    ].join('\n'),
    userPrompt: createExpandKeywordsUserPrompt(params, keywordExpansionPrompt),
  };
}

export function buildTriageKeywordsPrompt(params: TriageKeywordsParams): SeoBriefStructuredPrompt {
  return {
    operation: 'triageKeywords',
    promptVersion: SEO_BRIEF_AI_PROMPT_VERSIONS.triageKeywords,
    temperature: 0.1,
    systemPrompt: [
      'You are an SEO keyword triage assistant.',
      'Return only valid JSON.',
      'Do not use markdown or code fences.',
      'Schema:',
      '{"accepted":[{"keyword":"string","intent":"informational|commercial|transactional|navigational","stage":"awareness|consideration|decision","reason":"string"}],"rejected":[{"keyword":"string","reason":"string"}]}',
      'Accept only keywords that are relevant for the audience and realistic for a product-aware SEO brief.',
    ].join('\n'),
    userPrompt: createUserPrompt(params),
  };
}

export function buildClusterKeywordsPrompt(
  params: ClusterKeywordsParams,
): SeoBriefStructuredPrompt {
  return {
    operation: 'clusterKeywords',
    promptVersion: SEO_BRIEF_AI_PROMPT_VERSIONS.clusterKeywords,
    temperature: 0.2,
    systemPrompt: [
      'You are an SEO clustering assistant.',
      'Return only valid JSON.',
      'Do not use markdown or code fences.',
      'Schema:',
      '{"clusters":[{"label":"string","primaryKeyword":"string","intent":"informational|commercial|transactional|navigational","keywords":["string"],"rationale":"string"}]}',
      'Group keywords into coherent search-intent clusters.',
    ].join('\n'),
    userPrompt: createUserPrompt(params),
  };
}

export function buildSelectRelatedKeywordsPrompt(
  params: SelectRelatedKeywordsParams,
): SeoBriefStructuredPrompt {
  return {
    operation: 'selectRelatedKeywords',
    promptVersion: SEO_BRIEF_AI_PROMPT_VERSIONS.selectRelatedKeywords,
    temperature: 0.1,
    systemPrompt: [
      'You are an SEO SERP evidence selector.',
      'Return only valid JSON.',
      'Do not use markdown or code fences.',
      'Schema:',
      '{"selected":[{"keyword":"string","source":"people_also_ask|related_search","sourceText":"string","reason":"string"}],"rejected":[{"query":"string","reason":"string"}]}',
      'Select up to the requested limit of useful related search queries.',
      'Use only candidates from the input list.',
      'Do not invent, rewrite, expand, or infer new keywords.',
      'The selected.keyword must exactly match one input candidate query after trimming.',
      'Prefer complete, natural queries with clear search intent.',
      'Reject fragments, duplicates of the seed keyword, incomplete phrases, and overly generic queries.',
    ].join('\n'),
    userPrompt: createUserPrompt(params),
  };
}

export function buildProductBridgePrompt(
  params: BuildProductBridgeParams,
): SeoBriefStructuredPrompt {
  return {
    operation: 'buildProductBridge',
    promptVersion: SEO_BRIEF_AI_PROMPT_VERSIONS.buildProductBridge,
    temperature: 0.2,
    systemPrompt: [
      'You are an SEO-to-product bridge assistant.',
      'Return only valid JSON.',
      'Do not use markdown or code fences.',
      'Schema:',
      '{"fit":"strong|moderate|weak","summary":"string","positioningAngle":"string","cta":"string","talkingPoints":["string"],"risks":["string"]}',
      'Bridge the search intent to the product without making unsupported claims.',
    ].join('\n'),
    userPrompt: createUserPrompt(params),
  };
}

export function buildExplainClusterSelectionPrompt(
  params: ExplainClusterSelectionParams,
): SeoBriefStructuredPrompt {
  return {
    operation: 'explainClusterSelection',
    promptVersion: SEO_BRIEF_AI_PROMPT_VERSIONS.explainClusterSelection,
    temperature: 0.1,
    systemPrompt: [
      'You explain why one SEO cluster was selected over others.',
      'Return only valid JSON.',
      'Do not use markdown or code fences.',
      'Schema:',
      '{"summary":"string","reasons":["string"],"rejectedClusters":[{"label":"string","reason":"string"}]}',
      'Explain the selection clearly and concisely.',
    ].join('\n'),
    userPrompt: createUserPrompt(params),
  };
}

export function buildGenerateSeoBriefPrompt(
  params: GenerateSeoBriefParams,
): SeoBriefStructuredPrompt {
  return {
    operation: 'generateSeoBrief',
    promptVersion: SEO_BRIEF_AI_PROMPT_VERSIONS.generateSeoBrief,
    temperature: 0.3,
    systemPrompt: [
      'You create structured SEO briefs.',
      'Return only valid JSON.',
      'Do not use markdown or code fences.',
      'Schema:',
      '{"title":"string","metaTitle":"string","metaDescription":"string","angle":"string","outline":[{"heading":"string","purpose":"string","keyPoints":["string"]}],"faq":[{"question":"string","answer":"string"}],"productPlacement":{"summary":"string","cta":"string","sections":["string"]}}',
      'The brief must balance SEO usefulness with product relevance.',
    ].join('\n'),
    userPrompt: createUserPrompt(params),
  };
}

function createUserPrompt(input: unknown): string {
  return ['Input payload:', JSON.stringify(input, null, 2)].join('\n');
}

function createExpandKeywordsUserPrompt(
  params: ExpandKeywordsParams,
  keywordExpansionPrompt: string,
): string {
  return [
    'Your task is to generate the requested number of initial keyword hypotheses for later validation in DataForSEO.',
    '',
    'Input:',
    `- topicSeed: ${params.topicSeed}`,
    `- audience: ${params.audience}`,
    `- language: ${params.market.language}`,
    `- country: ${params.market.country}`,
    `- limit: ${String(params.limit ?? 10)}`,
    '',
    'Operator keyword expansion guidance:',
    keywordExpansionPrompt,
    '',
    'Return only valid JSON matching the required schema.',
  ].join('\n');
}
