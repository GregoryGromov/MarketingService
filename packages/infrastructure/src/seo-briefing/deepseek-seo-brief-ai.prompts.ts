import type {
  BuildProductBridgeParams,
  ClassifySerpDomainsParams,
  ClusterKeywordsParams,
  ExpandKeywordsParams,
  ExplainClusterSelectionParams,
  ExtractSeoBriefContextParams,
  ExtractUserPainScenariosParams,
  GenerateSeoBriefParams,
  ReviewClusterProductFitParams,
  ScoreDirtyKeywordCandidatesParams,
  SelectRelatedKeywordsParams,
  SynthesizeOnPageParams,
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
  extractContext: 'seo-brief.extract-context.v1',
  extractUserPainScenarios: 'seo-brief.extract-user-pain-scenarios.v1',
  expandKeywords: 'seo-brief.expand-keywords.v6',
  triageKeywords: 'seo-brief.triage-keywords.v1',
  clusterKeywords: 'seo-brief.cluster-keywords.v2',
  selectRelatedKeywords: 'seo-brief.select-related-keywords.v1',
  classifySerpDomains: 'seo-brief.classify-serp-domains.v1',
  scoreDirtyKeywordCandidates: 'seo-brief.score-dirty-keyword-candidates.v1',
  reviewClusterProductFit: 'seo-brief.review-cluster-product-fit.v1',
  buildProductBridge: 'seo-brief.product-bridge.v1',
  explainClusterSelection: 'seo-brief.cluster-selection.v1',
  synthesizeOnPage: 'seo-brief.synthesize-onpage.v1',
  generateSeoBrief: 'seo-brief.generate-brief.v1',
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
      '{"topicHint":"string|null","topicSeed":"string|null","country":"string|null","language":"string|null","audience":"string|null","userPains":["string"],"userScenarios":["string"],"productName":"string|null","productDescription":"string|null","keyMessage":"string|null","audienceBefore":"string|null","audienceAfter":"string|null","cta":"string|null","knownCompetitors":["string"],"brandConstraints":["string"],"claimsConstraints":["string"],"preferredAngle":"string|null","excludedTopics":["string"],"temporaryConstraints":["string"],"missingFields":["string"],"notes":["string"]}',
      'Extract only information clearly present in the input.',
      'Do not invent product facts, country, language, audience, CTA, or claims.',
      'Use null when a field is not present.',
      'topicHint is the SEO research direction or launch theme, not a final keyword and not an article title.',
      'topicSeed is deprecated; mirror topicHint there only for compatibility.',
      'knownCompetitors are explicit competing products, sites, brands, or domains mentioned by the marketer.',
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
      'Hard-exclude noise terms were already removed before this AI step; still reject remaining unsafe or weak candidates.',
      'Do not invent new keywords.',
      'Do not rewrite keyword text.',
      'The output keyword must exactly match one input candidate.keyword.',
      'Use topic_fit for relevance to topic_hint and user pains.',
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
    ].join('\n'),
    userPrompt: createUserPrompt({
      topicHint: params.topicSeed,
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
      'The brief must be actionable for a writer.',
      'The article must answer user intent first.',
      'Product insertion must be natural, not forced.',
      'Do not promise guaranteed yield or risk-free returns.',
      'Include H1, H2/H3 structure, FAQ, content blocks, CTA, and internal link suggestions.',
      'topic_hint should be respected as scope, but not blindly copied as title or keyword.',
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
      'Use parsed competitor pages as evidence only.',
      'Do not copy competitor text.',
      'Identify repeated structural patterns across competitors.',
      'Identify content gaps that a better article can cover.',
      'Identify where the product can be inserted naturally without forcing it.',
      'Respect Brand Memory, product facts, marketer constraints, and claim restrictions.',
      'topic_hint is a scope boundary; final H1 and angle may be adjusted based on evidence.',
      'Do not invent unsupported product capabilities, returns, safety guarantees, APY, or risk-free claims.',
      'Do not use YouTube/social/video pages as authority unless they are present in parsed pages; even then, treat them only as format/context evidence.',
      'Keep output concise and actionable for a final SEO brief writer.',
      'Return at least 3 common_h2_patterns when evidence supports them.',
      'Return at least 3 recommended h2 sections.',
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
      clusterSelection: params.clusterSelection,
      serpEnrichmentContext: params.serpEnrichmentContext,
      competitorKeywordEvidence: params.competitorKeywordEvidence,
      parsedCompetitorPages: params.onPagePages,
    }),
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
