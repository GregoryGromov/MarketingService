import {
  AggregateRoot,
  createDomainEvent,
  generateId,
  type TypedId,
} from '@marketing-service/shared';
import type { SeoBriefBrandMemorySnapshot } from './seo-briefing.types.js';

export type SeoBriefRunId = TypedId<'seo_brief_run'>;
export type SeoBriefRunStatus =
  | 'created'
  | 'awaiting_confirmation'
  | 'queued'
  | 'running'
  | 'done'
  | 'failed'
  | 'rejected'
  | 'needs_manual_review';

export interface CreateSeoBriefRunParams {
  projectId?: string | null;
  topicSeed: string;
  country: string;
  language: string;
  audience: string;
  productName: string;
  productDescription: string;
  brandMemorySnapshot: SeoBriefBrandMemorySnapshot;
  keyMessage?: string | null;
  audienceBefore?: string | null;
  audienceAfter?: string | null;
  cta?: string | null;
  seoWeight?: number;
  productWeight?: number;
}

export interface SeoBriefRunProps {
  id: SeoBriefRunId;
  projectId: string | null;
  topicSeed: string;
  country: string;
  language: string;
  audience: string;
  productName: string;
  productDescription: string;
  brandMemorySnapshot: SeoBriefBrandMemorySnapshot;
  keyMessage: string | null;
  audienceBefore: string | null;
  audienceAfter: string | null;
  cta: string | null;
  seoWeight: number;
  productWeight: number;
  status: SeoBriefRunStatus;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function normalizeText(value?: string | null): string | null {
  const nextValue = value?.trim();
  return nextValue ? nextValue : null;
}

function normalizeRequiredText(value: string): string {
  const nextValue = value.trim();
  if (nextValue.length === 0) {
    throw new Error('SEO brief run text fields must not be empty');
  }

  return nextValue;
}

function normalizeWeight(value: number | undefined, fallback: number): number {
  if (value === undefined || Number.isNaN(value) || !Number.isFinite(value)) {
    return fallback;
  }

  if (value < 0) {
    return 0;
  }

  if (value > 1) {
    return 1;
  }

  return value;
}

function normalizeWeights(input: { seoWeight?: number | null; productWeight?: number | null }): {
  seoWeight: number;
  productWeight: number;
} {
  const seoWeight = input.seoWeight == null ? null : normalizeWeight(input.seoWeight, 0.5);
  const productWeight =
    input.productWeight == null ? null : normalizeWeight(input.productWeight, 0.5);

  if (seoWeight == null && productWeight == null) {
    return { seoWeight: 0.5, productWeight: 0.5 };
  }

  if (seoWeight != null && productWeight == null) {
    return { seoWeight, productWeight: normalizeWeight(1 - seoWeight, 0.5) };
  }

  if (seoWeight == null && productWeight != null) {
    return { seoWeight: normalizeWeight(1 - productWeight, 0.5), productWeight };
  }

  const total = (seoWeight ?? 0) + (productWeight ?? 0);
  if (total <= 0) {
    return { seoWeight: 0.5, productWeight: 0.5 };
  }

  return {
    seoWeight: (seoWeight ?? 0) / total,
    productWeight: (productWeight ?? 0) / total,
  };
}

function normalizeBrandMemorySnapshot(
  snapshot: SeoBriefBrandMemorySnapshot,
): SeoBriefBrandMemorySnapshot {
  return {
    brandName: normalizeText(snapshot.brandName),
    productDescription: normalizeText(snapshot.productDescription),
    targetAudience: normalizeText(snapshot.targetAudience),
    approvedFacts: snapshot.approvedFacts.map((item) => item.trim()).filter(Boolean),
    forbiddenClaims: snapshot.forbiddenClaims.map((item) => item.trim()).filter(Boolean),
    glossary: Object.fromEntries(
      Object.entries(snapshot.glossary)
        .map(([key, value]) => [key.trim(), value.trim()] as const)
        .filter(([key, value]) => key.length > 0 && value.length > 0),
    ),
    bannedPhrases: snapshot.bannedPhrases.map((item) => item.trim()).filter(Boolean),
    requiredPhrases: snapshot.requiredPhrases.map((item) => item.trim()).filter(Boolean),
    brandDocs: snapshot.brandDocs
      .map((doc) => ({
        title: doc.title.trim(),
        url: normalizeText(doc.url),
        notes: normalizeText(doc.notes),
      }))
      .filter((doc) => doc.title.length > 0),
    adaptationPromptRules: snapshot.adaptationPromptRules ?? null,
  };
}

export class SeoBriefRun extends AggregateRoot {
  private constructor(
    public readonly id: SeoBriefRunId,
    public readonly projectId: string | null,
    public topicSeed: string,
    public country: string,
    public language: string,
    public audience: string,
    public productName: string,
    public productDescription: string,
    public brandMemorySnapshot: SeoBriefBrandMemorySnapshot,
    public keyMessage: string | null,
    public audienceBefore: string | null,
    public audienceAfter: string | null,
    public cta: string | null,
    public seoWeight: number,
    public productWeight: number,
    public status: SeoBriefRunStatus,
    public failureReason: string | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {
    super();
  }

  static create(params: CreateSeoBriefRunParams): SeoBriefRun {
    const now = new Date();
    const run = new SeoBriefRun(
      generateId('seo_brief_run'),
      normalizeText(params.projectId),
      normalizeRequiredText(params.topicSeed),
      normalizeRequiredText(params.country),
      normalizeRequiredText(params.language),
      normalizeRequiredText(params.audience),
      normalizeRequiredText(params.productName),
      normalizeRequiredText(params.productDescription),
      normalizeBrandMemorySnapshot(params.brandMemorySnapshot),
      normalizeText(params.keyMessage),
      normalizeText(params.audienceBefore),
      normalizeText(params.audienceAfter),
      normalizeText(params.cta),
      normalizeWeight(params.seoWeight, 0.5),
      normalizeWeight(params.productWeight, 0.5),
      'created',
      null,
      now,
      now,
    );

    run.addEvent(
      createDomainEvent({
        eventName: 'SeoBriefRunCreated',
        aggregateId: run.id,
      }),
    );

    return run;
  }

  static rehydrate(props: SeoBriefRunProps): SeoBriefRun {
    return new SeoBriefRun(
      props.id,
      props.projectId,
      props.topicSeed,
      props.country,
      props.language,
      props.audience,
      props.productName,
      props.productDescription,
      normalizeBrandMemorySnapshot(props.brandMemorySnapshot),
      props.keyMessage,
      props.audienceBefore,
      props.audienceAfter,
      props.cta,
      props.seoWeight,
      props.productWeight,
      props.status,
      props.failureReason,
      props.createdAt,
      props.updatedAt,
    );
  }

  queue(): void {
    this.status = 'queued';
    this.failureReason = null;
    this.updatedAt = new Date();
  }

  start(): void {
    this.status = 'running';
    this.failureReason = null;
    this.updatedAt = new Date();
  }

  complete(): void {
    this.status = 'done';
    this.failureReason = null;
    this.updatedAt = new Date();
  }

  awaitConfirmation(): void {
    this.status = 'awaiting_confirmation';
    this.failureReason = null;
    this.updatedAt = new Date();
  }

  fail(reason: string): void {
    this.status = 'failed';
    this.failureReason = normalizeRequiredText(reason);
    this.updatedAt = new Date();
  }

  reject(reason: string): void {
    this.status = 'rejected';
    this.failureReason = normalizeRequiredText(reason);
    this.updatedAt = new Date();
  }

  markNeedsManualReview(reason: string | null = null): void {
    this.status = 'needs_manual_review';
    this.failureReason = normalizeText(reason);
    this.updatedAt = new Date();
  }

  setSeoProductBalance(input: { seoWeight?: number | null; productWeight?: number | null }): void {
    const normalized = normalizeWeights(input);
    this.seoWeight = normalized.seoWeight;
    this.productWeight = normalized.productWeight;
    this.updatedAt = new Date();
  }
}
