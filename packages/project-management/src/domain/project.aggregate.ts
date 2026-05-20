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

export interface AdaptationPromptRules {
  generalInstructions: string | null;
  telegram: string | null;
  x: string | null;
  discord: string | null;
  blog: string | null;
}

export interface BrandMemory {
  brandName: string | null;
  productDescription: string | null;
  targetAudience: string | null;
  approvedFacts: string[];
  forbiddenClaims: string[];
  glossary: Record<string, string>;
  bannedPhrases: string[];
  requiredPhrases: string[];
  brandDocs: BrandMemoryDocument[];
  adaptationPromptRules: AdaptationPromptRules;
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

  return values
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
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

function normalizeAdaptationPromptRules(
  rules?: Partial<AdaptationPromptRules> | null,
): AdaptationPromptRules {
  return {
    generalInstructions: normalizeText(rules?.generalInstructions),
    telegram: normalizeText(rules?.telegram),
    x: normalizeText(rules?.x),
    discord: normalizeText(rules?.discord),
    blog: normalizeText(rules?.blog),
  };
}

function normalizeBrandMemory(brandMemory?: Partial<BrandMemory> | null): BrandMemory {
  return {
    brandName: normalizeText(brandMemory?.brandName),
    productDescription: normalizeText(brandMemory?.productDescription),
    targetAudience: normalizeText(brandMemory?.targetAudience),
    approvedFacts: normalizeStringList(brandMemory?.approvedFacts),
    forbiddenClaims: normalizeStringList(brandMemory?.forbiddenClaims),
    glossary: normalizeGlossary(brandMemory?.glossary),
    bannedPhrases: normalizeStringList(brandMemory?.bannedPhrases),
    requiredPhrases: normalizeStringList(brandMemory?.requiredPhrases),
    brandDocs: normalizeBrandDocs(brandMemory?.brandDocs),
    adaptationPromptRules: normalizeAdaptationPromptRules(
      brandMemory?.adaptationPromptRules,
    ),
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
