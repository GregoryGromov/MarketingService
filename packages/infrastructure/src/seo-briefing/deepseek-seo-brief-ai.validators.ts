import {
  type BuildProductBridgeResult,
  type ClusterKeywordsResult,
  type ExpandKeywordsResult,
  type ExplainClusterSelectionResult,
  type GenerateSeoBriefResult,
  type SelectRelatedKeywordsResult,
  type SeoBriefAiJourneyStage,
  type SeoBriefAiKeywordIntent,
  type SeoBriefAiProductFit,
  SeoBriefAiValidationError,
  type TriageKeywordsResult,
} from '@marketing-service/seo-briefing';

const KEYWORD_INTENTS = ['informational', 'commercial', 'transactional', 'navigational'] as const;
const JOURNEY_STAGES = ['awareness', 'consideration', 'decision'] as const;
const PRODUCT_FITS = ['strong', 'moderate', 'weak'] as const;

type JsonRecord = Record<string, unknown>;

export function validateExpandKeywordsResult(
  payload: unknown,
  operation: string,
): ExpandKeywordsResult {
  const record = ensureObject(payload, operation, 'payload');
  const hypotheses = ensureArray(record.hypotheses, operation, 'hypotheses').map((item, index) => {
    const hypothesis = ensureObject(item, operation, `hypotheses[${index}]`);
    return {
      keyword: ensureText(hypothesis.keyword, operation, `hypotheses[${index}].keyword`),
      intent: ensureKeywordIntent(hypothesis.intent, operation, `hypotheses[${index}].intent`),
      rationale: ensureText(hypothesis.rationale, operation, `hypotheses[${index}].rationale`),
      audienceFit: ensureText(
        hypothesis.audienceFit,
        operation,
        `hypotheses[${index}].audienceFit`,
      ),
    };
  });

  if (hypotheses.length === 0) {
    throw validationError(
      `${operation} must return at least one keyword hypothesis`,
      operation,
      payload,
    );
  }

  return { hypotheses };
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
    return {
      label: ensureText(cluster.label, operation, `clusters[${index}].label`),
      primaryKeyword: ensureText(
        cluster.primaryKeyword,
        operation,
        `clusters[${index}].primaryKeyword`,
      ),
      intent: ensureKeywordIntent(cluster.intent, operation, `clusters[${index}].intent`),
      keywords: ensureStringArray(cluster.keywords, operation, `clusters[${index}].keywords`),
      rationale: ensureText(cluster.rationale, operation, `clusters[${index}].rationale`),
    };
  });

  if (clusters.length === 0) {
    throw validationError(`${operation} must return at least one cluster`, operation, payload);
  }

  return { clusters };
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

export function validateGenerateSeoBriefResult(
  payload: unknown,
  operation: string,
): GenerateSeoBriefResult {
  const record = ensureObject(payload, operation, 'payload');
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

function validationError(
  message: string,
  operation: string,
  payload: unknown,
): SeoBriefAiValidationError {
  return new SeoBriefAiValidationError(message, operation, 'deepseek', payload as never);
}
