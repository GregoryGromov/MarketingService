import {
  AggregateRoot,
  createDomainEvent,
  generateId,
  type TypedId,
} from '@marketing-service/shared';

export type ProjectId = TypedId<'project'>;

export interface BrandMemoryDocument {
  title: string;
  url: string | null;
  notes: string | null;
}

export interface SeoCompetitorsMemory {
  mustInclude: string[];
  optional: string[];
  exclude: string[];
}

export interface SeoCompetitorKeywordMapMemory {
  generatedAt: string;
  nextRefreshAt?: string | null;
  refreshIntervalHours?: number | null;
  competitorKeywordsJsonId: string;
  market: {
    country: string;
    language: string;
    locationName: string | null;
  };
  targets: string[];
  targetCount: number;
  itemCount: number;
  deduplicatedKeywordCount: number;
  targetResults: unknown[];
  items: unknown[];
  allKeywordsFlat: unknown[];
}

export interface AdaptationPromptRules {
  generalInstructions: string | null;
  telegram: string | null;
  x: string | null;
  discord: string | null;
  blog: string | null;
  mediaAspectRatios: MediaAspectRatios;
}

export interface MediaAspectRatios {
  telegram: string | null;
  x: string | null;
  discord: string | null;
  blog: string | null;
}

export interface BrandMemory {
  brandName: string | null;
  productDescription: string | null;
  targetAudience: string | null;
  targetAudiences: string[];
  keyMessage: string | null;
  defaultCta: string | null;
  brandConstraints: string[];
  claimsConstraints: string[];
  approvedFacts: string[];
  forbiddenClaims: string[];
  glossary: Record<string, string>;
  bannedPhrases: string[];
  requiredPhrases: string[];
  brandDocs: BrandMemoryDocument[];
  adaptationPromptRules: AdaptationPromptRules;
  seoCompetitors: SeoCompetitorsMemory;
  seoCompetitorKeywordMap: SeoCompetitorKeywordMapMemory | null;
}

export interface CreateProjectParams {
  name: string;
  brandMemory?: Partial<BrandMemory> | null;
}

export interface ProjectProps {
  id: ProjectId;
  name: string;
  brandMemory?: Partial<BrandMemory> | null;
  createdAt: Date;
  updatedAt: Date;
}

function normalizeText(value?: string | null): string | null {
  const nextValue = value?.trim();
  return nextValue ? nextValue : null;
}

function normalizeStringList(values?: string[] | null): string[] {
  if (!values) {
    return [];
  }

  return values.map((value) => value.trim()).filter((value) => value.length > 0);
}

function normalizeTargetAudiences(
  targetAudiences?: string[] | null,
  legacyTargetAudience?: string | null,
): string[] {
  return normalizeStringList([
    ...(targetAudiences ?? []),
    ...(legacyTargetAudience ? [legacyTargetAudience] : []),
  ]).filter((value, index, values) => values.indexOf(value) === index);
}

function normalizeGlossary(glossary?: Record<string, string> | null): Record<string, string> {
  if (!glossary) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(glossary)
      .map(([key, value]) => [key.trim(), value.trim()] as const)
      .filter(([key, value]) => key.length > 0 && value.length > 0),
  );
}

function normalizeBrandDocs(docs?: BrandMemoryDocument[] | null): BrandMemoryDocument[] {
  if (!docs) {
    return [];
  }

  return docs
    .map((doc) => ({
      title: doc.title.trim(),
      url: normalizeText(doc.url),
      notes: normalizeText(doc.notes),
    }))
    .filter((doc) => doc.title.length > 0);
}

function normalizeSeoCompetitors(
  competitors?: Partial<SeoCompetitorsMemory> | null,
): SeoCompetitorsMemory {
  return {
    mustInclude: normalizeStringList(competitors?.mustInclude),
    optional: normalizeStringList(competitors?.optional),
    exclude: normalizeStringList(competitors?.exclude),
  };
}

function normalizeSeoCompetitorKeywordMap(
  map?: Partial<SeoCompetitorKeywordMapMemory> | null,
): SeoCompetitorKeywordMapMemory | null {
  if (!map) {
    return null;
  }

  const generatedAt = normalizeText(map.generatedAt);
  const competitorKeywordsJsonId = normalizeText(map.competitorKeywordsJsonId);
  if (!generatedAt || !competitorKeywordsJsonId) {
    return null;
  }

  return {
    generatedAt,
    nextRefreshAt: normalizeText(map.nextRefreshAt),
    refreshIntervalHours: Number.isFinite(map.refreshIntervalHours)
      ? Number(map.refreshIntervalHours)
      : null,
    competitorKeywordsJsonId,
    market: {
      country: normalizeText(map.market?.country) ?? '',
      language: normalizeText(map.market?.language) ?? '',
      locationName: normalizeText(map.market?.locationName),
    },
    targets: normalizeStringList(map.targets),
    targetCount: Number.isFinite(map.targetCount) ? Number(map.targetCount) : 0,
    itemCount: Number.isFinite(map.itemCount) ? Number(map.itemCount) : 0,
    deduplicatedKeywordCount: Number.isFinite(map.deduplicatedKeywordCount)
      ? Number(map.deduplicatedKeywordCount)
      : 0,
    targetResults: Array.isArray(map.targetResults) ? map.targetResults : [],
    items: Array.isArray(map.items) ? map.items : [],
    allKeywordsFlat: Array.isArray(map.allKeywordsFlat) ? map.allKeywordsFlat : [],
  };
}

function normalizeAdaptationPromptRules(
  rules?: Partial<AdaptationPromptRules> | null,
): AdaptationPromptRules {
  return {
    generalInstructions: normalizeText(rules?.generalInstructions),
    telegram: normalizeText(rules?.telegram),
    x: normalizeText(rules?.x),
    discord: normalizeText(rules?.discord),
    blog: normalizeText(rules?.blog),
    mediaAspectRatios: normalizeMediaAspectRatios(rules?.mediaAspectRatios),
  };
}

function normalizeMediaAspectRatios(ratios?: Partial<MediaAspectRatios> | null): MediaAspectRatios {
  return {
    telegram: normalizeText(ratios?.telegram) ?? '1:1',
    x: normalizeText(ratios?.x) ?? '16:9',
    discord: normalizeText(ratios?.discord) ?? '16:9',
    blog: normalizeText(ratios?.blog) ?? '1200:630',
  };
}

function normalizeBrandMemory(brandMemory?: Partial<BrandMemory> | null): BrandMemory {
  const targetAudiences = normalizeTargetAudiences(
    brandMemory?.targetAudiences,
    brandMemory?.targetAudience,
  );
  return {
    brandName: normalizeText(brandMemory?.brandName),
    productDescription: normalizeText(brandMemory?.productDescription),
    targetAudience: targetAudiences[0] ?? null,
    targetAudiences,
    keyMessage: normalizeText(brandMemory?.keyMessage),
    defaultCta: normalizeText(brandMemory?.defaultCta),
    brandConstraints: normalizeStringList(brandMemory?.brandConstraints),
    claimsConstraints: normalizeStringList(brandMemory?.claimsConstraints),
    approvedFacts: normalizeStringList(brandMemory?.approvedFacts),
    forbiddenClaims: normalizeStringList(brandMemory?.forbiddenClaims),
    glossary: normalizeGlossary(brandMemory?.glossary),
    bannedPhrases: normalizeStringList(brandMemory?.bannedPhrases),
    requiredPhrases: normalizeStringList(brandMemory?.requiredPhrases),
    brandDocs: normalizeBrandDocs(brandMemory?.brandDocs),
    adaptationPromptRules: normalizeAdaptationPromptRules(brandMemory?.adaptationPromptRules),
    seoCompetitors: normalizeSeoCompetitors(brandMemory?.seoCompetitors),
    seoCompetitorKeywordMap: normalizeSeoCompetitorKeywordMap(brandMemory?.seoCompetitorKeywordMap),
  };
}

export class Project extends AggregateRoot {
  private constructor(
    public readonly id: ProjectId,
    public name: string,
    public brandMemory: BrandMemory,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {
    super();
  }

  static create(params: CreateProjectParams): Project {
    const now = new Date();
    const project = new Project(
      generateId('project'),
      params.name.trim(),
      normalizeBrandMemory(params.brandMemory),
      now,
      now,
    );

    project.addEvent(
      createDomainEvent({
        eventName: 'ProjectCreated',
        aggregateId: project.id,
      }),
    );

    return project;
  }

  static rehydrate(props: ProjectProps): Project {
    return new Project(
      props.id,
      props.name,
      normalizeBrandMemory(props.brandMemory),
      props.createdAt,
      props.updatedAt,
    );
  }

  rename(name: string): void {
    const nextName = name.trim();
    if (!nextName || nextName === this.name) {
      return;
    }

    this.name = nextName;
    this.updatedAt = new Date();

    this.addEvent(
      createDomainEvent({
        eventName: 'ProjectRenamed',
        aggregateId: this.id,
      }),
    );
  }

  updateBrandMemory(brandMemory: Partial<BrandMemory>): void {
    this.brandMemory = normalizeBrandMemory({
      ...this.brandMemory,
      ...brandMemory,
      adaptationPromptRules:
        brandMemory.adaptationPromptRules !== undefined
          ? {
              ...this.brandMemory.adaptationPromptRules,
              ...brandMemory.adaptationPromptRules,
              mediaAspectRatios:
                brandMemory.adaptationPromptRules.mediaAspectRatios !== undefined
                  ? {
                      ...this.brandMemory.adaptationPromptRules.mediaAspectRatios,
                      ...brandMemory.adaptationPromptRules.mediaAspectRatios,
                    }
                  : this.brandMemory.adaptationPromptRules.mediaAspectRatios,
            }
          : this.brandMemory.adaptationPromptRules,
    });
    this.updatedAt = new Date();

    this.addEvent(
      createDomainEvent({
        eventName: 'ProjectBrandMemoryUpdated',
        aggregateId: this.id,
      }),
    );
  }
}
