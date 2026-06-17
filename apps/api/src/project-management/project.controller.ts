import {
  AcknowledgeApprovalItemCommand,
  CreateCampaignCommand,
  type CreateCampaignPlannedPublicationOverride,
  CreateProjectCommand,
  CreateProjectMarkerCommand,
  CreateProjectMarkerPlacementCommand,
  DeleteProjectCommand,
  DeleteProjectMarkerCommand,
  GetProjectApprovalInboxQuery,
  GetProjectMarkerPlacementsQuery,
  GetProjectQuery,
  ListProjectCampaignsQuery,
  ListProjectMarkersQuery,
  ListProjectsQuery,
  UpdateProjectBrandMemoryCommand,
  type BrandMemory,
  type ApprovalItemId,
  type ProjectId,
  type ProjectMarkerId,
} from '@marketing-service/project-management';
import {
  SeoResearchPort,
  type SeoBriefJsonValue,
  type SeoRankedKeywordItem,
} from '@marketing-service/seo-briefing';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import * as v from 'valibot';
import { rethrowProjectManagementHttpError } from './project-management-http-error';
import { normalizePublicationTypeInput as normalizePublicationTypeInputValue } from './publication-type-input';
import { ValibotPipe } from '../infrastructure/common/valibot-validation.pipe';

const CreateProjectSchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(120)),
});

const CreateProjectMarkerSchema = v.object({
  title: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(180)),
  notes: v.optional(v.nullish(v.pipe(v.string(), v.trim(), v.maxLength(2000)))),
});

const CreateProjectMarkerPlacementSchema = v.object({
  markerId: v.pipe(v.string(), v.trim(), v.minLength(1)),
  channelId: v.pipe(v.string(), v.trim(), v.minLength(1)),
  targetLanguage: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(16)),
  publishAt: v.pipe(v.string(), v.trim(), v.minLength(1)),
});

const BrandMemoryDocumentSchema = v.object({
  title: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(180)),
  url: v.optional(v.nullish(v.pipe(v.string(), v.trim(), v.maxLength(1000)))),
  notes: v.optional(v.nullish(v.pipe(v.string(), v.trim(), v.maxLength(2000)))),
});

const GlossarySchema = v.record(
  v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(120)),
  v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(300)),
);

const AdaptationPromptRulesSchema = v.object({
  generalInstructions: v.optional(
    v.nullish(v.pipe(v.string(), v.trim(), v.maxLength(20000))),
  ),
  telegram: v.optional(v.nullish(v.pipe(v.string(), v.trim(), v.maxLength(20000)))),
  x: v.optional(v.nullish(v.pipe(v.string(), v.trim(), v.maxLength(20000)))),
  discord: v.optional(v.nullish(v.pipe(v.string(), v.trim(), v.maxLength(20000)))),
  blog: v.optional(v.nullish(v.pipe(v.string(), v.trim(), v.maxLength(20000)))),
  mediaAspectRatios: v.optional(
    v.nullish(
      v.object({
        telegram: v.optional(v.nullish(v.pipe(v.string(), v.trim(), v.maxLength(32)))),
        x: v.optional(v.nullish(v.pipe(v.string(), v.trim(), v.maxLength(32)))),
        discord: v.optional(v.nullish(v.pipe(v.string(), v.trim(), v.maxLength(32)))),
        blog: v.optional(v.nullish(v.pipe(v.string(), v.trim(), v.maxLength(32)))),
      }),
    ),
  ),
});

const UpdateProjectBrandMemorySchema = v.object({
  brandName: v.optional(v.nullish(v.pipe(v.string(), v.trim(), v.maxLength(120)))),
  productDescription: v.optional(v.nullish(v.pipe(v.string(), v.trim(), v.maxLength(4000)))),
  targetAudience: v.optional(v.nullish(v.pipe(v.string(), v.trim(), v.maxLength(2000)))),
  keyMessage: v.optional(v.nullish(v.pipe(v.string(), v.trim(), v.maxLength(4000)))),
  defaultCta: v.optional(v.nullish(v.pipe(v.string(), v.trim(), v.maxLength(1000)))),
  brandConstraints: v.optional(
    v.nullish(v.array(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(500)))),
  ),
  claimsConstraints: v.optional(
    v.nullish(v.array(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(500)))),
  ),
  approvedFacts: v.optional(
    v.nullish(v.array(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(500)))),
  ),
  forbiddenClaims: v.optional(
    v.nullish(v.array(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(500)))),
  ),
  glossary: v.optional(v.nullish(GlossarySchema)),
  bannedPhrases: v.optional(
    v.nullish(v.array(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(240)))),
  ),
  requiredPhrases: v.optional(
    v.nullish(v.array(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(240)))),
  ),
  brandDocs: v.optional(v.nullish(v.array(BrandMemoryDocumentSchema))),
  adaptationPromptRules: v.optional(v.nullish(AdaptationPromptRulesSchema)),
  seoCompetitors: v.optional(
    v.nullish(
      v.object({
        mustInclude: v.optional(
          v.nullish(v.array(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(500)))),
        ),
        optional: v.optional(
          v.nullish(v.array(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(500)))),
        ),
        exclude: v.optional(
          v.nullish(v.array(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(500)))),
        ),
      }),
    ),
  ),
});

const CreateCampaignSchema = v.object({
  presetId: v.pipe(v.string(), v.trim(), v.minLength(1)),
  name: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(160)),
  startDate: v.pipe(v.string(), v.trim(), v.minLength(1)),
  sourceLanguage: v.optional(v.nullish(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(16)))),
  publishingTarget: v.optional(v.picklist(['test', 'production'])),
  extraInstructions: v.optional(v.nullish(v.pipe(v.string(), v.trim(), v.maxLength(5000)))),
  plannedPublicationOverrides: v.optional(
    v.nullish(
      v.array(
        v.object({
          presetPublicationId: v.optional(
            v.nullish(v.pipe(v.string(), v.trim(), v.minLength(1))),
          ),
          dayOffset: v.pipe(v.string(), v.trim(), v.minLength(1)),
          localTime: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(5)),
          channel: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(64)),
          language: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(16)),
          publicationType: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(64)),
          style: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(64)),
        }),
      ),
    ),
  ),
});

type CreateProjectDto = v.InferOutput<typeof CreateProjectSchema>;
type CreateProjectMarkerDto = v.InferOutput<typeof CreateProjectMarkerSchema>;
type CreateProjectMarkerPlacementDto = v.InferOutput<typeof CreateProjectMarkerPlacementSchema>;
type UpdateProjectBrandMemoryDto = v.InferOutput<typeof UpdateProjectBrandMemorySchema>;
type CreateCampaignDto = v.InferOutput<typeof CreateCampaignSchema>;

function parseDateInput(value: string, field: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`${field} must be a valid ISO date string`);
  }

  return date;
}

function parseDayOffsetInput(value: string): number {
  if (!/^-?\d+$/.test(value)) {
    throw new BadRequestException('plannedPublicationOverrides.dayOffset must be an integer');
  }

  return Number.parseInt(value, 10);
}

function normalizeLocalTimeInput(value: string): string {
  const trimmed = value.trim();
  const match = /^(\d{2}):(\d{2})$/.exec(trimmed);

  if (!match) {
    throw new BadRequestException(
      'plannedPublicationOverrides.localTime must use HH:MM format',
    );
  }

  const hours = Number.parseInt(match[1] ?? '0', 10);
  const minutes = Number.parseInt(match[2] ?? '0', 10);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new BadRequestException(
      'plannedPublicationOverrides.localTime must use a valid 24-hour time',
    );
  }

  return trimmed;
}

function normalizePublicationTypeInput(channel: string, publicationType: string): string {
  return normalizePublicationTypeInputValue(
    channel,
    publicationType,
    'plannedPublicationOverrides.publicationType',
  );
}

function normalizePlannedPublicationOverrides(
  overrides: CreateCampaignDto['plannedPublicationOverrides'],
): CreateCampaignPlannedPublicationOverride[] | undefined {
  if (overrides == null) {
    return undefined;
  }

  return overrides.map((override) => ({
    presetPublicationId: override.presetPublicationId ?? null,
    dayOffset: parseDayOffsetInput(override.dayOffset),
    localTime: normalizeLocalTimeInput(override.localTime),
    channel: override.channel,
    language: override.language,
    publicationType: normalizePublicationTypeInput(
      override.channel,
      override.publicationType,
    ),
    style: override.style,
  }));
}

function normalizeBrandMemoryUpdate(
  dto: UpdateProjectBrandMemoryDto,
): Partial<BrandMemory> {
  return {
    ...(dto.brandName !== undefined ? { brandName: dto.brandName } : {}),
    ...(dto.productDescription !== undefined
      ? { productDescription: dto.productDescription }
      : {}),
    ...(dto.targetAudience !== undefined ? { targetAudience: dto.targetAudience } : {}),
    ...(dto.keyMessage !== undefined ? { keyMessage: dto.keyMessage } : {}),
    ...(dto.defaultCta !== undefined ? { defaultCta: dto.defaultCta } : {}),
    ...(dto.brandConstraints !== undefined
      ? { brandConstraints: dto.brandConstraints ?? [] }
      : {}),
    ...(dto.claimsConstraints !== undefined
      ? { claimsConstraints: dto.claimsConstraints ?? [] }
      : {}),
    ...(dto.approvedFacts !== undefined
      ? { approvedFacts: dto.approvedFacts ?? [] }
      : {}),
    ...(dto.forbiddenClaims !== undefined
      ? { forbiddenClaims: dto.forbiddenClaims ?? [] }
      : {}),
    ...(dto.glossary !== undefined ? { glossary: dto.glossary ?? {} } : {}),
    ...(dto.bannedPhrases !== undefined
      ? { bannedPhrases: dto.bannedPhrases ?? [] }
      : {}),
    ...(dto.requiredPhrases !== undefined
      ? { requiredPhrases: dto.requiredPhrases ?? [] }
      : {}),
    ...(dto.brandDocs !== undefined
      ? {
          brandDocs: (dto.brandDocs ?? []).map((doc) => ({
            title: doc.title,
            url: doc.url ?? null,
            notes: doc.notes ?? null,
          })),
        }
      : {}),
    ...(dto.adaptationPromptRules !== undefined
      ? {
          adaptationPromptRules: dto.adaptationPromptRules
            ? {
                generalInstructions:
                  dto.adaptationPromptRules.generalInstructions ?? null,
                telegram: dto.adaptationPromptRules.telegram ?? null,
                x: dto.adaptationPromptRules.x ?? null,
                discord: dto.adaptationPromptRules.discord ?? null,
                blog: dto.adaptationPromptRules.blog ?? null,
                mediaAspectRatios: {
                  telegram:
                    dto.adaptationPromptRules.mediaAspectRatios?.telegram ?? '1:1',
                  x: dto.adaptationPromptRules.mediaAspectRatios?.x ?? '16:9',
                  discord:
                    dto.adaptationPromptRules.mediaAspectRatios?.discord ?? '16:9',
                  blog:
                    dto.adaptationPromptRules.mediaAspectRatios?.blog ?? '1200:630',
                },
              }
            : {
                generalInstructions: null,
                telegram: null,
                x: null,
                discord: null,
                blog: null,
                mediaAspectRatios: {
                  telegram: '1:1',
                  x: '16:9',
                  discord: '16:9',
                  blog: '1200:630',
                },
              },
        }
      : {}),
    ...(dto.seoCompetitors !== undefined
      ? {
          seoCompetitors: {
            mustInclude: dto.seoCompetitors?.mustInclude ?? [],
            optional: dto.seoCompetitors?.optional ?? [],
            exclude: dto.seoCompetitors?.exclude ?? [],
          },
        }
      : {}),
  };
}

interface SeoCompetitorTarget {
  raw: string;
  source: 'must_include' | 'optional';
  target: string;
}

interface SeoCompetitorSkipped {
  raw: string;
  reason: string;
  source: 'must_include' | 'optional' | 'exclude';
}

interface FlatCompetitorKeyword {
  bestRankAbsolute: number | null;
  competitorDomains: string[];
  estimatedTrafficMax: number | null;
  evidenceCount: number;
  intent: string | null;
  keyword: string;
  keywordDifficulty: number | null;
  searchVolume: number | null;
  source: 'ranked_keywords';
}

const SEO_COMPETITOR_KEYWORD_REFRESH_INTERVAL_HOURS = 24;
const SEO_COMPETITOR_KEYWORD_REFRESH_CHECK_INTERVAL_MS = 5 * 60 * 1000;

function normalizeNullableText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeRankedKeywordsLimit(value: unknown): number {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number.parseInt(value, 10)
        : Number.NaN;

  if (!Number.isFinite(parsed)) {
    return 100;
  }

  return Math.min(500, Math.max(10, Math.trunc(parsed)));
}

function normalizeCompetitorTarget(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }

  const withoutProtocol = trimmed.replace(/^https?:\/\//, '').replace(/^www\./, '');
  const host = withoutProtocol.split(/[/?#]/)[0]?.trim();
  if (!host || !host.includes('.')) {
    return null;
  }

  return host;
}

function resolveSeoCompetitorTargets(competitors?: BrandMemory['seoCompetitors'] | null): {
  skipped: SeoCompetitorSkipped[];
  targets: SeoCompetitorTarget[];
} {
  const skipped: SeoCompetitorSkipped[] = [];
  const targets = new Map<string, SeoCompetitorTarget>();
  const safeCompetitors: NonNullable<BrandMemory['seoCompetitors']> = competitors ?? {
    mustInclude: [],
    optional: [],
    exclude: [],
  };
  const excluded = new Set(
    (safeCompetitors.exclude ?? [])
      .map(normalizeCompetitorTarget)
      .filter((value): value is string => Boolean(value)),
  );

  const addTarget = (
    raw: string,
    source: SeoCompetitorTarget['source'],
  ): void => {
    const target = normalizeCompetitorTarget(raw);
    if (!target) {
      skipped.push({ raw, source, reason: 'not_a_domain' });
      return;
    }

    if (excluded.has(target)) {
      skipped.push({ raw, source, reason: 'excluded_in_brand_memory' });
      return;
    }

    if (!targets.has(target)) {
      targets.set(target, { raw, source, target });
    }
  };

  for (const raw of safeCompetitors.mustInclude ?? []) {
    addTarget(raw, 'must_include');
  }

  for (const raw of safeCompetitors.optional ?? []) {
    addTarget(raw, 'optional');
  }

  for (const raw of safeCompetitors.exclude ?? []) {
    if (!normalizeCompetitorTarget(raw)) {
      skipped.push({ raw, source: 'exclude', reason: 'not_a_domain' });
    }
  }

  return { targets: [...targets.values()], skipped };
}

function normalizeCompetitorKeywordsJsonId(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 120) || 'brand_memory_competitor_keywords'
  );
}

function normalizeKeywordText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizeDisplayText(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function maxNullable(left: number | null, right: number | null): number | null {
  if (left == null) return right;
  if (right == null) return left;
  return Math.max(left, right);
}

function minNullable(left: number | null, right: number | null): number | null {
  if (left == null) return right;
  if (right == null) return left;
  return Math.min(left, right);
}

function buildFlatCompetitorKeywords(
  items: SeoRankedKeywordItem[],
): FlatCompetitorKeyword[] {
  const byKeyword = new Map<
    string,
    FlatCompetitorKeyword & { competitorDomainSet: Set<string> }
  >();

  for (const item of items) {
    const normalizedKeyword = normalizeKeywordText(item.text);
    if (!normalizedKeyword) {
      continue;
    }

    const existing = byKeyword.get(normalizedKeyword);
    const domain =
      item.competitorEvidence.domain ?? item.sourceDomain ?? item.competitorEvidence.rankingUrl;

    if (!existing) {
      const competitorDomainSet = new Set<string>();
      if (domain) {
        competitorDomainSet.add(domain);
      }

      byKeyword.set(normalizedKeyword, {
        keyword: normalizeDisplayText(item.text),
        source: 'ranked_keywords',
        searchVolume: item.metrics.searchVolume,
        keywordDifficulty: item.metrics.keywordDifficulty,
        intent: item.metrics.intent,
        bestRankAbsolute: item.competitorEvidence.rankAbsolute,
        estimatedTrafficMax: item.competitorEvidence.estimatedTraffic,
        evidenceCount: 1,
        competitorDomains: domain ? [domain] : [],
        competitorDomainSet,
      });
      continue;
    }

    existing.searchVolume = maxNullable(existing.searchVolume, item.metrics.searchVolume);
    existing.keywordDifficulty = maxNullable(
      existing.keywordDifficulty,
      item.metrics.keywordDifficulty,
    );
    existing.bestRankAbsolute = minNullable(
      existing.bestRankAbsolute,
      item.competitorEvidence.rankAbsolute,
    );
    existing.estimatedTrafficMax = maxNullable(
      existing.estimatedTrafficMax,
      item.competitorEvidence.estimatedTraffic,
    );
    existing.intent = existing.intent ?? item.metrics.intent;
    existing.evidenceCount += 1;

    if (domain) {
      existing.competitorDomainSet.add(domain);
      existing.competitorDomains = [...existing.competitorDomainSet].sort();
    }
  }

  return [...byKeyword.values()]
    .map(({ competitorDomainSet: _competitorDomainSet, ...keyword }) => keyword)
    .sort((left, right) => {
      const trafficDelta =
        (right.estimatedTrafficMax ?? 0) - (left.estimatedTrafficMax ?? 0);
      if (trafficDelta !== 0) {
        return trafficDelta;
      }

      return (right.searchVolume ?? 0) - (left.searchVolume ?? 0);
    });
}

interface ProjectWithBrandMemory {
  brandMemory: BrandMemory;
  id: string;
  name: string;
}

interface RefreshBrandMemoryCompetitorKeywordsParams {
  commandBus: CommandBus;
  country?: string | null;
  language?: string | null;
  limit?: number | null;
  project: ProjectWithBrandMemory;
  seoResearch: SeoResearchPort;
}

async function refreshBrandMemoryCompetitorKeywordsForProject({
  commandBus,
  country: countryInput,
  language: languageInput,
  limit: limitInput,
  project,
  seoResearch,
}: RefreshBrandMemoryCompetitorKeywordsParams) {
  const competitors = project.brandMemory.seoCompetitors;
  const competitorTargets = resolveSeoCompetitorTargets(competitors);
  if (competitorTargets.targets.length === 0) {
    throw new BadRequestException(
      'Add SEO competitor domains in Brand Memory before refreshing competitor ranked keywords',
    );
  }

  const country = normalizeNullableText(countryInput) ?? 'United States';
  const language = normalizeNullableText(languageInput) ?? 'English';
  const limit = normalizeRankedKeywordsLimit(limitInput);
  const targetResults = [];
  const items: SeoRankedKeywordItem[] = [];

  for (const target of competitorTargets.targets) {
    const result = await seoResearch.getRankedKeywords({
      runId: `brand_memory_${project.id}` as never,
      target: target.target,
      market: {
        country,
        language,
        locationName: country,
      },
      limit,
      historicalSerpMode: 'live',
      loadRankAbsolute: false,
      ignoreSynonyms: false,
      includeClickstreamData: false,
    });

    targetResults.push({
      raw: target.raw,
      source: target.source,
      target: result.target,
      totalCount: result.totalCount,
      itemsCount: result.itemsCount,
      metrics: result.metrics,
      items: result.items as unknown as SeoBriefJsonValue,
    });
    items.push(...result.items);
  }

  const allKeywordsFlat = buildFlatCompetitorKeywords(items);
  const competitorKeywordsJsonId = normalizeCompetitorKeywordsJsonId(
    `${project.name}_${country}_${language}_competitors`,
  );
  const refreshedAt = new Date();
  const nextRefreshAt = new Date(
    refreshedAt.getTime() +
      SEO_COMPETITOR_KEYWORD_REFRESH_INTERVAL_HOURS * 60 * 60 * 1000,
  );
  const seoCompetitorKeywordMap = {
    generatedAt: refreshedAt.toISOString(),
    nextRefreshAt: nextRefreshAt.toISOString(),
    refreshIntervalHours: SEO_COMPETITOR_KEYWORD_REFRESH_INTERVAL_HOURS,
    competitorKeywordsJsonId,
    market: {
      country,
      language,
      locationName: country,
    },
    targets: competitorTargets.targets.map((target) => target.target),
    targetCount: competitorTargets.targets.length,
    itemCount: items.length,
    deduplicatedKeywordCount: allKeywordsFlat.length,
    targetResults,
    items: items as unknown[],
    allKeywordsFlat: allKeywordsFlat as unknown[],
  };

  const updated = await commandBus.execute(
    new UpdateProjectBrandMemoryCommand(project.id as ProjectId, {
      seoCompetitorKeywordMap,
    }),
  );

  return {
    projectId: project.id,
    brandMemory: updated.brandMemory,
    competitorKeywordsJsonId,
    targets: seoCompetitorKeywordMap.targets,
    generatedAt: seoCompetitorKeywordMap.generatedAt,
    nextRefreshAt: seoCompetitorKeywordMap.nextRefreshAt,
    refreshIntervalHours: seoCompetitorKeywordMap.refreshIntervalHours,
    targetCount: seoCompetitorKeywordMap.targetCount,
    itemCount: seoCompetitorKeywordMap.itemCount,
    deduplicatedKeywordCount: seoCompetitorKeywordMap.deduplicatedKeywordCount,
    skipped: competitorTargets.skipped,
  };
}

@Injectable()
export class BrandMemorySeoCompetitorKeywordRefreshScheduler
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(
    BrandMemorySeoCompetitorKeywordRefreshScheduler.name,
  );
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    @Inject(CommandBus)
    private readonly commandBus: CommandBus,
    @Inject(QueryBus)
    private readonly queryBus: QueryBus,
    @Inject(SeoResearchPort)
    private readonly seoResearch: SeoResearchPort,
  ) {}

  onModuleInit(): void {
    this.timer = setInterval(() => {
      void this.refreshDueProjects();
    }, SEO_COMPETITOR_KEYWORD_REFRESH_CHECK_INTERVAL_MS);
    void this.refreshDueProjects();
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  refreshProject(
    project: ProjectWithBrandMemory,
    dto: { country?: string | null; language?: string | null; limit?: number | null },
  ) {
    return refreshBrandMemoryCompetitorKeywordsForProject({
      commandBus: this.commandBus,
      country: dto?.country,
      language: dto?.language,
      limit: dto?.limit,
      project,
      seoResearch: this.seoResearch,
    });
  }

  private async refreshDueProjects(): Promise<void> {
    try {
      const projectList = await this.queryBus.execute(new ListProjectsQuery());
      const now = Date.now();

      for (const projectListItem of projectList as Array<{ id: string }>) {
        const project = await this.queryBus.execute(
          new GetProjectQuery(projectListItem.id as ProjectId),
        );

        if (!project) {
          continue;
        }

        const keywordMap = project.brandMemory.seoCompetitorKeywordMap;
        if (!keywordMap?.nextRefreshAt || !Array.isArray(keywordMap.targets)) {
          continue;
        }

        const nextRefreshTime = new Date(keywordMap.nextRefreshAt).getTime();
        if (!Number.isFinite(nextRefreshTime) || nextRefreshTime > now) {
          continue;
        }

        try {
          await this.refreshProject(project, {
            country: keywordMap.market?.country,
            language: keywordMap.market?.language,
          });
          this.logger.log(
            `Refreshed SEO competitor ranked keywords for project ${project.id}`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to auto-refresh SEO competitor ranked keywords for project ${project.id}`,
            error instanceof Error ? error.stack : String(error),
          );
        }
      }
    } catch (error) {
      this.logger.error(
        'Failed to check SEO competitor ranked keyword refresh schedule',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}

@Controller('projects')
export class ProjectController {
  constructor(
    @Inject(CommandBus)
    private readonly commandBus: CommandBus,
    @Inject(QueryBus)
    private readonly queryBus: QueryBus,
    private readonly competitorKeywordRefresh: BrandMemorySeoCompetitorKeywordRefreshScheduler,
  ) {}

  @Post()
  async create(
    @Body(new ValibotPipe(CreateProjectSchema)) dto: CreateProjectDto,
  ): Promise<{ id: string }> {
    const id = await this.commandBus.execute(new CreateProjectCommand(dto.name));

    return { id };
  }

  @Get()
  async list() {
    return this.queryBus.execute(new ListProjectsQuery());
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const project = await this.queryBus.execute(new GetProjectQuery(id as ProjectId));

    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }

    return project;
  }

  @Delete(':id')
  async deleteProject(@Param('id') id: string): Promise<{ ok: true }> {
    try {
      await this.commandBus.execute(new DeleteProjectCommand(id as ProjectId));
      return { ok: true };
    } catch (error) {
      rethrowProjectManagementHttpError(error);
    }
  }

  @Get(':id/brand-memory')
  async getBrandMemory(@Param('id') id: string): Promise<{
    projectId: string;
    brandMemory: BrandMemory;
    updatedAt: Date;
  }> {
    const project = await this.queryBus.execute(new GetProjectQuery(id as ProjectId));

    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }

    return {
      projectId: project.id,
      brandMemory: project.brandMemory,
      updatedAt: project.updatedAt,
    };
  }

  @Put(':id/brand-memory')
  async updateBrandMemory(
    @Param('id') id: string,
    @Body(new ValibotPipe(UpdateProjectBrandMemorySchema)) dto: UpdateProjectBrandMemoryDto,
  ) {
    try {
      return await this.commandBus.execute(
        new UpdateProjectBrandMemoryCommand(
          id as ProjectId,
          normalizeBrandMemoryUpdate(dto),
        ),
      );
    } catch (error) {
      rethrowProjectManagementHttpError(error);
    }
  }

  @Post(':id/brand-memory/refresh-competitor-keywords')
  async refreshBrandMemoryCompetitorKeywords(
    @Param('id') id: string,
    @Body()
    dto: { country?: string | null; language?: string | null; limit?: number | null },
  ) {
    const project = await this.queryBus.execute(new GetProjectQuery(id as ProjectId));

    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }

    return this.competitorKeywordRefresh.refreshProject(project, dto);
  }

  @Get(':id/campaigns')
  async listCampaigns(@Param('id') id: string) {
    const campaigns = await this.queryBus.execute(
      new ListProjectCampaignsQuery(id as ProjectId),
    );

    if (!campaigns) {
      throw new NotFoundException(`Project ${id} not found`);
    }

    return campaigns;
  }

  @Get(':id/inbox')
  async getInbox(@Param('id') id: string) {
    const inbox = await this.queryBus.execute(
      new GetProjectApprovalInboxQuery(id as ProjectId),
    );

    if (!inbox) {
      throw new NotFoundException(`Project ${id} not found`);
    }

    return inbox;
  }

  @Post(':id/inbox/:approvalItemId/acknowledge')
  async acknowledgeInboxItem(
    @Param('id') id: string,
    @Param('approvalItemId') approvalItemId: string,
  ) {
    try {
      return await this.commandBus.execute(
        new AcknowledgeApprovalItemCommand(
          id as ProjectId,
          approvalItemId as ApprovalItemId,
        ),
      );
    } catch (error) {
      rethrowProjectManagementHttpError(error);
    }
  }

  @Post(':id/campaigns')
  async createCampaign(
    @Param('id') id: string,
    @Body(new ValibotPipe(CreateCampaignSchema)) dto: CreateCampaignDto,
  ) {
    try {
      return await this.commandBus.execute(
        new CreateCampaignCommand(
          id as ProjectId,
          dto.presetId,
          dto.name,
          parseDateInput(dto.startDate, 'startDate'),
          dto.sourceLanguage ?? undefined,
          dto.extraInstructions ?? null,
          normalizePlannedPublicationOverrides(dto.plannedPublicationOverrides),
          dto.publishingTarget ?? 'test',
        ),
      );
    } catch (error) {
      rethrowProjectManagementHttpError(error);
    }
  }

  @Get(':id/markers')
  async listMarkers(@Param('id') id: string) {
    return this.queryBus.execute(new ListProjectMarkersQuery(id as ProjectId));
  }

  @Post(':id/markers')
  async createMarker(
    @Param('id') id: string,
    @Body(new ValibotPipe(CreateProjectMarkerSchema)) dto: CreateProjectMarkerDto,
  ): Promise<{ id: string }> {
    const markerId = await this.commandBus.execute(
      new CreateProjectMarkerCommand(id as ProjectId, dto.title, dto.notes ?? null),
    );

    return { id: markerId };
  }

  @Delete(':id/markers/:markerId')
  async deleteMarker(
    @Param('id') id: string,
    @Param('markerId') markerId: string,
  ): Promise<{ ok: true }> {
    await this.commandBus.execute(
      new DeleteProjectMarkerCommand(id as ProjectId, markerId as ProjectMarkerId),
    );

    return { ok: true };
  }

  @Get(':id/marker-placements')
  async listMarkerPlacements(
    @Param('id') id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.queryBus.execute(
      new GetProjectMarkerPlacementsQuery(
        id as ProjectId,
        from ? new Date(from) : null,
        to ? new Date(to) : null,
      ),
    );
  }

  @Post(':id/marker-placements')
  async createMarkerPlacement(
    @Param('id') id: string,
    @Body(new ValibotPipe(CreateProjectMarkerPlacementSchema)) dto: CreateProjectMarkerPlacementDto,
  ): Promise<{ id: string }> {
    return this.commandBus.execute(
      new CreateProjectMarkerPlacementCommand(
        id as ProjectId,
        dto.markerId as ProjectMarkerId,
        dto.channelId,
        dto.targetLanguage,
        new Date(dto.publishAt),
      ),
    );
  }
}
