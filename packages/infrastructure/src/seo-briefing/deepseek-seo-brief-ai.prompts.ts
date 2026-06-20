import type {
  BuildProductBridgeParams,
  ClassifySerpDomainsParams,
  CleanupLongreadArticleParams,
  ClusterKeywordsParams,
  DraftLongreadArticleParams,
  EvaluateCompetitorKeywordMatchesParams,
  ExpandKeywordsParams,
  ExplainClusterSelectionParams,
  ExtractSeoBriefContextParams,
  ExtractUserPainScenariosParams,
  GenerateSeoBriefParams,
  GroupCandidateKeywordsParams,
  GroupCompetitorKeywordEvidenceParams,
  MatchKeywordGroupsParams,
  PackageLongreadArticleParams,
  ReviewClusterProductFitParams,
  ScoreCompetitorKeywordCandidateGroupParams,
  ScoreDirtyKeywordCandidatesParams,
  SelectRelatedKeywordsParams,
  SynthesizeOnPageParams,
  TriageKeywordsParams,
} from '@marketing-service/seo-briefing';
import {
  DEFAULT_SEO_BRIEF_KEYWORD_EXPANSION_PROMPT,
  deriveTopicHintScope,
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
  extractContext: 'seo-brief.extract-context.v1',
  extractUserPainScenarios: 'seo-brief.extract-user-pain-scenarios.v1',
  expandKeywords: 'seo-brief.expand-keywords.v7-topic-scope',
  triageKeywords: 'seo-brief.triage-keywords.v1',
  clusterKeywords: 'seo-brief.cluster-keywords.v3-topic-scope',
  selectRelatedKeywords: 'seo-brief.select-related-keywords.v1',
  classifySerpDomains: 'seo-brief.classify-serp-domains.v1',
  evaluateCompetitorKeywordMatches: 'seo-brief.evaluate-competitor-keyword-matches.v2-topic-scope',
  groupCompetitorKeywordEvidence: 'seo-brief.group-competitor-keyword-evidence.v2-topic-scope',
  groupCandidateKeywords: 'seo-brief.group-candidate-keywords.v2-topic-scope',
  matchKeywordGroups: 'seo-brief.match-keyword-groups.v2-topic-scope',
  scoreCompetitorKeywordCandidateGroup:
    'seo-brief.score-competitor-keyword-candidate-group.v2-topic-scope',
  scoreDirtyKeywordCandidates: 'seo-brief.score-dirty-keyword-candidates.v2-topic-scope',
  reviewClusterProductFit: 'seo-brief.review-cluster-product-fit.v2-topic-scope',
  buildProductBridge: 'seo-brief.product-bridge.v1',
  explainClusterSelection: 'seo-brief.cluster-selection.v1',
  synthesizeOnPage: 'seo-brief.synthesize-onpage.v2-topic-scope',
  generateSeoBrief: 'seo-brief.generate-brief.v2-topic-scope',
  draftLongreadArticle: 'article-generation.draft.v1',
  cleanupLongreadArticle: 'article-generation.cleanup.v1',
  packageLongreadArticle: 'article-generation.package.v1',
} as const;

export function buildExtractContextPrompt(
  params: ExtractSeoBriefContextParams,
): SeoBriefStructuredPrompt {
  return {
    operation: 'extractContext',
    promptVersion: SEO_BRIEF_AI_PROMPT_VERSIONS.extractContext,
    temperature: 0.1,
    systemPrompt: [
      'You are an SEO brief intake parser.',
      'Return only valid JSON.',
      'Do not use markdown or code fences.',
      'Schema:',
      '{"topicHint":"string|null","topicSeed":"string|null","country":"string|null","language":"string|null","audience":"string|null","userPains":["string"],"userScenarios":["string"],"productName":"string|null","productDescription":"string|null","keyMessage":"string|null","audienceBefore":"string|null","audienceAfter":"string|null","cta":"string|null","brandConstraints":["string"],"claimsConstraints":["string"],"preferredAngle":"string|null","excludedTopics":["string"],"temporaryConstraints":["string"],"missingFields":["string"],"notes":["string"]}',
      'Extract only information clearly present in the input.',
      'Do not invent product facts, country, language, audience, CTA, or claims.',
      'Use null when a field is not present.',
      'topicHint is the SEO research direction or launch theme, not a final keyword and not an article title.',
      'topicSeed is deprecated; mirror topicHint there only for compatibility.',
      'userPains are explicit user problems, fears, needs, or jobs-to-be-done mentioned by the marketer.',
      'userScenarios are explicit search, behavior, tool, ecosystem, comparison, or action scenarios mentioned by the marketer.',
      'brandConstraints are tone, positioning, wording, or brand-safety constraints explicitly mentioned in the task.',
      'claimsConstraints are legal, compliance, proof, risk, or forbidden-claim constraints explicitly mentioned in the task.',
      'preferredAngle is the requested content/research angle when explicitly stated.',
      'excludedTopics are explicit topics or angles the marketer says to avoid.',
      'Put campaign-specific warnings, restrictions, and must-not-say items into temporaryConstraints.',
      'Put any required-but-missing fields into missingFields.',
      'Required fields: topicHint, country, language, audience, productName, productDescription.',
      'Do not include persistent brand memory unless the input explicitly contains task-specific brand facts.',
    ].join('\n'),
    userPrompt: createUserPrompt({
      contextText: params.contextText,
    }),
  };
}

export function buildExtractUserPainScenariosPrompt(
  params: ExtractUserPainScenariosParams,
): SeoBriefStructuredPrompt {
  return {
    operation: 'extractUserPainScenarios',
    promptVersion: SEO_BRIEF_AI_PROMPT_VERSIONS.extractUserPainScenarios,
    temperature: 0.1,
    systemPrompt: [
      'You are an SEO strategy analyst.',
      'Return only valid JSON.',
      'Do not use markdown or code fences.',
      'Schema:',
      '{"topic_hint_interpretation":"string","user_pains":[{"pain":"string","why_relevant":"string","product_connection":"direct|alternative|workflow|education|weak"}],"user_scenarios":[{"scenario":"string","type":"pain|action|ecosystem","why_check":"string","product_fit_hypothesis":"direct_solution|alternative_solution|workflow_bridge|education_bridge|weak"}],"risk_notes":["string"]}',
      'Extract user pains and user scenarios that can lead to this product through Google search.',
      'topic_hint is a required scope boundary and business context.',
      'topic_hint is NOT the final keyword, NOT the final title, and NOT a mandatory article angle.',
      'Do not generate final keywords yet.',
      'Do not overfocus on product name.',
      'Identify real user pains and actions.',
      'Identify ecosystem/tools users may already use.',
      'Do not make prohibited claims such as guaranteed yield or risk-free return.',
      'Return at least 3 user_pains.',
      'Return at least 1 pain scenario, 1 action scenario, and 1 ecosystem scenario.',
      'If product fit is not direct, mark it as alternative_solution, workflow_bridge, education_bridge, or weak.',
    ].join('\n'),
    userPrompt: createUserPrompt({
      topicHint: params.topicSeed,
      market: params.market,
      audience: params.audience,
      productName: params.productName,
      productDescription: params.productDescription,
      keyMessage: params.keyMessage,
      seoProductContext: params.seoProductContext,
      brandMemorySnapshot: params.brandMemorySnapshot,
    }),
  };
}

export function buildExpandKeywordsPrompt(params: ExpandKeywordsParams): SeoBriefStructuredPrompt {
  const keywordExpansionPrompt = resolveSeoBriefKeywordExpansionPrompt(
    params.keywordExpansionPrompt,
  );
  const topicHintScope = deriveTopicHintScope(params.topicSeed);

  return {
    operation: 'expandKeywords',
    promptVersion: SEO_BRIEF_AI_PROMPT_VERSIONS.expandKeywords,
    temperature: 0.2,
    systemPrompt: [
      'You are an SEO research strategist.',
      'Return only valid JSON.',
      'Do not use markdown or code fences.',
      'Schema:',
      '{"search_hypotheses":[{"query":"string","hypothesis_type":"pain|action|ecosystem|comparison|education|risk","why_generated":"string","product_fit_hypothesis":"direct_solution|alternative_solution|workflow_bridge|education_bridge|weak","risk_flags":["string"]}]}',
      `Generate exactly ${String(params.limit ?? 10)} Google-like search hypotheses for SERP discovery.`,
      'Return search_hypotheses only. Do not return groups.',
      'Generate realistic Google search queries, not article titles.',
      'Use manual userPainScenarios from the marketer input as the main source.',
      'topic_hint is a hard scope signal for concrete entities, ecosystems, chains, geographies, and product categories.',
      'requiredTopicTerms are extracted from topic_hint and must be preserved when they are concrete.',
      'If requiredTopicTerms contains a chain, ecosystem, protocol, product category, or named entity, at least half of the hypotheses must explicitly target that scope or a direct synonym.',
      'Generic adjacent queries may support discovery, but they must not dominate or replace the required topic scope.',
      'Prefer seoProductContext when it is provided; use legacy fields only as fallback.',
      'seoProductContext.researchFrame defines the SEO direction and market.',
      'seoProductContext.brandMemoryContext defines product facts and claim boundaries.',
      'seoProductContext.marketerConstraints and generationGuardrails are hard constraints.',
      'Cover a useful mix of pain, action, ecosystem, comparison, education, and risk hypotheses when supported by the input.',
      'Do not force every hypothesis_type if the marketer input does not support it.',
      'Use the target language from the input.',
      'Treat country as market context, not as a required keyword suffix.',
      'Do not append the country name to most keywords.',
      'Only include a geo modifier when local intent is clearly natural and realistic.',
      'No more than 2 keywords may contain a country or city modifier.',
      'Use campaign context to understand the topic, audience problem, and constraints.',
      'Do not turn product name, brand name, or CTA into keyword text unless branded SEO is explicitly requested.',
      'Product and brand context should influence relevance, not force branded queries.',
      'Include queries that can reveal competitors in both crypto and non-crypto dollar-saving spaces.',
      'When topic_hint names a blockchain or network, include realistic queries that use that network name and common network aliases.',
      'Avoid pure navigational queries.',
      'Avoid login, download, logo, support, API, APK, fake screenshot, seed phrase, private key, flasher.',
      'Avoid duplicated or near-duplicated keywords.',
      'Avoid awkward geo phrasing, year modifiers, brand names, hype, and scammy wording.',
      'Do not estimate search volume, competition, CPC, or ranking difficulty.',
      'why_generated must be short and grounded in topic_hint, manual user pains, manual user scenarios, market, or product context.',
      'product_fit_hypothesis is only a hypothesis for later validation, not a final scoring decision.',
      'risk_flags should be empty unless the query has compliance, hype, scam, guarantee, unsupported-claim, or unsafe-user-intent risk.',
      `Default operator guidance:\n${DEFAULT_SEO_BRIEF_KEYWORD_EXPANSION_PROMPT}`,
    ].join('\n'),
    userPrompt: createExpandKeywordsUserPrompt(params, keywordExpansionPrompt, topicHintScope),
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
  const hasScoredCandidates = Array.isArray(params.candidates) && params.candidates.length > 0;

  return {
    operation: 'clusterKeywords',
    promptVersion: SEO_BRIEF_AI_PROMPT_VERSIONS.clusterKeywords,
    temperature: 0.2,
    systemPrompt: [
      'You are an SEO clustering agent.',
      'Return only valid JSON.',
      'Do not use markdown or code fences.',
      'Schema:',
      '{"clusters":[{"cluster_name":"string","user_intent":"string","primary_keyword_candidate":"string","intent":"informational|commercial|transactional|navigational","secondary_keywords":["string"],"questions":["string"],"supporting_items":["string"],"competitor_urls":[{"domain":"string","url":"string","title":"string|null","rank_absolute":1}],"source_confidence":"low|medium|high","evidence_summary":"string"}]}',
      'Group items into intent-based SEO clusters.',
      'Cluster by user intent, not exact word overlap.',
      'Use the full cleaned pool of accepted and maybe candidates, not only the top-scored candidates.',
      'Preserve source evidence and use competitor URLs only when present in input evidence.',
      'Do not invent new keywords, questions, domains, or URLs.',
      'Every primary_keyword_candidate, secondary keyword, question, and supporting item must be copied from input candidates.',
      'Do not create clusters around login, logo, download, API, support, seed phrase, scam, flasher, fake screenshot, unrelated coin news, or rejected keywords.',
      'PAA-style questions should support clusters as questions/subintent unless they clearly represent a standalone topic.',
      'topic_hint is a scope boundary, not an exact article title.',
      'Prefer 3-7 clusters for a normal pool.',
      'Each cluster must have a primary keyword from accepted candidates when possible.',
      'Use maybe candidates only as supporting_items, questions, or secondary keywords unless they are clearly the best primary.',
      'Competitor metrics and proxyDemandScore are evidence signals, not automatic reasons to create or prioritize a cluster.',
      'source_confidence should reflect evidence depth: multiple sources/search volume/competitor URLs = higher confidence.',
      hasScoredCandidates
        ? 'The input contains scored candidates with accepted/maybe status. Exclude rejected keywords entirely.'
        : 'The input contains a legacy keyword list. Cluster only the provided keywords.',
    ].join('\n'),
    userPrompt: createUserPrompt({
      topicHint: params.topicSeed,
      market: params.market,
      audience: params.audience,
      productName: params.productName,
      productDescription: params.productDescription,
      seoProductContext: params.seoProductContext,
      userPainScenarios: params.userPainScenarios,
      brandMemorySnapshot: params.brandMemorySnapshot,
      keywords: params.keywords,
      candidates: params.candidates,
      rejectedKeywords: params.rejectedKeywords,
    }),
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

export function buildClassifySerpDomainsPrompt(
  params: ClassifySerpDomainsParams,
): SeoBriefStructuredPrompt {
  return {
    operation: 'classifySerpDomains',
    promptVersion: SEO_BRIEF_AI_PROMPT_VERSIONS.classifySerpDomains,
    temperature: 0.1,
    systemPrompt: [
      'You are an SEO competitor classifier.',
      'Return only valid JSON.',
      'Do not use markdown or code fences.',
      'Schema:',
      '{"ranked_keywords_targets":[{"domain":"string","domain_type":"wallet|cex_p2p|local_fintech|crypto_education|other","priority":"high|medium|low","reason":"string"}],"onpage_only_targets":[{"domain":"string","domain_type":"media|bank|broad_blog|other","reason":"string"}],"pain_signal_targets":[{"domain":"string","domain_type":"forum|community|social","reason":"string"}],"ignored_targets":[{"domain":"string","reason":"string"}]}',
      'Classify each domain from the input SERP domain evidence into one of: ranked_keywords_target, onpage_only_target, pain_signal_target, ignore.',
      'Use ranked_keywords_target only for domains whose full keyword universe is likely relevant for the topic and product research.',
      'Do not send huge broad media, forums, social platforms, YouTube, TikTok, Pinterest, or random aggregators to Ranked Keywords by default.',
      'Use onpage_only_target for useful articles from broad media, banks, or blogs.',
      'For onpage_only_targets.domain_type use only media, bank, broad_blog, or other. If the domain is crypto education, wallet, exchange, video, tool, or anything else but still useful for page analysis, use other.',
      'Use pain_signal_target for forums and communities that are useful for user language and pain points.',
      'For pain_signal_targets.domain_type use only forum, community, or social.',
      'Prefer a mixed competitor set: wallet, CEX/P2P, local fintech, crypto education/product site.',
      'Return 3-6 ranked_keywords_targets maximum.',
      'Recommended default is 3-4 ranked_keywords_targets.',
      'topic_hint is a scope boundary, not a strict keyword.',
      'Do not classify domains that do not appear in the input evidence.',
      'Every input domain should appear in exactly one output category.',
    ].join('\n'),
    userPrompt: createUserPrompt({
      topicHint: params.topicSeed,
      productName: params.productName,
      productDescription: params.productDescription,
      market: params.market,
      audience: params.audience,
      seoProductContext: params.seoProductContext,
      userPainScenarios: params.userPainScenarios,
      brandMemorySnapshot: params.brandMemorySnapshot,
      serpDomainAggregation: params.serpDomainAggregation,
    }),
  };
}

export function buildScoreDirtyKeywordCandidatesPrompt(
  params: ScoreDirtyKeywordCandidatesParams,
): SeoBriefStructuredPrompt {
  const topicHintScope = deriveTopicHintScope(params.topicSeed);

  return {
    operation: 'scoreDirtyKeywordCandidates',
    promptVersion: SEO_BRIEF_AI_PROMPT_VERSIONS.scoreDirtyKeywordCandidates,
    temperature: 0.1,
    systemPrompt: [
      'You are an SEO keyword filtering and scoring analyst.',
      'Return only valid JSON.',
      'Do not use markdown or code fences.',
      'Schema:',
      '{"accepted":[{"keyword":"string","status":"accepted","total_score":0,"scores":{"topic_fit":0,"product_fit":0,"audience_fit":0,"intent_fit":0,"risk_compliance":0,"evidence":0},"fit":{"topic_fit":"strong|moderate|weak|none","product_fit":"strong|moderate|weak|none","audience_fit":"strong|moderate|weak|none","intent_fit":"strong|moderate|weak|none","risk_compliance":"strong|moderate|weak|none","evidence":"strong|moderate|weak|none"},"intent":"informational|commercial|transactional|navigational","stage":"awareness|consideration|decision","reasons":["string"],"risk_flags":["string"],"evidence_notes":["string"]}],"maybe":[{"keyword":"string","status":"maybe","total_score":0,"scores":{"topic_fit":0,"product_fit":0,"audience_fit":0,"intent_fit":0,"risk_compliance":0,"evidence":0},"fit":{"topic_fit":"strong|moderate|weak|none","product_fit":"strong|moderate|weak|none","audience_fit":"strong|moderate|weak|none","intent_fit":"strong|moderate|weak|none","risk_compliance":"strong|moderate|weak|none","evidence":"strong|moderate|weak|none"},"intent":"informational|commercial|transactional|navigational","stage":"awareness|consideration|decision","reasons":["string"],"risk_flags":["string"],"evidence_notes":["string"]}],"rejected":[{"keyword":"string","status":"rejected","total_score":0,"scores":{"topic_fit":0,"product_fit":0,"audience_fit":0,"intent_fit":0,"risk_compliance":0,"evidence":0},"fit":{"topic_fit":"strong|moderate|weak|none","product_fit":"strong|moderate|weak|none","audience_fit":"strong|moderate|weak|none","intent_fit":"strong|moderate|weak|none","risk_compliance":"strong|moderate|weak|none","evidence":"strong|moderate|weak|none"},"intent":"informational|commercial|transactional|navigational","stage":"awareness|consideration|decision","reasons":["string"],"risk_flags":["string"],"evidence_notes":["string"]}],"summary":{"accepted_count":0,"maybe_count":0,"rejected_count":0,"notes":["string"]}}',
      'Score every input candidate exactly once into accepted, maybe, or rejected.',
      'Hard-exclude obvious noise terms if present, and reject unsafe or weak candidates.',
      'Do not invent new keywords.',
      'Do not rewrite keyword text.',
      'The output keyword must exactly match one input candidate.keyword.',
      'Use topic_fit for relevance to topic_hint and user pains.',
      'Use requiredTopicTerms as hard topic anchors. If requiredTopicTerms are concrete and a candidate ignores them or direct synonyms, topic_fit must usually be weak or none.',
      'Do not accept broad adjacent candidates over topic-specific candidates unless the topic-specific candidates are unsafe or unsupported.',
      'Use product_fit for honest connection to product facts and Brand Memory.',
      'Use audience_fit for the target audience and market.',
      'Use intent_fit for whether the query can support an SEO article/brief.',
      'Use risk_compliance for claim safety, legal/compliance risk, scamminess, and forbidden claims.',
      'Use evidence for source strength: selected SERP related queries, multiple sources, search volume, ranked keyword evidence, and competitor ranking evidence.',
      'If proxyDemandScore or competitorMatchScore is present, treat it as competitor-map demand evidence, not as direct candidate search volume.',
      'A candidate with strong proxy demand can still be rejected if topic/product/audience/risk fit is weak.',
      'Score each criterion from 0 to 100.',
      'total_score should be a practical weighted overall score from 0 to 100.',
      'accepted means useful and safe enough to continue.',
      'maybe means potentially useful but requires human review or reframing.',
      'rejected means off-topic, weak product fit, unsafe, too broad, scammy, navigational, fragmented, or unsupported.',
      'Reject or downgrade queries that imply guaranteed returns, risk-free yield, scams, seed phrases, private keys, fake apps, unsupported regions, or illegal activity.',
      'Prefer educational, comparison, problem-aware, and beginner-friendly queries with clear evidence.',
      'Use Brand Memory and constraints to avoid unsupported claims.',
      'Keep reasons short, concrete, and non-generic.',
      'Return at least one summary note explaining the main filtering pattern.',
    ].join('\n'),
    userPrompt: createUserPrompt({
      topicHint: params.topicSeed,
      topicHintScope,
      market: params.market,
      audience: params.audience,
      productName: params.productName,
      productDescription: params.productDescription,
      keyMessage: params.keyMessage,
      seoProductContext: params.seoProductContext,
      userPainScenarios: params.userPainScenarios,
      brandMemorySnapshot: params.brandMemorySnapshot,
      candidates: params.candidates,
    }),
  };
}

export function buildEvaluateCompetitorKeywordMatchesPrompt(
  params: EvaluateCompetitorKeywordMatchesParams,
): SeoBriefStructuredPrompt {
  const topicHintScope = deriveTopicHintScope(params.topicSeed);

  return {
    operation: 'evaluateCompetitorKeywordMatches',
    promptVersion: SEO_BRIEF_AI_PROMPT_VERSIONS.evaluateCompetitorKeywordMatches,
    temperature: 0.1,
    systemPrompt: [
      'You are an SEO market-demand analyst.',
      'Return only valid JSON.',
      'Do not use markdown or code fences.',
      'Schema:',
      '{"buckets":[{"bucket_id":"string","name":"string","description":"string","evidence_ids":["string"],"representative_keywords":["string"]}],"candidates":[{"candidate_id":"string","keyword":"string","bucket_id":"string|null","proxy_demand_score":0,"candidate_score":0,"best_match_type":"exact_match|near_match|same_intent|semantic_related|no_match","matching_domains":["string"],"matched_evidence_ids":["string"],"risk_label":"safe|risky_requires_review|exclude","reason":"string","semantic_matches":[{"evidence_id":"string","competitor_keyword":"string","source_domain":"string|null","match_type":"exact_match|near_match|same_intent|semantic_related|no_match","match_confidence":0,"match_score":0,"evidence_strength":0,"why":"string"}]}],"summary":{"notes":["string"]}}',
      'Evaluate candidate keyword demand only against the provided competitor ranked keyword evidence.',
      'Use requiredTopicTerms only as topic-scope anchors. Do not invent evidence for them.',
      'If a candidate matches competitor evidence but ignores concrete requiredTopicTerms, explain that it is adjacent/generic rather than topic-specific.',
      'Do not use general knowledge as evidence.',
      'Do not invent keywords, evidence IDs, domains, URLs, search volume, rankings, or traffic.',
      'Every positive match must cite provided evidence_ids.',
      'If no relevant evidence exists for a candidate, use no_match, empty matched_evidence_ids, low proxy_demand_score, and explain the gap.',
      'First create 6-10 market buckets from the competitor evidence. Use fewer only if evidence is narrow.',
      'Each bucket must cite real evidence_ids from the input.',
      'Then assign every input candidate exactly once to the best bucket or null if no bucket fits.',
      'Then score every candidate using only evidence in or adjacent to the assigned bucket.',
      'proxy_demand_score is a proxy, not direct candidate search volume.',
      'Use DataForSEO metrics only from provided evidence: searchVolume, rankAbsolute, estimatedTraffic, keywordDifficulty, cpc, competitionLevel, intent.',
      'Favor candidates with same user intent and strong competitor evidence.',
      'Penalize candidates that are navigational, scammy, too broad, free-money, faucet/airdrop, private-key, fake-app, unsupported, or weakly connected.',
      'Scores must be integers from 0 to 100.',
      'match_confidence must be from 0 to 1.',
      'candidate_id and keyword must exactly match input candidates.',
      'Return at least one summary note.',
    ].join('\n'),
    userPrompt: createUserPrompt({
      topicHint: params.topicSeed,
      topicHintScope,
      market: params.market,
      audience: params.audience,
      productName: params.productName,
      productDescription: params.productDescription,
      candidates: params.candidates,
      competitorEvidence: params.competitorEvidence,
    }),
  };
}

export function buildGroupCompetitorKeywordEvidencePrompt(
  params: GroupCompetitorKeywordEvidenceParams,
): SeoBriefStructuredPrompt {
  const topicHintScope = deriveTopicHintScope(params.topicSeed);

  return {
    operation: 'groupCompetitorKeywordEvidence',
    promptVersion: SEO_BRIEF_AI_PROMPT_VERSIONS.groupCompetitorKeywordEvidence,
    temperature: 0.1,
    systemPrompt: [
      'You are an SEO market evidence analyst.',
      'Return only valid JSON.',
      'Do not use markdown or code fences.',
      'Schema:',
      '{"buckets":[{"bucket_id":"string","name":"string","description":"string","evidence_ids":["string"],"representative_keywords":["string"]}],"summary":{"notes":["string"]}}',
      'Group only the provided competitor ranked keyword evidence into semantic market buckets.',
      'Do not evaluate our candidate keywords in this step.',
      'Do not invent evidence IDs, domains, URLs, metrics, search volume, rankings, or keywords.',
      'Every bucket must cite real evidence_ids from the input.',
      'A bucket represents a search market / user-intent area visible in competitor ranked keywords.',
      'If requiredTopicTerms exist in the evidence, preserve them in bucket names or descriptions.',
      'Do not force requiredTopicTerms into buckets when the provided competitor evidence does not support them.',
      'Use concise bucket names such as stablecoin yield, wallet safety, comparison, P2P, cashout, network education, fees/risk, if supported by evidence.',
      'Use the input maxBuckets as a hard upper bound.',
      'If evidence is narrow, use fewer buckets.',
      'Every evidence_id should appear in at most one primary bucket.',
      'Return at least one summary note about the strongest market patterns.',
    ].join('\n'),
    userPrompt: createUserPrompt({
      topicHint: params.topicSeed,
      topicHintScope,
      market: params.market,
      audience: params.audience,
      productName: params.productName,
      productDescription: params.productDescription,
      maxBuckets: params.maxBuckets ?? 8,
      competitorEvidence: params.competitorEvidence,
    }),
  };
}

export function buildGroupCandidateKeywordsPrompt(
  params: GroupCandidateKeywordsParams,
): SeoBriefStructuredPrompt {
  const topicHintScope = deriveTopicHintScope(params.topicSeed);

  return {
    operation: 'groupCandidateKeywords',
    promptVersion: SEO_BRIEF_AI_PROMPT_VERSIONS.groupCandidateKeywords,
    temperature: 0.1,
    systemPrompt: [
      'You are an SEO candidate keyword analyst.',
      'Return only valid JSON.',
      'Do not use markdown or code fences.',
      'Schema:',
      '{"buckets":[{"bucket_id":"string","name":"string","description":"string","candidate_ids":["string"],"representative_keywords":["string"]}],"summary":{"notes":["string"]}}',
      'Group only the provided candidate keywords into semantic buckets.',
      'Do not use competitor evidence in this step.',
      'Do not invent candidates or candidate IDs.',
      'Every input candidate_id must appear in exactly one bucket.',
      'A bucket represents a user search situation or intent family.',
      'If requiredTopicTerms exist, keep candidates that include those terms or direct synonyms in clearly topic-specific buckets.',
      'Do not merge topic-specific candidates into broad generic buckets when a more specific bucket is possible.',
      'Use the input maxBuckets as a hard upper bound.',
      'If candidates are narrow, use fewer buckets.',
      'Keep names short and understandable for a marketer.',
      'Return at least one summary note about the main candidate intent patterns.',
    ].join('\n'),
    userPrompt: createUserPrompt({
      topicHint: params.topicSeed,
      topicHintScope,
      market: params.market,
      audience: params.audience,
      productName: params.productName,
      productDescription: params.productDescription,
      maxBuckets: params.maxBuckets ?? 8,
      candidates: params.candidates,
    }),
  };
}

export function buildMatchKeywordGroupsPrompt(
  params: MatchKeywordGroupsParams,
): SeoBriefStructuredPrompt {
  const topicHintScope = deriveTopicHintScope(params.topicSeed);

  return {
    operation: 'matchKeywordGroups',
    promptVersion: SEO_BRIEF_AI_PROMPT_VERSIONS.matchKeywordGroups,
    temperature: 0.1,
    systemPrompt: [
      'You are an SEO market alignment analyst.',
      'Return only valid JSON.',
      'Do not use markdown or code fences.',
      'Schema:',
      '{"matches":[{"candidate_bucket_id":"string","competitor_bucket_ids":["string"],"match_type":"direct|adjacent|weak|none","match_strength":0,"reason":"string"}],"summary":{"notes":["string"]}}',
      'Match candidate keyword buckets to competitor evidence buckets.',
      'Do not score individual candidates in this step.',
      'Do not invent bucket IDs.',
      'Every input candidate bucket must appear exactly once in matches.',
      'competitor_bucket_ids must contain only provided competitor bucket IDs.',
      'Use direct when user intent is the same, adjacent when closely related, weak when only lightly related, none when no competitor evidence bucket supports the candidate bucket.',
      'If a candidate bucket contains concrete requiredTopicTerms but competitor buckets are generic, mark the relation adjacent or weak unless the evidence clearly supports the same scoped topic.',
      'match_strength must be an integer from 0 to 100.',
      'Use only provided bucket names, descriptions, representative keywords, and cited IDs.',
      'Return at least one summary note about which candidate areas have the strongest competitor evidence.',
    ].join('\n'),
    userPrompt: createUserPrompt({
      topicHint: params.topicSeed,
      topicHintScope,
      market: params.market,
      productName: params.productName,
      productDescription: params.productDescription,
      candidateBuckets: params.candidateBuckets,
      competitorBuckets: params.competitorBuckets,
    }),
  };
}

export function buildScoreCompetitorKeywordCandidateGroupPrompt(
  params: ScoreCompetitorKeywordCandidateGroupParams,
): SeoBriefStructuredPrompt {
  const topicHintScope = deriveTopicHintScope(params.topicSeed);

  return {
    operation: 'scoreCompetitorKeywordCandidateGroup',
    promptVersion: SEO_BRIEF_AI_PROMPT_VERSIONS.scoreCompetitorKeywordCandidateGroup,
    temperature: 0.1,
    systemPrompt: [
      'You are an SEO keyword evidence scorer.',
      'Return only valid JSON.',
      'Do not use markdown or code fences.',
      'Schema:',
      '{"candidates":[{"candidate_id":"string","keyword":"string","bucket_id":"string|null","proxy_demand_score":0,"candidate_score":0,"best_match_type":"exact_match|near_match|same_intent|semantic_related|no_match","matching_domains":["string"],"matched_evidence_ids":["string"],"risk_label":"safe|risky_requires_review|exclude","reason":"string","semantic_matches":[{"evidence_id":"string","competitor_keyword":"string","source_domain":"string|null","match_type":"exact_match|near_match|same_intent|semantic_related|no_match","match_confidence":0,"match_score":0,"evidence_strength":0,"why":"string"}]}],"summary":{"notes":["string"]}}',
      'Score every provided candidate exactly once.',
      'Evaluate candidates only against provided competitor evidence rows and competitor buckets.',
      'Do not use general knowledge as evidence.',
      'Do not invent keywords, evidence IDs, domains, URLs, search volume, rankings, or traffic.',
      'Every positive semantic match must cite a provided evidence_id.',
      'If no relevant evidence exists for a candidate, use no_match, empty matched_evidence_ids, low proxy_demand_score, and explain the gap.',
      'If requiredTopicTerms are concrete, distinguish topic-specific evidence from generic adjacent evidence.',
      'Do not give a high candidate_score to a generic candidate that ignores requiredTopicTerms unless the topic-specific pool has no viable evidence.',
      'proxy_demand_score is a proxy, not direct candidate search volume.',
      'Use DataForSEO metrics only from provided evidence: searchVolume, rankAbsolute, estimatedTraffic, keywordDifficulty, cpc, competitionLevel, intent.',
      'Favor same user intent and strong competitor evidence.',
      'Penalize navigational, scammy, too broad, free-money, faucet/airdrop, private-key, fake-app, unsupported, or weakly connected candidates.',
      'Scores must be integers from 0 to 100.',
      'match_confidence must be from 0 to 1.',
      'candidate_id and keyword must exactly match input candidates.',
      'Return at least one summary note.',
    ].join('\n'),
    userPrompt: createUserPrompt({
      topicHint: params.topicSeed,
      topicHintScope,
      market: params.market,
      audience: params.audience,
      productName: params.productName,
      productDescription: params.productDescription,
      candidateBucket: params.candidateBucket,
      competitorBuckets: params.competitorBuckets,
      candidates: params.candidates,
      competitorEvidence: params.competitorEvidence,
    }),
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

export function buildReviewClusterProductFitPrompt(
  params: ReviewClusterProductFitParams,
): SeoBriefStructuredPrompt {
  const topicHintScope = deriveTopicHintScope(params.topicSeed);

  return {
    operation: 'reviewClusterProductFit',
    promptVersion: SEO_BRIEF_AI_PROMPT_VERSIONS.reviewClusterProductFit,
    temperature: 0.1,
    systemPrompt: [
      'You are a Product Fit reviewer for SEO content.',
      'Return only valid JSON.',
      'Do not use markdown or code fences.',
      'Schema:',
      '{"cluster_product_fit":[{"cluster_name":"string","product_fit_score":0,"product_fit_type":"direct_solution|alternative_solution|workflow_bridge|education_bridge|no_fit","decision":"approve|reject|supporting_only","product_insertion_angle":"string","where_to_insert":"string","what_not_to_claim":["string"],"reason":"string"}]}',
      'Evaluate every input cluster exactly once.',
      'cluster_name must exactly match an input cluster.clusterName.',
      'Do not invent clusters, keywords, product facts, claims, or competitor evidence.',
      'Product Fit is not whether the product can be mentioned; it is whether the product can naturally help answer the user intent.',
      'Also verify topic-scope fit. If requiredTopicTerms are concrete and the cluster ignores them, do not approve it as a main-topic cluster.',
      'A broad generic cluster can be supporting_only, but it should not displace a viable topic-specific cluster.',
      'Do not approve a cluster just because it has search volume, ranked keyword evidence, or strong competitors.',
      'Use supportingItemDetails, sourceCandidate metrics, source lists, and competitorUrls as evidence only.',
      'Do not treat proxyDemandScore, competitorMatchScore, or searchVolume as Product Fit by themselves.',
      'Reject clusters where product insertion would feel forced.',
      'Approve only when the product can be a direct solution, natural alternative, workflow bridge, or education bridge.',
      'Use supporting_only when the cluster can support internal links or education but should not be the main article.',
      'Use no_fit and reject when the product cannot be naturally inserted or when the cluster is unsafe/off-topic.',
      'Scoring guidance: 0-20 no fit, 21-50 weak, 51-70 medium, 71-85 high, 86-100 very high.',
      'Do not allow prohibited claims: guaranteed profit, risk-free yield, guaranteed return, fixed guaranteed APY, no-risk income.',
      'Use Brand Memory, product profile, marketer constraints, and claim constraints as hard boundaries.',
      'Keep product_insertion_angle, where_to_insert, what_not_to_claim, and reason concrete and short.',
      'Never return empty strings. If the product should not be inserted, say "Do not insert product for this cluster."',
    ].join('\n'),
    userPrompt: createUserPrompt({
      topicHint: params.topicSeed,
      topicHintScope,
      market: params.market,
      audience: params.audience,
      productName: params.productName,
      productDescription: params.productDescription,
      keyMessage: params.keyMessage,
      seoProductContext: params.seoProductContext,
      userPainScenarios: params.userPainScenarios,
      brandMemorySnapshot: params.brandMemorySnapshot,
      clusters: params.clusters,
    }),
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
  const topicHintScope = deriveTopicHintScope(params.topicHint ?? params.primaryKeyword);

  return {
    operation: 'generateSeoBrief',
    promptVersion: SEO_BRIEF_AI_PROMPT_VERSIONS.generateSeoBrief,
    temperature: 0.3,
    systemPrompt: [
      'You are an SEO content brief generator.',
      'Return only valid JSON.',
      'Do not use markdown or code fences.',
      'Schema:',
      '{"topic_hint":"string","main_cluster":"string","supporting_clusters":["string"],"primary_keyword":"string","secondary_keywords":["string"],"search_intent":"string","target_reader":"string","content_type":"pillar guide|comparison|how-to|educational guide","recommended_title":"string","recommended_h1":"string","recommended_meta_title":"string","recommended_meta_description":"string","outline":[{"h2":"string","h3":["string"],"notes":"string"}],"faq":[{"question":"string","answer_direction":"string"}],"product_insertion":{"where":"string","how":"string","sample_angle":"string","avoid":["string"]},"competitor_gaps_to_fill":["string"],"risk_notes":["string"],"cta":"string","internal_links":["string"],"external_sources_needed":["string"]}',
      'Generate a production-ready SEO content brief.',
      'Write all user-facing brief fields in market.language, including title, H1, meta fields, outline headings, FAQ, CTA, and keyword recommendations.',
      'The brief must be actionable for a writer.',
      'The article must answer user intent first.',
      'Product insertion must be natural, not forced.',
      'Do not promise guaranteed yield or risk-free returns.',
      'Include H1, H2/H3 structure, FAQ, content blocks, CTA, and internal link suggestions.',
      'topic_hint should be respected as scope, but not blindly copied as title or keyword.',
      'requiredTopicTerms are hard scope anchors. If they are present, the recommended title, H1, intro direction, and outline must explicitly cover at least one concrete required term.',
      'Do not let generic high-volume adjacent keywords replace the topic requested in topic_hint.',
      'Use Competitor OnPage synthesis as the main structure evidence.',
      'Use Product Fit decision and Brand Memory as hard boundaries.',
      'Do not invent unsupported product facts, APY, safety guarantees, or risk-free claims.',
    ].join('\n'),
    userPrompt: createUserPrompt({
      productProfile: {
        productName: params.productName,
        productDescription: params.productDescription,
        productBridge: params.productBridge,
        brandMemorySnapshot: params.brandMemorySnapshot,
        seoProductContext: params.seoProductContext,
      },
      topicHint: params.topicHint ?? params.primaryKeyword,
      topicHintScope,
      market: params.market,
      audience: params.audience,
      mainSelectedCluster: params.clusterSelection ?? {
        clusterLabel: params.clusterLabel,
        primaryKeyword: params.primaryKeyword,
        intent: params.intent,
      },
      supportingClusters: params.supportingClusters ?? [],
      primaryKeyword: params.primaryKeyword,
      serpInsights: params.serpInsights ?? [],
      constraints: params.constraints ?? [],
      serpEnrichmentContext: params.serpEnrichmentContext,
      competitorKeywordEvidence: params.competitorKeywordEvidence,
      competitorOnPageSynthesis: params.onPageSynthesis,
      productFitReview: params.productFitReview,
      keywordCandidateScoring: params.keywordCandidateScoring,
    }),
  };
}

export function buildSynthesizeOnPagePrompt(
  params: SynthesizeOnPageParams,
): SeoBriefStructuredPrompt {
  const topicHintScope = deriveTopicHintScope(params.topicSeed);

  return {
    operation: 'synthesizeOnPage',
    promptVersion: SEO_BRIEF_AI_PROMPT_VERSIONS.synthesizeOnPage,
    temperature: 0.15,
    systemPrompt: [
      'You are an SEO brief on-page synthesis analyst.',
      'Return only valid JSON.',
      'Do not use markdown or code fences.',
      'Schema:',
      '{"competitor_structure_summary":{"common_h2_patterns":["string"],"common_content_blocks":["string"],"common_faq_questions":["string"],"common_tables_or_comparisons":["string"],"content_gaps":["string"]},"recommended_article_structure":{"h1":"string","h2":[{"heading":"string","purpose":"string","subpoints":["string"]}],"faq":["string"]},"product_insertion":{"section":"string","angle":"string","do":["string"],"avoid":["string"]},"risk_and_compliance_notes":["string"]}',
      'Analyze competitor page structures and produce brief requirements.',
      'Write all user-facing synthesis fields in market.language, including H1, H2 headings, FAQ, gaps, and product insertion guidance.',
      'Use parsed competitor pages as evidence only.',
      'Do not copy competitor text.',
      'Identify repeated structural patterns across competitors.',
      'Identify content gaps that a better article can cover.',
      'Identify where the product can be inserted naturally without forcing it.',
      'Respect Brand Memory, product facts, marketer constraints, and claim restrictions.',
      'topic_hint is a scope boundary; final H1 and angle may be adjusted based on evidence.',
      'requiredTopicTerms are hard scope anchors. If they are present, recommended H1/H2 and content gaps must preserve the concrete topic scope when page evidence allows it.',
      'Do not turn a scoped topic into a generic adjacent article just because competitors cover broad terms.',
      'Do not invent unsupported product capabilities, returns, safety guarantees, APY, or risk-free claims.',
      'Do not use YouTube/social/video pages as authority unless they are present in parsed pages; even then, treat them only as format/context evidence.',
      'Keep output concise and actionable for a final SEO brief writer.',
      'Return at least 3 common_h2_patterns when evidence supports them.',
      'Return at least 3 recommended h2 sections.',
    ].join('\n'),
    userPrompt: createUserPrompt({
      topicHint: params.topicSeed,
      topicHintScope,
      market: params.market,
      audience: params.audience,
      productName: params.productName,
      productDescription: params.productDescription,
      keyMessage: params.keyMessage,
      seoProductContext: params.seoProductContext,
      brandMemorySnapshot: params.brandMemorySnapshot,
      clusterSelection: params.clusterSelection,
      serpEnrichmentContext: params.serpEnrichmentContext,
      competitorKeywordEvidence: params.competitorKeywordEvidence,
      parsedCompetitorPages: params.onPagePages,
    }),
  };
}

export function buildDraftLongreadArticlePrompt(
  params: DraftLongreadArticleParams,
): SeoBriefStructuredPrompt {
  return {
    operation: 'draftLongreadArticle',
    promptVersion: SEO_BRIEF_AI_PROMPT_VERSIONS.draftLongreadArticle,
    temperature: 0.35,
    systemPrompt: [
      'You are an expert SEO writer.',
      'Return only valid JSON.',
      'Do not use markdown fences.',
      'Schema:',
      '{"draftArticleMarkdown":"string"}',
      'Write a complete publish-ready longread article in Markdown based on the SEO brief.',
      'Write the entire article in finalSeoBrief.market.language. Do not switch to English unless that is the selected market language.',
      'The SEO brief is the source of truth for structure, intent, keywords, product insertion, risks, and CTA.',
      'Follow recommendedH1 and outline from the brief.',
      'Answer search intent first.',
      'Write for targetReader.',
      'Use the primary keyword naturally in title/H1/intro.',
      'Use secondary keywords only when relevant and natural; do not force all of them.',
      'Include FAQ from the brief.',
      'Insert the product only where productInsertion says it belongs.',
      'Do not mention the product in every section.',
      'Do not present the product as guaranteed or risk-free.',
      'Do not promise guaranteed returns, guaranteed profit, no-risk savings, or risk-free yield.',
      'If APY or rates are mentioned, say they vary and require current source verification.',
      'Keep paragraphs short.',
      'Use clear, beginner-friendly language.',
      'Avoid hype, trader slang, and get-rich-quick language.',
      'Include risk explanations where riskNotes require them.',
      'Include the CTA from the brief naturally near the end.',
      'Do not mention that the article was generated from a brief.',
      'Markdown must start with the article title as H1, use H2/H3 headings, and include FAQ as an H2 section.',
      'Do not include JSON inside draftArticleMarkdown.',
    ].join('\n'),
    userPrompt: createUserPrompt({
      finalSeoBrief: params.finalSeoBrief,
      productProfile: params.productProfile,
      claimsPolicy: params.claimsPolicy,
      brandVoice: params.brandVoice,
      targetLength: params.targetLength,
      publishingFormat: params.publishingFormat,
    }),
  };
}

export function buildCleanupLongreadArticlePrompt(
  params: CleanupLongreadArticleParams,
): SeoBriefStructuredPrompt {
  return {
    operation: 'cleanupLongreadArticle',
    promptVersion: SEO_BRIEF_AI_PROMPT_VERSIONS.cleanupLongreadArticle,
    temperature: 0.15,
    systemPrompt: [
      'You are an SEO editor and crypto/finance claims reviewer.',
      'Return only valid JSON.',
      'Do not use markdown fences.',
      'Schema:',
      '{"status":"passed|passed_with_warnings|revised|needs_human_review","warnings":[{"type":"claims|compliance|seo|product_insertion|factual_check|tone|structure","severity":"blocker|warning|note","message":"string"}],"changesMade":["string"],"articleMarkdown":"string"}',
      'Review and revise the draft article. This may be an iterative review attempt after earlier findings.',
      'Return a revised article, not just comments.',
      'Edits are not failures. If you fixed all publish-blocking issues, return passed or passed_with_warnings, not revised.',
      'Do not ask for human approval. If a sentence or paragraph cannot be made safe, remove it or replace it with conservative educational wording.',
      'Your priority is an automatically publishable safe article, even if that means simplifying, removing specificity, removing product claims, or weakening promotional language.',
      'Preserve finalSeoBrief.market.language throughout the revised article. Do not translate the article to English unless English is the selected market language.',
      'Use severity blocker only for issues that make the article unsafe or impossible to publish automatically.',
      'Examples of blockers: prohibited financial claim, guaranteed return/safety wording, wrong product/company after correction, contradiction with the SEO brief, unsupported factual claim that cannot be softened, or unresolved legal/compliance uncertainty.',
      'Use severity warning for non-blocking quality/compliance cautions that are already mitigated in the article.',
      'Use severity note for informational observations that should not block publication.',
      'Check and fix: no guaranteed returns, no risk-free yield claims, no unsupported APY promises, no direct financial advice framed as certainty.',
      'Check US compliance risk for crypto/stablecoin/financial content: no misleading investment advice, no implied bank-like insurance, no guaranteed yield, no unsupported safety claims, and no promotional certainty around returns.',
      'Remove hype, get-rich-quick language, irrelevant keyword usage, and unnatural product insertion.',
      'Ensure the article answers searchIntent before promoting the product.',
      'Ensure primaryKeyword appears naturally in title/H1/intro.',
      'Ensure H2/H3 structure follows the brief and FAQ is included.',
      'Ensure risk explanations are clear and not hidden.',
      'If previousReviewFindings are provided, verify each issue is fixed before returning passed.',
      'Use status passed when there are no remaining warnings.',
      'Use status passed_with_warnings when only non-blocking warnings or notes remain.',
      'Use status revised only when you made edits and another automated review pass is needed.',
      'Use status needs_human_review only when at least one blocker remains after you tried to remove, generalize, or neutralize the blocked content.',
    ].join('\n'),
    userPrompt: createUserPrompt({
      draftArticleMarkdown: params.draftArticleMarkdown,
      finalSeoBrief: params.finalSeoBrief,
      productProfile: params.productProfile,
      claimsPolicy: params.claimsPolicy,
      brandVoice: params.brandVoice,
      reviewAttempt: params.reviewAttempt,
      previousReviewFindings: params.previousReviewFindings,
    }),
  };
}

export function buildPackageLongreadArticlePrompt(
  params: PackageLongreadArticleParams,
): SeoBriefStructuredPrompt {
  return {
    operation: 'packageLongreadArticle',
    promptVersion: SEO_BRIEF_AI_PROMPT_VERSIONS.packageLongreadArticle,
    temperature: 0.1,
    systemPrompt: [
      'You are a CMS packaging assistant.',
      'Return only valid JSON.',
      'Do not use markdown fences.',
      'Schema:',
      '{"article":{"title":"string","slug":"string","metaTitle":"string","metaDescription":"string","h1":"string","bodyMarkdown":"string"},"seo":{"primaryKeyword":"string","secondaryKeywordsUsed":["string"],"searchIntent":"string","contentType":"string","faqIncluded":true,"internalLinks":["string"],"externalSourcesNeeded":["string"]},"productInsertion":{"whereInserted":"string","angleUsed":"string","forced":false},"claimsReview":{"status":"passed|passed_with_warnings|revised|needs_human_review","warnings":["string"]},"publishingChecklist":{"readyToPublish":true,"needsExternalFactCheck":false,"needsComplianceReview":false,"notes":["string"]}}',
      'Create a publish-ready article package from the reviewed article and SEO brief.',
      'Preserve finalSeoBrief.market.language in title, H1, meta fields, bodyMarkdown, FAQ, checklist notes, and all user-facing fields.',
      'Do not rewrite heavily unless needed for formatting consistency.',
      'Extract or create a clean slug.',
      'Use recommendedMetaTitle and recommendedMetaDescription from the brief unless they conflict with claims safety.',
      'Ensure H1 matches the article.',
      'Extract FAQ items from the article.',
      'Preserve internalLinks and externalSourcesNeeded from the brief.',
      'Preserve claims warnings from cleanup.',
      'If externalSourcesNeeded is non-empty or cleanup warnings require factual verification, readyToPublish must be false and needsExternalFactCheck should usually be true.',
    ].join('\n'),
    userPrompt: createUserPrompt({
      reviewedArticleMarkdown: params.reviewedArticleMarkdown,
      finalSeoBrief: params.finalSeoBrief,
      cleanupWarnings: params.cleanupWarnings,
      productProfile: params.productProfile,
    }),
  };
}

function createUserPrompt(input: unknown): string {
  return ['Input payload:', JSON.stringify(input, null, 2)].join('\n');
}

function createExpandKeywordsUserPrompt(
  params: ExpandKeywordsParams,
  keywordExpansionPrompt: string,
  topicHintScope: ReturnType<typeof deriveTopicHintScope>,
): string {
  return [
    'Your task is to generate the requested number of search hypotheses for later validation in DataForSEO.',
    '',
    'Primary SEO Product Context:',
    JSON.stringify(params.seoProductContext ?? null, null, 2),
    '',
    'User pains and scenarios from previous step:',
    JSON.stringify(params.userPainScenarios ?? null, null, 2),
    '',
    'Input:',
    `- topicSeed: ${params.topicSeed}`,
    `- topicHintScope: ${JSON.stringify(topicHintScope)}`,
    `- audience: ${params.audience}`,
    `- language: ${params.market.language}`,
    `- country: ${params.market.country}`,
    `- limit: ${String(params.limit ?? 10)}`,
    `- keyMessage: ${params.keyMessage ?? 'not provided'}`,
    `- audienceBefore: ${params.audienceBefore ?? 'not provided'}`,
    `- audienceAfter: ${params.audienceAfter ?? 'not provided'}`,
    `- productName: ${params.productName}`,
    `- productDescription: ${params.productDescription ?? 'not provided'}`,
    `- campaignContext: ${params.campaignContext ?? 'not provided'}`,
    `- brandMemoryConstraints: ${JSON.stringify(
      {
        approvedFacts: params.brandMemorySnapshot?.approvedFacts ?? [],
        forbiddenClaims: params.brandMemorySnapshot?.forbiddenClaims ?? [],
        bannedPhrases: params.brandMemorySnapshot?.bannedPhrases ?? [],
        requiredPhrases: params.brandMemorySnapshot?.requiredPhrases ?? [],
      },
      null,
      2,
    )}`,
    '',
    'Operator keyword expansion guidance:',
    keywordExpansionPrompt,
    '',
    'Return only valid JSON matching the required schema.',
  ].join('\n');
}
