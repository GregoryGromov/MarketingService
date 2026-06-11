import { SeoBriefArtifact } from '../../domain/seo-brief-artifact.entity.js';
import type { SeoBriefRun } from '../../domain/seo-brief-run.aggregate.js';
import type { SeoBriefJsonObject } from '../../domain/seo-briefing.types.js';
import type { SeoBriefAiModelMode } from '../../ports/seo-brief-ai.port.js';
import { readRequestTimeoutMsFromArtifacts } from '../seo-brief-request-timeout.js';

const REQUIRED_FINAL_BRIEF_FIELDS = [
  'primaryKeyword',
  'searchIntent',
  'targetReader',
  'productInsertion',
  'riskNotes',
] as const;

export interface ArticleGenerationContext {
  brandVoice: SeoBriefJsonObject;
  claimsPolicy: SeoBriefJsonObject;
  finalSeoBrief: SeoBriefJsonObject;
  modelMode: SeoBriefAiModelMode | null;
  productProfile: SeoBriefJsonObject;
  requestTimeoutMs: number;
  validation: SeoBriefJsonObject;
}

export function buildArticleGenerationContext(
  run: SeoBriefRun,
  artifacts: SeoBriefArtifact[],
): ArticleGenerationContext {
  const finalSeoBrief = readFinalSeoBrief(artifacts);
  const validation = validateFinalSeoBrief(finalSeoBrief);
  const brandMemory = run.brandMemorySnapshot;

  return {
    finalSeoBrief,
    modelMode: readAiModelMode(artifacts),
    requestTimeoutMs: readRequestTimeoutMsFromArtifacts(artifacts),
    productProfile: {
      productName: run.productName,
      fullName: run.productName,
      company: brandMemory.brandName ?? run.productName,
      category: 'SEO brief product',
      mainValue: run.productDescription,
      targetUsers: uniqueStrings([
        run.audience,
        brandMemory.targetAudience,
      ]),
      useCases: uniqueStrings([
        run.topicSeed,
        readString(finalSeoBrief.mainCluster),
        ...readStringArray(finalSeoBrief.supportingClusters),
      ]),
      approvedFacts: brandMemory.approvedFacts,
    } as unknown as SeoBriefJsonObject,
    claimsPolicy: {
      notAllowedClaims: uniqueStrings([
        ...brandMemory.forbiddenClaims,
        ...brandMemory.bannedPhrases,
        'guaranteed profit',
        'risk-free yield',
        'guaranteed return',
        'no-risk savings',
        'insured profits',
        'best guaranteed APY',
      ]),
      requiredRiskStyle: uniqueStrings([
        ...readStringArray(finalSeoBrief.riskNotes),
        'explain that yield-bearing products carry risk',
        'avoid implying that stablecoins are risk-free',
        'avoid unsupported APY claims',
        'avoid direct financial advice',
        'use calm, educational, risk-aware language',
      ]),
      allowedClaimStyle: [
        'position product as one possible option',
        'compare with alternatives',
        'explain risks clearly',
        'avoid hard promises',
      ],
    } as unknown as SeoBriefJsonObject,
    brandVoice: {
      tone: 'clear, calm, beginner-friendly, practical, risk-aware',
      avoid: uniqueStrings([
        ...brandMemory.bannedPhrases,
        'hype',
        'trader slang',
        'aggressive selling',
        'get-rich-quick language',
      ]),
      prefer: uniqueStrings([
        ...brandMemory.requiredPhrases,
        'plain English',
        'short paragraphs',
        'practical examples',
        'balanced comparisons',
        'clear risk explanations',
      ]),
    } as unknown as SeoBriefJsonObject,
    validation,
  };
}

export function readLatestObjectArtifact(
  artifacts: SeoBriefArtifact[],
  artifactType: string,
): SeoBriefJsonObject | null {
  const artifact = [...artifacts].reverse().find((item) => item.artifactType === artifactType);
  return artifact?.payload && typeof artifact.payload === 'object' && !Array.isArray(artifact.payload)
    ? (artifact.payload as SeoBriefJsonObject)
    : null;
}

export function nextAttemptNumber(artifacts: SeoBriefArtifact[], artifactType: string): number {
  return artifacts.filter((artifact) => artifact.artifactType === artifactType).length + 1;
}

function readFinalSeoBrief(artifacts: SeoBriefArtifact[]): SeoBriefJsonObject {
  const payload = readLatestObjectArtifact(artifacts, 'final_brief_snapshot');
  const brief = payload?.brief;
  if (!brief || typeof brief !== 'object' || Array.isArray(brief)) {
    throw new Error('Generate Final Brief before article generation');
  }

  return brief as SeoBriefJsonObject;
}

function validateFinalSeoBrief(brief: SeoBriefJsonObject): SeoBriefJsonObject {
  const missingFields: string[] = REQUIRED_FINAL_BRIEF_FIELDS.filter((field) => {
    const value = brief[field];
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    return value === null || value === undefined || value === '';
  });

  const hasTitle = Boolean(readString(brief.recommendedH1) ?? readString(brief.recommendedTitle));
  if (!hasTitle) {
    missingFields.push('recommendedH1_or_recommendedTitle');
  }

  const outline = Array.isArray(brief.outline) ? brief.outline : [];
  if (outline.length < 3) {
    missingFields.push('outline_at_least_3_sections');
  }

  if (missingFields.length > 0) {
    throw new Error(`brief_validation_failed: ${missingFields.join(', ')}`);
  }

  return {
    status: 'passed',
    requiredFields: [...REQUIRED_FINAL_BRIEF_FIELDS, 'recommendedH1_or_recommendedTitle', 'outline'],
  };
}

function readAiModelMode(artifacts: SeoBriefArtifact[]): SeoBriefAiModelMode | null {
  const payload = readLatestObjectArtifact(artifacts, 'normalized_input');
  const mode = readString(payload?.aiModelMode);
  return mode === 'flash' || mode === 'pro' || mode === 'pro_thinking' ? mode : null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
}

function uniqueStrings(items: (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    const normalized = item?.trim();
    const key = normalized?.toLowerCase();
    if (!normalized || !key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(normalized);
  }
  return result;
}
