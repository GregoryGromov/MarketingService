import {
  type BuildProductBridgeResult,
  type ClassifySerpDomainsResult,
  type ClusterKeywordsResult,
  type ClusterKeywordCompetitorUrl,
  type SeoBriefClusterSourceConfidence,
  type ExpandKeywordsResult,
  type ExplainClusterSelectionResult,
  type ExtractedSeoBriefContext,
  type ExtractUserPainScenariosResult,
  type GenerateSeoBriefResult,
  type ReviewClusterProductFitResult,
  type KeywordCandidateFitBreakdown,
  type KeywordCandidateScoreBreakdown,
  type KeywordCandidateScoringStatus,
  type ScoreDirtyKeywordCandidatesResult,
  type SelectRelatedKeywordsResult,
  type SeoBriefAiJourneyStage,
  type SeoBriefAiKeywordIntent,
  type SeoBriefAiProductFit,
  type SeoBriefProductFitHypothesis,
  type SeoBriefSearchHypothesisType,
  type SynthesizeOnPageResult,
  SeoBriefAiValidationError,
  type TriageKeywordsResult,
} from '@marketing-service/seo-briefing';

const KEYWORD_INTENTS = ['informational', 'commercial', 'transactional', 'navigational'] as const;
const JOURNEY_STAGES = ['awareness', 'consideration', 'decision'] as const;
const PRODUCT_FITS = ['strong', 'moderate', 'weak'] as const;
const PAIN_PRODUCT_CONNECTIONS = ['direct', 'alternative', 'workflow', 'education', 'weak'] as const;
const SCENARIO_TYPES = ['pain', 'action', 'ecosystem'] as const;
const PRODUCT_FIT_HYPOTHESES = [
  'direct_solution',
  'alternative_solution',
  'workflow_bridge',
  'education_bridge',
  'weak',
] as const;
const SEARCH_HYPOTHESIS_TYPES = [
  'pain',
  'action',
  'ecosystem',
  'comparison',
  'education',
  'risk',
] as const;
const SEARCH_HYPOTHESIS_GROUPS = ['pain_or_jtbd', 'action_problem', 'ecosystem_tools'] as const;
const RANKED_KEYWORDS_DOMAIN_TYPES = [
  'wallet',
  'cex_p2p',
  'local_fintech',
  'crypto_education',
  'other',
] as const;
const ONPAGE_DOMAIN_TYPES = ['media', 'bank', 'broad_blog', 'other'] as const;
const PAIN_SIGNAL_DOMAIN_TYPES = ['forum', 'community', 'social'] as const;
const DOMAIN_PRIORITIES = ['high', 'medium', 'low'] as const;
const KEYWORD_CANDIDATE_STATUSES = ['accepted', 'maybe', 'rejected'] as const;
const KEYWORD_CANDIDATE_FITS = ['strong', 'moderate', 'weak', 'none'] as const;
const CLUSTER_SOURCE_CONFIDENCE = ['low', 'medium', 'high'] as const;
const CLUSTER_PRODUCT_FIT_TYPES = [
  'direct_solution',
  'alternative_solution',
  'workflow_bridge',
  'education_bridge',
  'no_fit',
] as const;
const CLUSTER_PRODUCT_FIT_DECISIONS = ['approve', 'reject', 'supporting_only'] as const;
const SEO_BRIEF_CONTENT_TYPES = [
  'pillar guide',
  'comparison',
  'how-to',
  'educational guide',
] as const;

type JsonRecord = Record<string, unknown>;

export function validateExpandKeywordsResult(
  payload: unknown,
  operation: string,
): ExpandKeywordsResult {
  const record = ensureObject(payload, operation, 'payload');
  if ('search_hypotheses' in record) {
    const hypotheses = ensureArray(
      record.search_hypotheses,
      operation,
      'search_hypotheses',
    ).map((item, index) =>
      validateSearchHypothesis(item, operation, `search_hypotheses[${index}]`),
    );

    if (hypotheses.length === 0) {
      throw validationError(`${operation} must return search_hypotheses`, operation, payload);
    }

    return {
      hypotheses,
      groups: groupSearchHypothesesByType(hypotheses),
    };
  }

  const groups = ensureArray(record.groups, operation, 'groups').map((item, index) => {
    const group = ensureObject(item, operation, `groups[${index}]`);
    const groupId = ensureSearchHypothesisGroup(
      group.groupId,
      operation,
      `groups[${index}].groupId`,
    );
    const label = ensureText(group.label, operation, `groups[${index}].label`);
    return {
      groupId,
      label,
      purpose: ensureText(group.purpose, operation, `groups[${index}].purpose`),
      hypotheses: ensureArray(group.hypotheses, operation, `groups[${index}].hypotheses`).map(
        (hypothesis, hypothesisIndex) =>
          validateKeywordHypothesis(
            hypothesis,
            operation,
            `groups[${index}].hypotheses[${hypothesisIndex}]`,
            { groupId, groupLabel: label },
          ),
      ),
    };
  });
  const hypotheses = ensureArray(record.hypotheses, operation, 'hypotheses').map((item, index) =>
    validateKeywordHypothesis(item, operation, `hypotheses[${index}]`),
  );

  if (hypotheses.length === 0) {
    throw validationError(`${operation} must return keyword hypotheses`, operation, payload);
  }

  return { hypotheses, groups };
}

function validateSearchHypothesis(
  value: unknown,
  operation: string,
  path: string,
): ExpandKeywordsResult['hypotheses'][number] {
  const hypothesis = ensureObject(value, operation, path);
  const hypothesisType = ensureSearchHypothesisType(
    hypothesis.hypothesis_type,
    operation,
    `${path}.hypothesis_type`,
  );
  const productFitHypothesis = ensureProductFitHypothesis(
    hypothesis.product_fit_hypothesis,
    operation,
    `${path}.product_fit_hypothesis`,
  );

  return {
    keyword: ensureText(hypothesis.query, operation, `${path}.query`),
    intent: inferKeywordIntentFromHypothesisType(hypothesisType),
    rationale: ensureText(hypothesis.why_generated, operation, `${path}.why_generated`),
    audienceFit: productFitHypothesis,
    groupId: hypothesisType,
    groupLabel: searchHypothesisTypeLabel(hypothesisType),
    hypothesisType,
    productFitHypothesis,
    riskFlags: ensureStringArray(hypothesis.risk_flags, operation, `${path}.risk_flags`),
  };
}

function groupSearchHypothesesByType(
  hypotheses: ExpandKeywordsResult['hypotheses'],
): NonNullable<ExpandKeywordsResult['groups']> {
  const groups = new Map<SeoBriefSearchHypothesisType, ExpandKeywordsResult['hypotheses']>();
  for (const hypothesis of hypotheses) {
    const type = hypothesis.hypothesisType ?? 'education';
    groups.set(type, [...(groups.get(type) ?? []), hypothesis]);
  }

  return SEARCH_HYPOTHESIS_TYPES
    .filter((type) => groups.has(type))
    .map((type) => ({
      groupId: type,
      label: searchHypothesisTypeLabel(type),
      purpose: searchHypothesisTypePurpose(type),
      hypotheses: groups.get(type) ?? [],
    }));
}

function inferKeywordIntentFromHypothesisType(
  type: SeoBriefSearchHypothesisType,
): SeoBriefAiKeywordIntent {
  if (type === 'action' || type === 'comparison' || type === 'ecosystem') {
    return 'commercial';
  }

  return 'informational';
}

function searchHypothesisTypeLabel(type: SeoBriefSearchHypothesisType): string {
  const labels: Record<SeoBriefSearchHypothesisType, string> = {
    pain: 'Pain',
    action: 'Action',
    ecosystem: 'Ecosystem',
    comparison: 'Comparison',
    education: 'Education',
    risk: 'Risk',
  };
  return labels[type];
}

function searchHypothesisTypePurpose(type: SeoBriefSearchHypothesisType): string {
  const purposes: Record<SeoBriefSearchHypothesisType, string> = {
    pain: 'Queries grounded in manual user pains and jobs-to-be-done.',
    action: 'Queries around concrete actions users may take.',
    ecosystem: 'Queries around tools, platforms, and market ecosystem terms.',
    comparison: 'Queries comparing options, alternatives, or decision criteria.',
    education: 'Queries for beginner-friendly learning and clarification.',
    risk: 'Queries focused on safety, risk, trust, and compliance concerns.',
  };
  return purposes[type];
}

function validateKeywordHypothesis(
  value: unknown,
  operation: string,
  path: string,
  defaults: { groupId?: string; groupLabel?: string } = {},
): ExpandKeywordsResult['hypotheses'][number] {
  const hypothesis = ensureObject(value, operation, path);
  return {
    keyword: ensureText(hypothesis.keyword, operation, `${path}.keyword`),
    intent: ensureKeywordIntent(hypothesis.intent, operation, `${path}.intent`),
    rationale: ensureText(hypothesis.rationale, operation, `${path}.rationale`),
    audienceFit: ensureText(hypothesis.audienceFit, operation, `${path}.audienceFit`),
    groupId: ensureNullableText(hypothesis.groupId, operation, `${path}.groupId`) ?? defaults.groupId,
    groupLabel:
      ensureNullableText(hypothesis.groupLabel, operation, `${path}.groupLabel`) ??
      defaults.groupLabel,
    hypothesisType: ensureOptionalSearchHypothesisType(
      hypothesis.hypothesisType,
      operation,
      `${path}.hypothesisType`,
    ),
    productFitHypothesis: ensureOptionalProductFitHypothesis(
      hypothesis.productFitHypothesis,
      operation,
      `${path}.productFitHypothesis`,
    ),
    riskFlags: ensureOptionalStringArray(hypothesis.riskFlags, operation, `${path}.riskFlags`),
  };
}

export function validateExtractUserPainScenariosResult(
  payload: unknown,
  operation: string,
): ExtractUserPainScenariosResult {
  const record = ensureObject(payload, operation, 'payload');
  const userPains = ensureArray(record.user_pains, operation, 'user_pains').map((item, index) => {
    const pain = ensureObject(item, operation, `user_pains[${index}]`);
    return {
      pain: ensureText(pain.pain, operation, `user_pains[${index}].pain`),
      whyRelevant: ensureText(
        pain.why_relevant,
        operation,
        `user_pains[${index}].why_relevant`,
      ),
      productConnection: ensurePainProductConnection(
        pain.product_connection,
        operation,
        `user_pains[${index}].product_connection`,
      ),
    };
  });
  const userScenarios = ensureArray(record.user_scenarios, operation, 'user_scenarios').map(
    (item, index) => {
      const scenario = ensureObject(item, operation, `user_scenarios[${index}]`);
      return {
        scenario: ensureText(scenario.scenario, operation, `user_scenarios[${index}].scenario`),
        type: ensureScenarioType(scenario.type, operation, `user_scenarios[${index}].type`),
        whyCheck: ensureText(
          scenario.why_check,
          operation,
          `user_scenarios[${index}].why_check`,
        ),
        productFitHypothesis: ensureProductFitHypothesis(
          scenario.product_fit_hypothesis,
          operation,
          `user_scenarios[${index}].product_fit_hypothesis`,
        ),
      };
    },
  );

  if (userPains.length === 0) {
    throw validationError(`${operation} must return user_pains`, operation, payload);
  }
  for (const type of SCENARIO_TYPES) {
    if (!userScenarios.some((scenario) => scenario.type === type)) {
      throw validationError(`${operation} must return a ${type} scenario`, operation, payload);
    }
  }

  return {
    topicHintInterpretation: ensureText(
      record.topic_hint_interpretation,
      operation,
      'topic_hint_interpretation',
    ),
    userPains,
    userScenarios,
    riskNotes: ensureStringArray(record.risk_notes, operation, 'risk_notes'),
  };
}

export function validateExtractContextResult(
  payload: unknown,
  operation: string,
): ExtractedSeoBriefContext {
  const record = ensureObject(payload, operation, 'payload');

  return {
    topicHint: ensureNullableText(record.topicHint, operation, 'topicHint'),
    topicSeed: ensureNullableText(record.topicSeed, operation, 'topicSeed'),
    country: ensureNullableText(record.country, operation, 'country'),
    language: ensureNullableText(record.language, operation, 'language'),
    audience: ensureNullableText(record.audience, operation, 'audience'),
    userPains: ensureOptionalStringArray(record.userPains, operation, 'userPains'),
    userScenarios: ensureOptionalStringArray(record.userScenarios, operation, 'userScenarios'),
    productName: ensureNullableText(record.productName, operation, 'productName'),
    productDescription: ensureNullableText(
      record.productDescription,
      operation,
      'productDescription',
    ),
    keyMessage: ensureNullableText(record.keyMessage, operation, 'keyMessage'),
    audienceBefore: ensureNullableText(record.audienceBefore, operation, 'audienceBefore'),
    audienceAfter: ensureNullableText(record.audienceAfter, operation, 'audienceAfter'),
    cta: ensureNullableText(record.cta, operation, 'cta'),
    knownCompetitors: ensureOptionalStringArray(
      record.knownCompetitors,
      operation,
      'knownCompetitors',
    ),
    brandConstraints: ensureOptionalStringArray(
      record.brandConstraints,
      operation,
      'brandConstraints',
    ),
    claimsConstraints: ensureOptionalStringArray(
      record.claimsConstraints,
      operation,
      'claimsConstraints',
    ),
    preferredAngle: ensureNullableText(record.preferredAngle, operation, 'preferredAngle'),
    excludedTopics: ensureOptionalStringArray(record.excludedTopics, operation, 'excludedTopics'),
    temporaryConstraints: ensureStringArray(
      record.temporaryConstraints,
      operation,
      'temporaryConstraints',
    ),
    missingFields: ensureStringArray(record.missingFields, operation, 'missingFields'),
    notes: ensureStringArray(record.notes, operation, 'notes'),
  };
}

function ensureOptionalStringArray(value: unknown, operation: string, path: string): string[] {
  if (value == null) {
    return [];
  }

  return ensureStringArray(value, operation, path);
}

export function validateTriageKeywordsResult(
  payload: unknown,
  operation: string,
): TriageKeywordsResult {
  const record = ensureObject(payload, operation, 'payload');
  const accepted = ensureArray(record.accepted, operation, 'accepted').map((item, index) => {
    const candidate = ensureObject(item, operation, `accepted[${index}]`);
    return {
      keyword: ensureText(candidate.keyword, operation, `accepted[${index}].keyword`),
      intent: ensureKeywordIntent(candidate.intent, operation, `accepted[${index}].intent`),
      stage: ensureJourneyStage(candidate.stage, operation, `accepted[${index}].stage`),
      reason: ensureText(candidate.reason, operation, `accepted[${index}].reason`),
    };
  });
  const rejected = ensureArray(record.rejected, operation, 'rejected').map((item, index) => {
    const candidate = ensureObject(item, operation, `rejected[${index}]`);
    return {
      keyword: ensureText(candidate.keyword, operation, `rejected[${index}].keyword`),
      reason: ensureText(candidate.reason, operation, `rejected[${index}].reason`),
    };
  });

  return { accepted, rejected };
}

export function validateClusterKeywordsResult(
  payload: unknown,
  operation: string,
): ClusterKeywordsResult {
  const record = ensureObject(payload, operation, 'payload');
  const clusters = ensureArray(record.clusters, operation, 'clusters').map((item, index) => {
    const cluster = ensureObject(item, operation, `clusters[${index}]`);
    const label =
      ensureNullableText(cluster.cluster_name, operation, `clusters[${index}].cluster_name`) ??
      ensureText(cluster.label, operation, `clusters[${index}].label`);
    const primaryKeyword =
      ensureNullableText(
        cluster.primary_keyword_candidate,
        operation,
        `clusters[${index}].primary_keyword_candidate`,
      ) ?? ensureText(cluster.primaryKeyword, operation, `clusters[${index}].primaryKeyword`);
    const secondaryKeywords = ensureOptionalStringArray(
      cluster.secondary_keywords,
      operation,
      `clusters[${index}].secondary_keywords`,
    );
    const questions = ensureOptionalStringArray(
      cluster.questions,
      operation,
      `clusters[${index}].questions`,
    );
    const supportingItems = ensureOptionalStringArray(
      cluster.supporting_items,
      operation,
      `clusters[${index}].supporting_items`,
    );
    const explicitKeywords = ensureOptionalStringArray(
      cluster.keywords,
      operation,
      `clusters[${index}].keywords`,
    );
    const keywords =
      explicitKeywords.length > 0
        ? explicitKeywords
        : uniqueStrings([primaryKeyword, ...secondaryKeywords, ...questions, ...supportingItems]);

    return {
      label,
      primaryKeyword,
      intent: ensureKeywordIntent(cluster.intent, operation, `clusters[${index}].intent`),
      keywords,
      rationale:
        ensureNullableText(cluster.rationale, operation, `clusters[${index}].rationale`) ??
        ensureText(
          cluster.evidence_summary,
          operation,
          `clusters[${index}].evidence_summary`,
        ),
      userIntent: ensureNullableText(
        cluster.user_intent,
        operation,
        `clusters[${index}].user_intent`,
      ),
      secondaryKeywords,
      questions,
      supportingItems,
      competitorUrls: validateClusterCompetitorUrls(
        cluster.competitor_urls,
        operation,
        `clusters[${index}].competitor_urls`,
      ),
      sourceConfidence:
        cluster.source_confidence == null
          ? undefined
          : ensureClusterSourceConfidence(
              cluster.source_confidence,
              operation,
              `clusters[${index}].source_confidence`,
            ),
      evidenceSummary: ensureNullableText(
        cluster.evidence_summary,
        operation,
        `clusters[${index}].evidence_summary`,
      ),
    };
  });

  if (clusters.length === 0) {
    throw validationError(`${operation} must return at least one cluster`, operation, payload);
  }

  return { clusters };
}

function validateClusterCompetitorUrls(
  value: unknown,
  operation: string,
  path: string,
): ClusterKeywordCompetitorUrl[] {
  if (value == null) {
    return [];
  }

  return ensureArray(value, operation, path).map((item, index) => {
    const url = ensureObject(item, operation, `${path}[${index}]`);
    return {
      domain: ensureText(url.domain, operation, `${path}[${index}].domain`),
      url: ensureText(url.url, operation, `${path}[${index}].url`),
      title: ensureNullableText(url.title, operation, `${path}[${index}].title`),
      rankAbsolute: ensureNullableNumber(
        url.rank_absolute,
        operation,
        `${path}[${index}].rank_absolute`,
      ),
    };
  });
}

export function validateSelectRelatedKeywordsResult(
  payload: unknown,
  operation: string,
): SelectRelatedKeywordsResult {
  const record = ensureObject(payload, operation, 'payload');
  const selected = ensureArray(record.selected, operation, 'selected').map((item, index) => {
    const candidate = ensureObject(item, operation, `selected[${index}]`);
    return {
      keyword: ensureText(candidate.keyword, operation, `selected[${index}].keyword`),
      source: ensureText(candidate.source, operation, `selected[${index}].source`),
      sourceText: ensureText(candidate.sourceText, operation, `selected[${index}].sourceText`),
      reason: ensureText(candidate.reason, operation, `selected[${index}].reason`),
    };
  });
  const rejected = ensureArray(record.rejected, operation, 'rejected').map((item, index) => {
    const candidate = ensureObject(item, operation, `rejected[${index}]`);
    return {
      query: ensureText(candidate.query, operation, `rejected[${index}].query`),
      reason: ensureText(candidate.reason, operation, `rejected[${index}].reason`),
    };
  });

  return { selected, rejected };
}

export function validateClassifySerpDomainsResult(
  payload: unknown,
  operation: string,
): ClassifySerpDomainsResult {
  const record = ensureObject(payload, operation, 'payload');
  const rankedKeywordsTargets = ensureArray(
    record.ranked_keywords_targets,
    operation,
    'ranked_keywords_targets',
  ).map((item, index) => {
    const target = ensureObject(item, operation, `ranked_keywords_targets[${index}]`);
    return {
      domain: ensureText(target.domain, operation, `ranked_keywords_targets[${index}].domain`),
      domainType: ensureEnum(
        target.domain_type,
        RANKED_KEYWORDS_DOMAIN_TYPES,
        operation,
        `ranked_keywords_targets[${index}].domain_type`,
      ),
      priority: ensureEnum(
        target.priority,
        DOMAIN_PRIORITIES,
        operation,
        `ranked_keywords_targets[${index}].priority`,
      ),
      reason: ensureText(target.reason, operation, `ranked_keywords_targets[${index}].reason`),
    };
  });

  if (rankedKeywordsTargets.length > 6) {
    throw validationError(
      `${operation} must return no more than 6 ranked_keywords_targets`,
      operation,
      payload,
    );
  }

  const onpageOnlyTargets = ensureArray(
    record.onpage_only_targets,
    operation,
    'onpage_only_targets',
  ).map((item, index) => {
    const target = ensureObject(item, operation, `onpage_only_targets[${index}]`);
    return {
      domain: ensureText(target.domain, operation, `onpage_only_targets[${index}].domain`),
      domainType: ensureEnumOrDefault(
        target.domain_type,
        ONPAGE_DOMAIN_TYPES,
        'other',
        operation,
        `onpage_only_targets[${index}].domain_type`,
      ),
      reason: ensureText(target.reason, operation, `onpage_only_targets[${index}].reason`),
    };
  });
  const painSignalTargets = ensureArray(
    record.pain_signal_targets,
    operation,
    'pain_signal_targets',
  ).map((item, index) => {
    const target = ensureObject(item, operation, `pain_signal_targets[${index}]`);
    return {
      domain: ensureText(target.domain, operation, `pain_signal_targets[${index}].domain`),
      domainType: ensureEnum(
        target.domain_type,
        PAIN_SIGNAL_DOMAIN_TYPES,
        operation,
        `pain_signal_targets[${index}].domain_type`,
      ),
      reason: ensureText(target.reason, operation, `pain_signal_targets[${index}].reason`),
    };
  });
  const ignoredTargets = ensureArray(
    record.ignored_targets,
    operation,
    'ignored_targets',
  ).map((item, index) => {
    const target = ensureObject(item, operation, `ignored_targets[${index}]`);
    return {
      domain: ensureText(target.domain, operation, `ignored_targets[${index}].domain`),
      reason: ensureText(target.reason, operation, `ignored_targets[${index}].reason`),
    };
  });

  return {
    ignoredTargets,
    onpageOnlyTargets,
    painSignalTargets,
    rankedKeywordsTargets,
  };
}

export function validateScoreDirtyKeywordCandidatesResult(
  payload: unknown,
  operation: string,
): ScoreDirtyKeywordCandidatesResult {
  const record = ensureObject(payload, operation, 'payload');
  const accepted = ensureArray(record.accepted, operation, 'accepted').map((item, index) =>
    validateScoredDirtyKeywordCandidate(item, operation, `accepted[${index}]`, 'accepted'),
  );
  const maybe = ensureArray(record.maybe, operation, 'maybe').map((item, index) =>
    validateScoredDirtyKeywordCandidate(item, operation, `maybe[${index}]`, 'maybe'),
  );
  const rejected = ensureArray(record.rejected, operation, 'rejected').map((item, index) =>
    validateScoredDirtyKeywordCandidate(item, operation, `rejected[${index}]`, 'rejected'),
  );
  const summary = ensureObject(record.summary, operation, 'summary');

  return {
    accepted,
    maybe,
    rejected,
    summary: {
      acceptedCount: ensureNonNegativeInteger(
        summary.accepted_count,
        operation,
        'summary.accepted_count',
      ),
      maybeCount: ensureNonNegativeInteger(
        summary.maybe_count,
        operation,
        'summary.maybe_count',
      ),
      rejectedCount: ensureNonNegativeInteger(
        summary.rejected_count,
        operation,
        'summary.rejected_count',
      ),
      notes: ensureStringArray(summary.notes, operation, 'summary.notes'),
    },
  };
}

function validateScoredDirtyKeywordCandidate(
  value: unknown,
  operation: string,
  path: string,
  expectedStatus: KeywordCandidateScoringStatus,
): ScoreDirtyKeywordCandidatesResult['accepted'][number] {
  const candidate = ensureObject(value, operation, path);
  const status = ensureKeywordCandidateStatus(candidate.status, operation, `${path}.status`);
  if (status !== expectedStatus) {
    throw validationError(`${path}.status must be ${expectedStatus}`, operation, value);
  }

  return {
    keyword: ensureText(candidate.keyword, operation, `${path}.keyword`),
    status,
    totalScore: ensureScoreNumber(candidate.total_score, operation, `${path}.total_score`),
    scores: validateKeywordCandidateScores(candidate.scores, operation, `${path}.scores`),
    fit: validateKeywordCandidateFit(candidate.fit, operation, `${path}.fit`),
    intent: ensureKeywordIntent(candidate.intent, operation, `${path}.intent`),
    stage: ensureJourneyStage(candidate.stage, operation, `${path}.stage`),
    reasons: ensureStringArray(candidate.reasons, operation, `${path}.reasons`),
    riskFlags: ensureStringArray(candidate.risk_flags, operation, `${path}.risk_flags`),
    evidenceNotes: ensureStringArray(candidate.evidence_notes, operation, `${path}.evidence_notes`),
  };
}

function validateKeywordCandidateScores(
  value: unknown,
  operation: string,
  path: string,
): KeywordCandidateScoreBreakdown {
  const scores = ensureObject(value, operation, path);
  return {
    topicFit: ensureScoreNumber(scores.topic_fit, operation, `${path}.topic_fit`),
    productFit: ensureScoreNumber(scores.product_fit, operation, `${path}.product_fit`),
    audienceFit: ensureScoreNumber(scores.audience_fit, operation, `${path}.audience_fit`),
    intentFit: ensureScoreNumber(scores.intent_fit, operation, `${path}.intent_fit`),
    riskCompliance: ensureScoreNumber(
      scores.risk_compliance,
      operation,
      `${path}.risk_compliance`,
    ),
    evidence: ensureScoreNumber(scores.evidence, operation, `${path}.evidence`),
  };
}

function validateKeywordCandidateFit(
  value: unknown,
  operation: string,
  path: string,
): KeywordCandidateFitBreakdown {
  const fit = ensureObject(value, operation, path);
  return {
    topicFit: ensureKeywordCandidateFit(fit.topic_fit, operation, `${path}.topic_fit`),
    productFit: ensureKeywordCandidateFit(fit.product_fit, operation, `${path}.product_fit`),
    audienceFit: ensureKeywordCandidateFit(fit.audience_fit, operation, `${path}.audience_fit`),
    intentFit: ensureKeywordCandidateFit(fit.intent_fit, operation, `${path}.intent_fit`),
    riskCompliance: ensureKeywordCandidateFit(
      fit.risk_compliance,
      operation,
      `${path}.risk_compliance`,
    ),
    evidence: ensureKeywordCandidateFit(fit.evidence, operation, `${path}.evidence`),
  };
}

export function validateBuildProductBridgeResult(
  payload: unknown,
  operation: string,
): BuildProductBridgeResult {
  const record = ensureObject(payload, operation, 'payload');
  return {
    fit: ensureProductFit(record.fit, operation, 'fit'),
    summary: ensureText(record.summary, operation, 'summary'),
    positioningAngle: ensureText(record.positioningAngle, operation, 'positioningAngle'),
    cta: ensureText(record.cta, operation, 'cta'),
    talkingPoints: ensureStringArray(record.talkingPoints, operation, 'talkingPoints'),
    risks: ensureStringArray(record.risks, operation, 'risks'),
  };
}

export function validateReviewClusterProductFitResult(
  payload: unknown,
  operation: string,
): ReviewClusterProductFitResult {
  const record = ensureObject(payload, operation, 'payload');
  const clusterProductFit = ensureArray(
    record.cluster_product_fit,
    operation,
    'cluster_product_fit',
  ).map((item, index) => {
    const review = ensureObject(item, operation, `cluster_product_fit[${index}]`);
    return {
      clusterName: ensureText(
        review.cluster_name,
        operation,
        `cluster_product_fit[${index}].cluster_name`,
      ),
      productFitScore: ensureScoreNumber(
        review.product_fit_score,
        operation,
        `cluster_product_fit[${index}].product_fit_score`,
      ),
      productFitType: ensureClusterProductFitType(
        review.product_fit_type,
        operation,
        `cluster_product_fit[${index}].product_fit_type`,
      ),
      decision: ensureClusterProductFitDecision(
        review.decision,
        operation,
        `cluster_product_fit[${index}].decision`,
      ),
      productInsertionAngle: ensureText(
        review.product_insertion_angle,
        operation,
        `cluster_product_fit[${index}].product_insertion_angle`,
      ),
      whereToInsert: ensureText(
        review.where_to_insert,
        operation,
        `cluster_product_fit[${index}].where_to_insert`,
      ),
      whatNotToClaim: ensureStringArray(
        review.what_not_to_claim,
        operation,
        `cluster_product_fit[${index}].what_not_to_claim`,
      ),
      reason: ensureText(review.reason, operation, `cluster_product_fit[${index}].reason`),
    };
  });

  if (clusterProductFit.length === 0) {
    throw validationError(
      `${operation} must return at least one cluster_product_fit item`,
      operation,
      payload,
    );
  }

  return { clusterProductFit };
}

export function validateExplainClusterSelectionResult(
  payload: unknown,
  operation: string,
): ExplainClusterSelectionResult {
  const record = ensureObject(payload, operation, 'payload');
  return {
    summary: ensureText(record.summary, operation, 'summary'),
    reasons: ensureStringArray(record.reasons, operation, 'reasons'),
    rejectedClusters: ensureArray(record.rejectedClusters, operation, 'rejectedClusters').map(
      (item, index) => {
        const cluster = ensureObject(item, operation, `rejectedClusters[${index}]`);
        return {
          label: ensureText(cluster.label, operation, `rejectedClusters[${index}].label`),
          reason: ensureText(cluster.reason, operation, `rejectedClusters[${index}].reason`),
        };
      },
    ),
  };
}

export function validateSynthesizeOnPageResult(
  payload: unknown,
  operation: string,
): SynthesizeOnPageResult {
  const record = ensureObject(payload, operation, 'payload');
  const summary = ensureObject(
    record.competitor_structure_summary,
    operation,
    'competitor_structure_summary',
  );
  const articleStructure = ensureObject(
    record.recommended_article_structure,
    operation,
    'recommended_article_structure',
  );
  const h2 = ensureArray(articleStructure.h2, operation, 'recommended_article_structure.h2').map(
    (item, index) => {
      const section = ensureObject(item, operation, `recommended_article_structure.h2[${index}]`);
      return {
        heading: ensureText(section.heading, operation, `recommended_article_structure.h2[${index}].heading`),
        purpose: ensureText(section.purpose, operation, `recommended_article_structure.h2[${index}].purpose`),
        subpoints: ensureStringArray(
          section.subpoints,
          operation,
          `recommended_article_structure.h2[${index}].subpoints`,
        ),
      };
    },
  );
  const productInsertion = ensureObject(record.product_insertion, operation, 'product_insertion');

  if (h2.length === 0) {
    throw validationError(
      `${operation} must return at least one recommended_article_structure.h2 item`,
      operation,
      payload,
    );
  }

  return {
    competitorStructureSummary: {
      commonH2Patterns: ensureStringArray(
        summary.common_h2_patterns,
        operation,
        'competitor_structure_summary.common_h2_patterns',
      ),
      commonContentBlocks: ensureStringArray(
        summary.common_content_blocks,
        operation,
        'competitor_structure_summary.common_content_blocks',
      ),
      commonFaqQuestions: ensureStringArray(
        summary.common_faq_questions,
        operation,
        'competitor_structure_summary.common_faq_questions',
      ),
      commonTablesOrComparisons: ensureStringArray(
        summary.common_tables_or_comparisons,
        operation,
        'competitor_structure_summary.common_tables_or_comparisons',
      ),
      contentGaps: ensureStringArray(
        summary.content_gaps,
        operation,
        'competitor_structure_summary.content_gaps',
      ),
    },
    recommendedArticleStructure: {
      h1: ensureText(articleStructure.h1, operation, 'recommended_article_structure.h1'),
      h2,
      faq: ensureStringArray(articleStructure.faq, operation, 'recommended_article_structure.faq'),
    },
    productInsertion: {
      section: ensureText(productInsertion.section, operation, 'product_insertion.section'),
      angle: ensureText(productInsertion.angle, operation, 'product_insertion.angle'),
      do: ensureStringArray(productInsertion.do, operation, 'product_insertion.do'),
      avoid: ensureStringArray(productInsertion.avoid, operation, 'product_insertion.avoid'),
    },
    riskAndComplianceNotes: ensureStringArray(
      record.risk_and_compliance_notes,
      operation,
      'risk_and_compliance_notes',
    ),
  };
}

export function validateGenerateSeoBriefResult(
  payload: unknown,
  operation: string,
): GenerateSeoBriefResult {
  const record = ensureObject(payload, operation, 'payload');
  if ('recommended_title' in record || 'product_insertion' in record) {
    return validateProductionSeoBriefResult(record, operation, payload);
  }

  const outline = ensureArray(record.outline, operation, 'outline').map((item, index) => {
    const section = ensureObject(item, operation, `outline[${index}]`);
    return {
      heading: ensureText(section.heading, operation, `outline[${index}].heading`),
      purpose: ensureText(section.purpose, operation, `outline[${index}].purpose`),
      keyPoints: ensureStringArray(section.keyPoints, operation, `outline[${index}].keyPoints`),
    };
  });
  const faq = ensureArray(record.faq, operation, 'faq').map((item, index) => {
    const section = ensureObject(item, operation, `faq[${index}]`);
    return {
      question: ensureText(section.question, operation, `faq[${index}].question`),
      answer: ensureText(section.answer, operation, `faq[${index}].answer`),
    };
  });
  const productPlacement = ensureObject(record.productPlacement, operation, 'productPlacement');

  if (outline.length === 0) {
    throw validationError(
      `${operation} must include at least one outline section`,
      operation,
      payload,
    );
  }

  return {
    title: ensureText(record.title, operation, 'title'),
    metaTitle: ensureText(record.metaTitle, operation, 'metaTitle'),
    metaDescription: ensureText(record.metaDescription, operation, 'metaDescription'),
    angle: ensureText(record.angle, operation, 'angle'),
    outline,
    faq,
    productPlacement: {
      summary: ensureText(productPlacement.summary, operation, 'productPlacement.summary'),
      cta: ensureText(productPlacement.cta, operation, 'productPlacement.cta'),
      sections: ensureStringArray(
        productPlacement.sections,
        operation,
        'productPlacement.sections',
      ),
    },
  };
}

function validateProductionSeoBriefResult(
  record: JsonRecord,
  operation: string,
  payload: unknown,
): GenerateSeoBriefResult {
  const outline = ensureArray(record.outline, operation, 'outline').map((item, index) => {
    const section = ensureObject(item, operation, `outline[${index}]`);
    const h2 = ensureText(section.h2, operation, `outline[${index}].h2`);
    const h3 = ensureStringArray(section.h3, operation, `outline[${index}].h3`);
    const notes = ensureText(section.notes, operation, `outline[${index}].notes`);

    return {
      heading: h2,
      h2,
      h3,
      notes,
      purpose: notes,
      keyPoints: h3.length > 0 ? h3 : [notes],
    };
  });
  const faq = ensureArray(record.faq, operation, 'faq').map((item, index) => {
    const section = ensureObject(item, operation, `faq[${index}]`);
    const answerDirection = ensureText(
      section.answer_direction,
      operation,
      `faq[${index}].answer_direction`,
    );

    return {
      question: ensureText(section.question, operation, `faq[${index}].question`),
      answer: answerDirection,
      answerDirection,
    };
  });
  const productInsertion = ensureObject(record.product_insertion, operation, 'product_insertion');
  const productInsertionResult = {
    where: ensureText(productInsertion.where, operation, 'product_insertion.where'),
    how: ensureText(productInsertion.how, operation, 'product_insertion.how'),
    sampleAngle: ensureText(
      productInsertion.sample_angle,
      operation,
      'product_insertion.sample_angle',
    ),
    avoid: ensureStringArray(productInsertion.avoid, operation, 'product_insertion.avoid'),
  };

  if (outline.length === 0) {
    throw validationError(
      `${operation} must include at least one outline section`,
      operation,
      payload,
    );
  }

  const recommendedTitle = ensureText(record.recommended_title, operation, 'recommended_title');
  const recommendedMetaTitle = ensureText(
    record.recommended_meta_title,
    operation,
    'recommended_meta_title',
  );
  const recommendedMetaDescription = ensureText(
    record.recommended_meta_description,
    operation,
    'recommended_meta_description',
  );
  const searchIntent = ensureText(record.search_intent, operation, 'search_intent');
  const cta = ensureText(record.cta, operation, 'cta');

  return {
    topicHint: ensureText(record.topic_hint, operation, 'topic_hint'),
    mainCluster: ensureText(record.main_cluster, operation, 'main_cluster'),
    supportingClusters: ensureStringArray(
      record.supporting_clusters,
      operation,
      'supporting_clusters',
    ),
    primaryKeyword: ensureText(record.primary_keyword, operation, 'primary_keyword'),
    secondaryKeywords: ensureStringArray(
      record.secondary_keywords,
      operation,
      'secondary_keywords',
    ),
    searchIntent,
    targetReader: ensureText(record.target_reader, operation, 'target_reader'),
    contentType: ensureEnum(
      record.content_type,
      SEO_BRIEF_CONTENT_TYPES,
      operation,
      'content_type',
    ),
    recommendedTitle,
    recommendedH1: ensureText(record.recommended_h1, operation, 'recommended_h1'),
    recommendedMetaTitle,
    recommendedMetaDescription,
    title: recommendedTitle,
    metaTitle: recommendedMetaTitle,
    metaDescription: recommendedMetaDescription,
    angle: searchIntent,
    outline,
    faq,
    productInsertion: productInsertionResult,
    productPlacement: {
      summary: `${productInsertionResult.where}: ${productInsertionResult.how}`,
      cta,
      sections: [productInsertionResult.where],
    },
    competitorGapsToFill: ensureStringArray(
      record.competitor_gaps_to_fill,
      operation,
      'competitor_gaps_to_fill',
    ),
    riskNotes: ensureStringArray(record.risk_notes, operation, 'risk_notes'),
    cta,
    internalLinks: ensureStringArray(record.internal_links, operation, 'internal_links'),
    externalSourcesNeeded: ensureStringArray(
      record.external_sources_needed,
      operation,
      'external_sources_needed',
    ),
  };
}

function ensureObject(value: unknown, operation: string, path: string): JsonRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw validationError(`${path} must be an object`, operation, value);
  }

  return value as JsonRecord;
}

function ensureArray(value: unknown, operation: string, path: string): unknown[] {
  if (!Array.isArray(value)) {
    throw validationError(`${path} must be an array`, operation, value);
  }

  return value;
}

function ensureText(value: unknown, operation: string, path: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw validationError(`${path} must be a non-empty string`, operation, value);
  }

  return value.trim();
}

function ensureNullableText(value: unknown, operation: string, path: string): string | null {
  if (value == null) {
    return null;
  }

  if (typeof value !== 'string') {
    throw validationError(`${path} must be a string or null`, operation, value);
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function ensureStringArray(value: unknown, operation: string, path: string): string[] {
  return ensureArray(value, operation, path).map((item, index) =>
    ensureText(item, operation, `${path}[${index}]`),
  );
}

function ensureKeywordIntent(
  value: unknown,
  operation: string,
  path: string,
): SeoBriefAiKeywordIntent {
  return ensureEnum(value, KEYWORD_INTENTS, operation, path);
}

function ensureJourneyStage(
  value: unknown,
  operation: string,
  path: string,
): SeoBriefAiJourneyStage {
  return ensureEnum(value, JOURNEY_STAGES, operation, path);
}

function ensureProductFit(value: unknown, operation: string, path: string): SeoBriefAiProductFit {
  return ensureEnum(value, PRODUCT_FITS, operation, path);
}

function ensureKeywordCandidateStatus(
  value: unknown,
  operation: string,
  path: string,
): KeywordCandidateScoringStatus {
  return ensureEnum(value, KEYWORD_CANDIDATE_STATUSES, operation, path);
}

function ensureKeywordCandidateFit(
  value: unknown,
  operation: string,
  path: string,
): KeywordCandidateFitBreakdown[keyof KeywordCandidateFitBreakdown] {
  return ensureEnum(value, KEYWORD_CANDIDATE_FITS, operation, path);
}

function ensureClusterSourceConfidence(
  value: unknown,
  operation: string,
  path: string,
): SeoBriefClusterSourceConfidence {
  return ensureEnum(value, CLUSTER_SOURCE_CONFIDENCE, operation, path);
}

function ensureClusterProductFitType(
  value: unknown,
  operation: string,
  path: string,
): ReviewClusterProductFitResult['clusterProductFit'][number]['productFitType'] {
  return ensureEnum(value, CLUSTER_PRODUCT_FIT_TYPES, operation, path);
}

function ensureClusterProductFitDecision(
  value: unknown,
  operation: string,
  path: string,
): ReviewClusterProductFitResult['clusterProductFit'][number]['decision'] {
  return ensureEnum(value, CLUSTER_PRODUCT_FIT_DECISIONS, operation, path);
}

function ensureScoreNumber(value: unknown, operation: string, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) {
    throw validationError(`${path} must be a number from 0 to 100`, operation, value);
  }

  return value;
}

function ensureNullableNumber(value: unknown, operation: string, path: string): number | null {
  if (value == null) {
    return null;
  }

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw validationError(`${path} must be a number or null`, operation, value);
  }

  return value;
}

function uniqueStrings(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    const normalized = item.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push(item.trim());
  }

  return result;
}

function ensureNonNegativeInteger(value: unknown, operation: string, path: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw validationError(`${path} must be a non-negative integer`, operation, value);
  }

  return value;
}

function ensurePainProductConnection(
  value: unknown,
  operation: string,
  path: string,
): ExtractUserPainScenariosResult['userPains'][number]['productConnection'] {
  return ensureEnum(value, PAIN_PRODUCT_CONNECTIONS, operation, path);
}

function ensureScenarioType(
  value: unknown,
  operation: string,
  path: string,
): ExtractUserPainScenariosResult['userScenarios'][number]['type'] {
  return ensureEnum(value, SCENARIO_TYPES, operation, path);
}

function ensureProductFitHypothesis(
  value: unknown,
  operation: string,
  path: string,
): SeoBriefProductFitHypothesis {
  return ensureEnum(value, PRODUCT_FIT_HYPOTHESES, operation, path);
}

function ensureOptionalProductFitHypothesis(
  value: unknown,
  operation: string,
  path: string,
): SeoBriefProductFitHypothesis | null {
  if (value == null) {
    return null;
  }

  return ensureProductFitHypothesis(value, operation, path);
}

function ensureSearchHypothesisType(
  value: unknown,
  operation: string,
  path: string,
): SeoBriefSearchHypothesisType {
  return ensureEnum(value, SEARCH_HYPOTHESIS_TYPES, operation, path);
}

function ensureOptionalSearchHypothesisType(
  value: unknown,
  operation: string,
  path: string,
): SeoBriefSearchHypothesisType | null {
  if (value == null) {
    return null;
  }

  return ensureSearchHypothesisType(value, operation, path);
}

function ensureSearchHypothesisGroup(
  value: unknown,
  operation: string,
  path: string,
): NonNullable<ExpandKeywordsResult['groups']>[number]['groupId'] {
  return ensureEnum(value, SEARCH_HYPOTHESIS_GROUPS, operation, path);
}

function ensureEnum<TValue extends string>(
  value: unknown,
  allowedValues: readonly TValue[],
  operation: string,
  path: string,
): TValue {
  if (typeof value !== 'string' || !allowedValues.includes(value as TValue)) {
    throw validationError(`${path} must be one of ${allowedValues.join(', ')}`, operation, value);
  }

  return value as TValue;
}

function ensureEnumOrDefault<TValue extends string>(
  value: unknown,
  allowedValues: readonly TValue[],
  defaultValue: TValue,
  operation: string,
  path: string,
): TValue {
  if (typeof value === 'string' && allowedValues.includes(value as TValue)) {
    return value as TValue;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    return defaultValue;
  }

  throw validationError(`${path} must be one of ${allowedValues.join(', ')}`, operation, value);
}

function validationError(
  message: string,
  operation: string,
  payload: unknown,
): SeoBriefAiValidationError {
  return new SeoBriefAiValidationError(message, operation, 'deepseek', payload as never);
}
