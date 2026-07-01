import { Inject, Injectable } from '@nestjs/common';
import { resolveSeoBriefKeywordExpansionPrompt } from '../../config/seo-brief-keyword-expansion-prompt.js';
import { SEO_BRIEF_OPERATIONAL_LIMITS } from '../../config/seo-brief-operational-limits.js';
import { SeoBriefArtifact } from '../../domain/seo-brief-artifact.entity.js';
import { SeoBriefArtifactRepository } from '../../domain/seo-brief-artifact.repository.js';
import { SeoBriefDocument } from '../../domain/seo-brief-document.entity.js';
import { SeoBriefDocumentRepository } from '../../domain/seo-brief-document.repository.js';
import type { SeoBriefRun, SeoBriefRunStatus } from '../../domain/seo-brief-run.aggregate.js';
import { SeoBriefRunRepository } from '../../domain/seo-brief-run.repository.js';
import {
  SEO_BRIEF_RUN_STAGE_ORDER,
  type SeoBriefRerunnableStage,
  type SeoBriefRunStage,
  SeoBriefRunStep,
} from '../../domain/seo-brief-run-step.entity.js';
import { SeoBriefRunStepRepository } from '../../domain/seo-brief-run-step.repository.js';
import type { SeoBriefJsonObject, SeoBriefJsonValue } from '../../domain/seo-briefing.types.js';
import type {
  ExtractUserPainScenariosResult,
  SeoBriefAiKeywordIntent,
  SeoBriefAiModelMode,
  SeoBriefAiProductFit,
} from '../../ports/seo-brief-ai.port.js';
import { SeoBriefAiPort } from '../../ports/seo-brief-ai.port.js';
import { SeoResearchPort } from '../../ports/seo-research.port.js';
import { CompetitionScoreService } from '../../services/competition-score.service.js';
import { DemandScoreService } from '../../services/demand-score.service.js';
import { FinalClusterScoreService } from '../../services/final-cluster-score.service.js';
import { ProductScoreService } from '../../services/product-score.service.js';
import { SeoBriefScoreLoggerService } from '../../services/seo-brief-score-logger.service.js';
import { SeoScoreService } from '../../services/seo-score.service.js';
import { readPromptInstructionOverridesFromArtifacts } from '../seo-brief-prompt-instruction-overrides.js';
import { readRequestTimeoutMsFromArtifacts } from '../seo-brief-request-timeout.js';

const RELATED_KEYWORD_LIMIT = SEO_BRIEF_OPERATIONAL_LIMITS.relatedKeywordLimit;
const RELATED_KEYWORD_SEED_LIMIT = SEO_BRIEF_OPERATIONAL_LIMITS.relatedKeywordSeedLimit;
const SERP_RESEARCH_KEYWORD_LIMIT = SEO_BRIEF_OPERATIONAL_LIMITS.serpResearchKeywordLimit;
const SERP_RESULT_DEPTH = SEO_BRIEF_OPERATIONAL_LIMITS.serpResultDepth;
const DOMAIN_METRICS_LIMIT = SEO_BRIEF_OPERATIONAL_LIMITS.domainMetricsLimit;
const ONPAGE_TARGET_LIMIT = SEO_BRIEF_OPERATIONAL_LIMITS.onpageTargetLimit;
const MAX_KEYWORD_UNIVERSE_ITEMS = SEO_BRIEF_OPERATIONAL_LIMITS.maxKeywordUniverseItems;
const MAX_CLUSTERS_TO_SCORE = SEO_BRIEF_OPERATIONAL_LIMITS.maxClustersToScore;
const MIN_FINAL_CLUSTER_SCORE = SEO_BRIEF_OPERATIONAL_LIMITS.minFinalClusterScore;
const MIN_PRODUCT_SCORE = SEO_BRIEF_OPERATIONAL_LIMITS.minProductScore;
const DATAFORSEO_KEYWORD_MAX_WORDS = 10;
const DATAFORSEO_KEYWORD_MAX_CHARS = 80;

export interface ProcessSeoBriefRunResult {
  runId: string;
  status: SeoBriefRunStatus;
  hypothesisCount: number;
  keywordCount: number;
  relatedSeedCount: number;
  relatedKeywordCount: number;
  serpKeywordCount: number;
  domainCount: number;
  onpageTargetCount: number;
  acceptedKeywordCount: number;
  clusterCount: number;
  selectedClusterLabel: string | null;
  briefDocumentId: string | null;
  briefTitle: string | null;
}

export interface ProcessSeoBriefRunOptions {
  startStage?: SeoBriefRerunnableStage;
  stopAfterStage?: SeoBriefRerunnableStage;
  /**
   * When true, a cluster_selection outcome of `needs_manual_review` caused by a
   * low viability/product score no longer halts the run: the top-ranked cluster
   * is auto-accepted and the pipeline continues to brief generation. A run with
   * no selectable cluster at all still stops for manual review.
   */
  skipManualReview?: boolean;
}

type KeywordExpansionResult = Awaited<ReturnType<SeoBriefAiPort['expandKeywords']>>;
type ClusterSelectionExplanationResult = Awaited<
  ReturnType<SeoBriefAiPort['explainClusterSelection']>
>;

interface ResearchKeywordItem {
  keyword: string;
  searchVolume: number | null;
  competition: number | null;
  cpc: number | null;
  lowTopBid: number | null;
  highTopBid: number | null;
}

interface RelatedKeywordGroup {
  seedKeyword: string;
  suggestions: Array<{
    keyword: string;
    searchVolume: number | null;
    competition: number | null;
    cpc: number | null;
    relevance: number | null;
  }>;
}

interface SerpResearchEntry {
  keyword: string;
  totalCount: number | null;
  checkUrl: string | null;
  items: Array<{
    type: string;
    rankGroup: number | null;
    rankAbsolute: number | null;
    title: string | null;
    url: string | null;
    domain: string | null;
    description: string | null;
  }>;
}

interface DomainMetricsEntry {
  target: string;
  organicKeywords: number | null;
  organicTraffic: number | null;
  organicTrafficCost: number | null;
  paidKeywords: number | null;
  paidTraffic: number | null;
  paidTrafficCost: number | null;
}

interface OnPageResearchEntry {
  target: string;
  providerTaskId: string;
  crawlProgress: string | null;
  onpageScore: number | null;
  pageCount: number | null;
  brokenPages: number | null;
  duplicateTitlePages: number | null;
  duplicateDescriptionPages: number | null;
}

interface SkippedOnPageTarget {
  target: string;
  reason: string;
}

interface KeywordUniverseEntry {
  keyword: string;
  searchVolume: number | null;
  competition: number | null;
  cpc: number | null;
}

interface TriageAcceptedEntry extends KeywordUniverseEntry {
  intent: SeoBriefAiKeywordIntent;
  stage: string;
  reason: string;
}

interface ClusterEntry {
  label: string;
  primaryKeyword: string;
  representativeKeyword: string;
  representativeKeywordReason: string;
  intent: SeoBriefAiKeywordIntent;
  rationale: string;
  keywords: KeywordUniverseEntry[];
}

interface ClusterPenalty {
  code: string;
  points: number;
  reason: string;
}

interface ClusterScoreEntry {
  label: string;
  intent: SeoBriefAiKeywordIntent;
  primaryKeyword: string;
  representativeKeyword: string;
  keywords: KeywordUniverseEntry[];
  productBridge: {
    fit: SeoBriefAiProductFit;
    summary: string;
    positioningAngle: string;
    cta: string;
    talkingPoints: string[];
    risks: string[];
  };
  demandScore: number;
  competitionScore: number;
  seoScore: number;
  productScore: number;
  finalScore: number;
  penalties: ClusterPenalty[];
  representativeSearchVolume: number | null;
  averageDomainTraffic: number | null;
  averageOnpageScore: number | null;
  averageKeywordCompetition: number | null;
  decisionLabel: 'viable' | 'postponed_low_score' | 'postponed_low_product_fit';
}

interface ClusterSelectionRejectedEntry {
  label: string;
  representativeKeyword: string;
  finalScore: number;
  decisionLabel: ClusterScoreEntry['decisionLabel'];
  reason: string;
}

interface ClusterSelectionResult {
  selectedCluster: ClusterScoreEntry | null;
  rejectedClusters: ClusterSelectionRejectedEntry[];
  explanation: ClusterSelectionExplanationResult | null;
  outcome: 'done' | 'needs_manual_review';
  reason: string | null;
}

@Injectable()
export class ProcessSeoBriefRunExecutor {
  private readonly demandScoreService = new DemandScoreService();
  private readonly competitionScoreService = new CompetitionScoreService();
  private readonly seoScoreService = new SeoScoreService();
  private readonly productScoreService = new ProductScoreService();
  private readonly finalClusterScoreService = new FinalClusterScoreService();

  constructor(
    @Inject(SeoBriefRunRepository)
    private readonly runRepository: SeoBriefRunRepository,
    @Inject(SeoBriefRunStepRepository)
    private readonly stepRepository: SeoBriefRunStepRepository,
    @Inject(SeoBriefArtifactRepository)
    private readonly artifactRepository: SeoBriefArtifactRepository,
    @Inject(SeoBriefDocumentRepository)
    private readonly documentRepository: SeoBriefDocumentRepository,
    @Inject(SeoBriefAiPort)
    private readonly ai: SeoBriefAiPort,
    @Inject(SeoResearchPort)
    private readonly seoResearch: SeoResearchPort,
    @Inject(SeoBriefScoreLoggerService)
    private readonly scoreLogger: SeoBriefScoreLoggerService,
  ) {}

  async execute(
    runId: string,
    options: ProcessSeoBriefRunOptions = {},
  ): Promise<ProcessSeoBriefRunResult> {
    const run = await this.runRepository.findById(runId as never);
    if (!run) {
      throw new Error(`SEO brief run ${runId} not found`);
    }

    const priorArtifacts = await this.artifactRepository.findByRunId(run.id);
    const keywordExpansionPrompt = readKeywordExpansionPrompt(priorArtifacts);
    const aiModelMode = readAiModelMode(priorArtifacts);
    const aiModel = readAiModel(priorArtifacts);
    const campaignContext = readCampaignContext(priorArtifacts);
    const seoProductContext = readSeoProductContext(priorArtifacts);
    const hypothesesCount = readHypothesesCount(priorArtifacts);
    const requestTimeoutMs = readRequestTimeoutMsFromArtifacts(priorArtifacts);
    const promptInstructionOverrides = readPromptInstructionOverridesFromArtifacts(priorArtifacts);

    run.start();
    await this.runRepository.save(run);

    try {
      const keywordExpansion = shouldExecuteStage(options.startStage, 'keyword_expansion')
        ? await this.executeStage(run.id, 'keyword_expansion', async (step) => {
            const existingUserPainScenarios = restoreUserPainScenariosOrNull(priorArtifacts);
            const userPainScenarios =
              existingUserPainScenarios ??
              (await this.ai.extractUserPainScenarios({
                runId: run.id,
                stepId: step.id,
                model: aiModel,
                modelMode: aiModelMode,
                timeoutMs: requestTimeoutMs,
                promptInstructionOverrides,
                topicSeed: run.topicSeed,
                market: {
                  country: run.country,
                  language: run.language,
                  locationName: run.country,
                },
                audience: run.audience,
                productName: run.productName,
                productDescription: run.productDescription,
                keyMessage: run.keyMessage,
                seoProductContext,
                brandMemorySnapshot: run.brandMemorySnapshot,
              }));
            if (!existingUserPainScenarios) {
              await this.saveArtifact({
                runId: run.id,
                stage: 'keyword_expansion',
                artifactType: 'user_pain_scenarios',
                payload: {
                  artifactVersion: 'user_pain_scenarios_v1',
                  generatedFrom: seoProductContext ? 'seo_product_context' : 'legacy_run_fields',
                  topicSeed: run.topicSeed,
                  seoProductContext: seoProductContext as SeoBriefJsonValue | null,
                  topicHintInterpretation: userPainScenarios.topicHintInterpretation,
                  userPains: userPainScenarios.userPains as unknown as SeoBriefJsonValue,
                  userScenarios: userPainScenarios.userScenarios as unknown as SeoBriefJsonValue,
                  riskNotes: userPainScenarios.riskNotes,
                },
                attempt: step.attemptNumber,
              });
            }
            const result = await this.ai.expandKeywords({
              runId: run.id,
              stepId: step.id,
              model: aiModel,
              modelMode: aiModelMode,
              timeoutMs: requestTimeoutMs,
              promptInstructionOverrides,
              topicSeed: run.topicSeed,
              market: {
                country: run.country,
                language: run.language,
                locationName: run.country,
              },
              audience: run.audience,
              productName: run.productName,
              productDescription: run.productDescription,
              keyMessage: run.keyMessage,
              audienceBefore: run.audienceBefore,
              audienceAfter: run.audienceAfter,
              campaignContext,
              brandMemorySnapshot: run.brandMemorySnapshot,
              seoProductContext,
              userPainScenarios,
              keywordExpansionPrompt,
              limit: hypothesesCount,
            });
            const limitedResult = limitKeywordExpansionResult(result, hypothesesCount);

            await this.saveArtifact({
              runId: run.id,
              stage: 'keyword_expansion',
              artifactType: 'keyword_hypotheses',
              payload: {
                artifactVersion: 'search_hypotheses_v2',
                generatedFrom: seoProductContext
                  ? 'manual_user_pains_and_seo_product_context'
                  : 'manual_user_pains_and_legacy_run_fields',
                topicSeed: run.topicSeed,
                hypothesesCount,
                seoProductContext: seoProductContext as SeoBriefJsonValue | null,
                userPainScenarios: userPainScenarios as unknown as SeoBriefJsonValue,
                searchHypotheses: limitedResult.hypotheses as unknown as SeoBriefJsonValue,
                groups: (limitedResult.groups ?? []) as unknown as SeoBriefJsonValue,
                hypotheses: limitedResult.hypotheses as unknown as SeoBriefJsonValue,
              },
              attempt: step.attemptNumber,
            });

            return limitedResult;
          })
        : restoreKeywordExpansion(priorArtifacts);

      if (shouldStopAfter(options.stopAfterStage, 'keyword_expansion')) {
        return this.finishCheckpoint(run, 'keyword_expansion', {
          hypothesisCount: keywordExpansion.hypotheses.length,
        });
      }

      const researchKeywords = filterDataForSeoKeywords(
        uniqueKeywords([
          run.topicSeed,
          ...keywordExpansion.hypotheses.map((item) => item.keyword),
        ]),
      );

      const requestedSearchVolumeKeywords = researchKeywords;

      const keywordResearch = shouldExecuteStage(options.startStage, 'keyword_research')
        ? await this.executeStage(run.id, 'keyword_research', async (step) => {
            const volumeItems =
              requestedSearchVolumeKeywords.length > 0
                ? (
                    await this.seoResearch.getSearchVolume({
                      runId: run.id,
                      stepId: step.id,
                      timeoutMs: requestTimeoutMs,
                      keywords: requestedSearchVolumeKeywords,
                      market: {
                        country: run.country,
                        language: run.language,
                        locationName: run.country,
                      },
                    })
                  ).items
                : [];

            const enrichedKeywords = uniqueKeywordItems([
              createSyntheticKeywordItem(run.topicSeed),
              ...volumeItems.map((item) => ({
                keyword: item.keyword,
                searchVolume: item.searchVolume,
                competition: item.competition,
                cpc: item.cpc,
                lowTopBid: item.lowTopBid,
                highTopBid: item.highTopBid,
              })),
            ]);

            await this.saveArtifact({
              runId: run.id,
              stage: 'keyword_research',
              artifactType: 'keyword_research_snapshot',
              payload: {
                topicSeed: run.topicSeed,
                requestedKeywords: requestedSearchVolumeKeywords,
                skippedKeywords: uniqueKeywords([
                  run.topicSeed,
                  ...keywordExpansion.hypotheses.map((item) => item.keyword),
                ]).filter((keyword) => !requestedSearchVolumeKeywords.includes(keyword)),
                enrichedKeywords: enrichedKeywords as unknown as SeoBriefJsonValue,
              },
              attempt: step.attemptNumber,
            });

            return { enrichedKeywords };
          })
        : restoreKeywordResearch(priorArtifacts);

      if (shouldStopAfter(options.stopAfterStage, 'keyword_research')) {
        return this.finishCheckpoint(run, 'keyword_research', {
          hypothesisCount: keywordExpansion.hypotheses.length,
          keywordCount: keywordResearch.enrichedKeywords.length,
        });
      }

      const relatedKeywordSeeds = deriveRelatedKeywordSeeds(
        run.topicSeed,
        keywordResearch.enrichedKeywords,
      );

      const relatedKeywordResearch = shouldExecuteStage(
        options.startStage,
        'related_keyword_research',
      )
        ? await this.executeStage(run.id, 'related_keyword_research', async (step) => {
            const groups: RelatedKeywordGroup[] = [];

            for (const seedKeyword of relatedKeywordSeeds) {
              const suggestions = await this.seoResearch.getKeywordSuggestions({
                runId: run.id,
                stepId: step.id,
                timeoutMs: requestTimeoutMs,
                keyword: seedKeyword,
                includeSeedKeyword: false,
                limit: RELATED_KEYWORD_LIMIT,
                market: {
                  country: run.country,
                  language: run.language,
                  locationName: run.country,
                },
              });

              groups.push({
                seedKeyword,
                suggestions: suggestions.items.map((item) => ({
                  keyword: item.keyword,
                  searchVolume: item.searchVolume,
                  competition: item.competition,
                  cpc: item.cpc,
                  relevance: item.relevance,
                })),
              });
            }

            const uniqueSuggestions = uniqueKeywordSuggestionItems(groups);
            await this.saveArtifact({
              runId: run.id,
              stage: 'related_keyword_research',
              artifactType: 'related_keyword_research_snapshot',
              payload: {
                topicSeed: run.topicSeed,
                seedKeywords: relatedKeywordSeeds,
                groups: groups as unknown as SeoBriefJsonValue,
                uniqueSuggestions: uniqueSuggestions as unknown as SeoBriefJsonValue,
              },
              attempt: step.attemptNumber,
            });
            await this.saveArtifact({
              runId: run.id,
              stage: 'related_keyword_research',
              artifactType: 'research_v1_summary',
              payload: {
                hypothesisCount: keywordExpansion.hypotheses.length,
                keywordCount: keywordResearch.enrichedKeywords.length,
                relatedSeedCount: relatedKeywordSeeds.length,
                relatedKeywordCount: uniqueSuggestions.length,
              },
              attempt: step.attemptNumber,
            });

            return { uniqueSuggestions };
          })
        : restoreRelatedKeywordResearch(priorArtifacts);

      if (shouldStopAfter(options.stopAfterStage, 'related_keyword_research')) {
        return this.finishCheckpoint(run, 'related_keyword_research', {
          hypothesisCount: keywordExpansion.hypotheses.length,
          keywordCount: keywordResearch.enrichedKeywords.length,
          relatedSeedCount: relatedKeywordSeeds.length,
          relatedKeywordCount: relatedKeywordResearch.uniqueSuggestions.length,
        });
      }

      const serpKeywords = deriveSerpResearchKeywords(
        run.topicSeed,
        keywordResearch.enrichedKeywords,
        relatedKeywordResearch.uniqueSuggestions,
      );

      const serpResearch = shouldExecuteStage(options.startStage, 'serp_research')
        ? await this.executeStage(run.id, 'serp_research', async (step) => {
            const serpResults: SerpResearchEntry[] = [];

            for (const keyword of serpKeywords) {
              const serp = await this.seoResearch.getOrganicSerp({
                runId: run.id,
                stepId: step.id,
                timeoutMs: requestTimeoutMs,
                keyword,
                depth: SERP_RESULT_DEPTH,
                market: {
                  country: run.country,
                  language: run.language,
                  locationName: run.country,
                },
              });

              serpResults.push({
                keyword,
                totalCount: serp.totalCount,
                checkUrl: serp.checkUrl,
                items: serp.items.map((item) => ({
                  type: item.type,
                  rankGroup: item.rankGroup,
                  rankAbsolute: item.rankAbsolute,
                  title: item.title,
                  url: item.url,
                  domain: item.domain,
                  description: item.description,
                })),
              });
            }

            const domains = deriveUniqueDomains(serpResults);
            const urls = deriveUniqueUrls(serpResults);

            await this.saveArtifact({
              runId: run.id,
              stage: 'serp_research',
              artifactType: 'serp_research_snapshot',
              payload: {
                representativeKeywords: serpKeywords,
                serpResults: serpResults as unknown as SeoBriefJsonValue,
                domains,
                urls,
              },
              attempt: step.attemptNumber,
            });

            return {
              serpResults,
              domains,
              urls,
            };
          })
        : restoreSerpResearch(priorArtifacts);

      if (shouldStopAfter(options.stopAfterStage, 'serp_research')) {
        return this.finishCheckpoint(run, 'serp_research', {
          hypothesisCount: keywordExpansion.hypotheses.length,
          keywordCount: keywordResearch.enrichedKeywords.length,
          relatedSeedCount: relatedKeywordSeeds.length,
          relatedKeywordCount: relatedKeywordResearch.uniqueSuggestions.length,
          serpKeywordCount: serpKeywords.length,
        });
      }

      const domainTargets = serpResearch.domains.slice(0, DOMAIN_METRICS_LIMIT);
      const domainMetricsResearch = shouldExecuteStage(
        options.startStage,
        'domain_metrics_research',
      )
        ? await this.executeStage(run.id, 'domain_metrics_research', async (step) => {
            const metrics: DomainMetricsEntry[] = [];

            for (const target of domainTargets) {
              const result = await this.seoResearch.getDomainMetrics({
                runId: run.id,
                stepId: step.id,
                timeoutMs: requestTimeoutMs,
                target,
                market: {
                  country: run.country,
                  language: run.language,
                  locationName: run.country,
                },
              });

              metrics.push({
                target,
                organicKeywords: result.organicKeywords,
                organicTraffic: result.organicTraffic,
                organicTrafficCost: result.organicTrafficCost,
                paidKeywords: result.paidKeywords,
                paidTraffic: result.paidTraffic,
                paidTrafficCost: result.paidTrafficCost,
              });
            }

            await this.saveArtifact({
              runId: run.id,
              stage: 'domain_metrics_research',
              artifactType: 'domain_metrics_snapshot',
              payload: {
                targets: domainTargets,
                metrics: metrics as unknown as SeoBriefJsonValue,
              },
              attempt: step.attemptNumber,
            });

            return { metrics };
          })
        : restoreDomainMetricsResearch(priorArtifacts);

      if (shouldStopAfter(options.stopAfterStage, 'domain_metrics_research')) {
        return this.finishCheckpoint(run, 'domain_metrics_research', {
          hypothesisCount: keywordExpansion.hypotheses.length,
          keywordCount: keywordResearch.enrichedKeywords.length,
          relatedSeedCount: relatedKeywordSeeds.length,
          relatedKeywordCount: relatedKeywordResearch.uniqueSuggestions.length,
          serpKeywordCount: serpKeywords.length,
          domainCount: domainMetricsResearch.metrics.length,
        });
      }

      const onpageTargets = serpResearch.urls.slice(0, ONPAGE_TARGET_LIMIT);
      const onpageResearch = shouldExecuteStage(options.startStage, 'onpage_research')
        ? await this.executeStage(run.id, 'onpage_research', async (step) => {
            const pages: OnPageResearchEntry[] = [];
            const skippedTargets: SkippedOnPageTarget[] = [];

            for (const target of onpageTargets) {
              try {
                const result = await this.seoResearch.getOnPageParse({
                  runId: run.id,
                  stepId: step.id,
                  timeoutMs: requestTimeoutMs,
                  target,
                  maxCrawlPages: 1,
                  enableJavascript: true,
                });

                pages.push({
                  target,
                  providerTaskId: result.providerTaskId,
                  crawlProgress: result.crawlProgress,
                  onpageScore: result.onpageScore,
                  pageCount: result.pageCount,
                  brokenPages: result.brokenPages,
                  duplicateTitlePages: result.duplicateTitlePages,
                  duplicateDescriptionPages: result.duplicateDescriptionPages,
                });
              } catch (error) {
                skippedTargets.push({
                  target,
                  reason: describeUnknownError(error),
                });
              }
            }

            await this.saveArtifact({
              runId: run.id,
              stage: 'onpage_research',
              artifactType: 'onpage_research_snapshot',
              payload: {
                targets: onpageTargets,
                pages: pages as unknown as SeoBriefJsonValue,
                skippedTargets: skippedTargets as unknown as SeoBriefJsonValue,
              },
              attempt: step.attemptNumber,
            });
            await this.saveArtifact({
              runId: run.id,
              stage: 'onpage_research',
              artifactType: 'research_v2_summary',
              payload: {
                hypothesisCount: keywordExpansion.hypotheses.length,
                keywordCount: keywordResearch.enrichedKeywords.length,
                relatedSeedCount: relatedKeywordSeeds.length,
                relatedKeywordCount: relatedKeywordResearch.uniqueSuggestions.length,
                serpKeywordCount: serpKeywords.length,
                serpResultCount: serpResearch.serpResults.reduce(
                  (accumulator, item) => accumulator + item.items.length,
                  0,
                ),
                domainCount: domainMetricsResearch.metrics.length,
                onpageTargetCount: pages.length,
                skippedOnpageTargetCount: skippedTargets.length,
              },
              attempt: step.attemptNumber,
            });

            return { pages };
          })
        : restoreOnpageResearch(priorArtifacts);

      if (shouldStopAfter(options.stopAfterStage, 'onpage_research')) {
        return this.finishCheckpoint(run, 'onpage_research', {
          hypothesisCount: keywordExpansion.hypotheses.length,
          keywordCount: keywordResearch.enrichedKeywords.length,
          relatedSeedCount: relatedKeywordSeeds.length,
          relatedKeywordCount: relatedKeywordResearch.uniqueSuggestions.length,
          serpKeywordCount: serpKeywords.length,
          domainCount: domainMetricsResearch.metrics.length,
          onpageTargetCount: onpageResearch.pages.length,
        });
      }

      const keywordUniverse = limitKeywordUniverse(
        buildKeywordUniverse(
          keywordResearch.enrichedKeywords,
          relatedKeywordResearch.uniqueSuggestions,
        ),
        MAX_KEYWORD_UNIVERSE_ITEMS,
      );

      const triage = {
        accepted: buildClusterInputCandidates(keywordUniverse, run.topicSeed),
        rejected: [],
      };

      if (triage.accepted.length === 0) {
        run.reject('No viable keywords remained after SERP expansion');
        await this.runRepository.save(run);

        return {
          runId: run.id,
          status: run.status,
          hypothesisCount: keywordExpansion.hypotheses.length,
          keywordCount: keywordResearch.enrichedKeywords.length,
          relatedSeedCount: relatedKeywordSeeds.length,
          relatedKeywordCount: relatedKeywordResearch.uniqueSuggestions.length,
          serpKeywordCount: serpKeywords.length,
          domainCount: domainMetricsResearch.metrics.length,
          onpageTargetCount: onpageResearch.pages.length,
          acceptedKeywordCount: 0,
          clusterCount: 0,
          selectedClusterLabel: null,
          briefDocumentId: null,
          briefTitle: null,
        };
      }

      if (shouldStopAfter(options.stopAfterStage, 'keyword_triage')) {
        return this.finishCheckpoint(run, 'keyword_triage', {
          hypothesisCount: keywordExpansion.hypotheses.length,
          keywordCount: keywordResearch.enrichedKeywords.length,
          relatedSeedCount: relatedKeywordSeeds.length,
          relatedKeywordCount: relatedKeywordResearch.uniqueSuggestions.length,
          serpKeywordCount: serpKeywords.length,
          domainCount: domainMetricsResearch.metrics.length,
          onpageTargetCount: onpageResearch.pages.length,
          acceptedKeywordCount: triage.accepted.length,
        });
      }

      const clustering = shouldExecuteStage(options.startStage, 'clustering')
        ? await this.executeStage(run.id, 'clustering', async (step) => {
            const clusteringResult = await this.ai.clusterKeywords({
              runId: run.id,
              stepId: step.id,
              model: aiModel,
              modelMode: aiModelMode,
              timeoutMs: requestTimeoutMs,
              promptInstructionOverrides,
              topicSeed: run.topicSeed,
              keywords: triage.accepted.map((item) => item.keyword),
            });

            const clusters = clusteringResult.clusters
              .map((cluster) =>
                buildClusterEntry(cluster, triage.accepted, keywordUniverse, run.topicSeed),
              )
              .filter((cluster): cluster is ClusterEntry => cluster !== null);

            await this.saveArtifact({
              runId: run.id,
              stage: 'clustering',
              artifactType: 'cluster_snapshot',
              payload: {
                clusters: clusters as unknown as SeoBriefJsonValue,
              },
              attempt: step.attemptNumber,
            });

            return { clusters };
          })
        : restoreClustering(priorArtifacts);

      if (clustering.clusters.length === 0) {
        run.markNeedsManualReview('No semantic clusters were produced');
        await this.runRepository.save(run);

        return {
          runId: run.id,
          status: run.status,
          hypothesisCount: keywordExpansion.hypotheses.length,
          keywordCount: keywordResearch.enrichedKeywords.length,
          relatedSeedCount: relatedKeywordSeeds.length,
          relatedKeywordCount: relatedKeywordResearch.uniqueSuggestions.length,
          serpKeywordCount: serpKeywords.length,
          domainCount: domainMetricsResearch.metrics.length,
          onpageTargetCount: onpageResearch.pages.length,
          acceptedKeywordCount: triage.accepted.length,
          clusterCount: 0,
          selectedClusterLabel: null,
          briefDocumentId: null,
          briefTitle: null,
        };
      }

      if (shouldStopAfter(options.stopAfterStage, 'clustering')) {
        return this.finishCheckpoint(run, 'clustering', {
          hypothesisCount: keywordExpansion.hypotheses.length,
          keywordCount: keywordResearch.enrichedKeywords.length,
          relatedSeedCount: relatedKeywordSeeds.length,
          relatedKeywordCount: relatedKeywordResearch.uniqueSuggestions.length,
          serpKeywordCount: serpKeywords.length,
          domainCount: domainMetricsResearch.metrics.length,
          onpageTargetCount: onpageResearch.pages.length,
          acceptedKeywordCount: triage.accepted.length,
          clusterCount: clustering.clusters.length,
        });
      }

      const clusterScoring = shouldExecuteStage(options.startStage, 'cluster_scoring')
        ? await this.executeStage(run.id, 'cluster_scoring', async (step) => {
            const maxSearchVolume = Math.max(
              ...triage.accepted.map((item) => item.searchVolume ?? 0),
              1,
            );
            const maxDomainTraffic = Math.max(
              ...domainMetricsResearch.metrics.map((item) => item.organicTraffic ?? 0),
              1,
            );

            const scoredClusters: ClusterScoreEntry[] = [];
            const clustersToScore = rankClustersForScoring(
              clustering.clusters,
              keywordUniverse,
            ).slice(0, MAX_CLUSTERS_TO_SCORE);

            for (const cluster of clustersToScore) {
              const productBridge = await this.ai.buildProductBridge({
                runId: run.id,
                stepId: step.id,
                model: aiModel,
                modelMode: aiModelMode,
                timeoutMs: requestTimeoutMs,
                clusterLabel: cluster.label,
                primaryKeyword: cluster.representativeKeyword,
                intent: cluster.intent,
                audience: run.audience,
                productName: run.productName,
                productDescription: run.productDescription,
                brandMemorySnapshot: run.brandMemorySnapshot,
              });

              const representativeKeywordMetrics =
                findKeywordUniverseEntry(keywordUniverse, cluster.representativeKeyword) ??
                createSyntheticKeywordMetrics(cluster.representativeKeyword);
              const representativeSerp =
                findSerpEntry(serpResearch.serpResults, cluster.representativeKeyword) ??
                findSerpEntry(serpResearch.serpResults, cluster.primaryKeyword);
              const averageDomainTraffic = deriveAverageDomainTraffic(
                representativeSerp,
                domainMetricsResearch.metrics,
              );
              const averageOnpageScore = deriveAverageOnpageScore(
                representativeSerp,
                onpageResearch.pages,
              );
              const averageKeywordCompetition = averageNumbers(
                cluster.keywords.map((item) => item.competition),
              );

              const demandScore = this.demandScoreService.calculate({
                representativeSearchVolume: representativeKeywordMetrics.searchVolume,
                maxSearchVolume,
                clusterKeywordCount: cluster.keywords.length,
              });
              await this.scoreLogger.record({
                runId: run.id,
                stepId: step.id,
                formulaName: 'demand_score',
                inputPayload: {
                  clusterLabel: cluster.label,
                  representativeKeyword: cluster.representativeKeyword,
                  representativeSearchVolume: representativeKeywordMetrics.searchVolume,
                  maxSearchVolume,
                  clusterKeywordCount: cluster.keywords.length,
                },
                resultPayload: demandScore as unknown as SeoBriefJsonValue,
              });

              const competitionScore = this.competitionScoreService.calculate({
                keywordCompetition: averageKeywordCompetition,
                averageDomainTraffic,
                maxDomainTraffic,
                averageOnpageScore,
              });
              await this.scoreLogger.record({
                runId: run.id,
                stepId: step.id,
                formulaName: 'competition_score',
                inputPayload: {
                  clusterLabel: cluster.label,
                  keywordCompetition: averageKeywordCompetition,
                  averageDomainTraffic,
                  maxDomainTraffic,
                  averageOnpageScore,
                },
                resultPayload: competitionScore as unknown as SeoBriefJsonValue,
              });

              const seoScore = this.seoScoreService.calculate({
                demandScore: demandScore.value,
                competitionScore: competitionScore.value,
              });
              await this.scoreLogger.record({
                runId: run.id,
                stepId: step.id,
                formulaName: 'seo_score',
                inputPayload: {
                  clusterLabel: cluster.label,
                  demandScore: demandScore.value,
                  competitionScore: competitionScore.value,
                },
                resultPayload: seoScore as unknown as SeoBriefJsonValue,
              });

              const productScore = this.productScoreService.calculate({
                fit: productBridge.fit,
                riskCount: productBridge.risks.length,
              });
              await this.scoreLogger.record({
                runId: run.id,
                stepId: step.id,
                formulaName: 'product_score',
                inputPayload: {
                  clusterLabel: cluster.label,
                  fit: productBridge.fit,
                  riskCount: productBridge.risks.length,
                },
                resultPayload: productScore as unknown as SeoBriefJsonValue,
              });

              const penalties = deriveClusterPenalties({
                clusterKeywordCount: cluster.keywords.length,
                representativeSearchVolume: representativeKeywordMetrics.searchVolume,
                fit: productBridge.fit,
                serpResultCount: representativeSerp?.items.length ?? 0,
                hasDomainMetrics: averageDomainTraffic != null,
              });
              const finalScore = this.finalClusterScoreService.calculate({
                seoScore: seoScore.value,
                productScore: productScore.value,
                seoWeight: run.seoWeight,
                productWeight: run.productWeight,
                penalties: penalties.map((item) => item.points),
              });
              await this.scoreLogger.record({
                runId: run.id,
                stepId: step.id,
                formulaName: 'final_cluster_score',
                inputPayload: {
                  clusterLabel: cluster.label,
                  seoScore: seoScore.value,
                  productScore: productScore.value,
                  seoWeight: run.seoWeight,
                  productWeight: run.productWeight,
                  penalties: penalties as unknown as SeoBriefJsonValue,
                },
                resultPayload: finalScore as unknown as SeoBriefJsonValue,
              });

              const decisionLabel =
                productScore.value < MIN_PRODUCT_SCORE
                  ? 'postponed_low_product_fit'
                  : finalScore.value < MIN_FINAL_CLUSTER_SCORE
                    ? 'postponed_low_score'
                    : 'viable';

              scoredClusters.push({
                label: cluster.label,
                intent: cluster.intent,
                primaryKeyword: cluster.primaryKeyword,
                representativeKeyword: cluster.representativeKeyword,
                keywords: cluster.keywords,
                productBridge,
                demandScore: demandScore.value,
                competitionScore: competitionScore.value,
                seoScore: seoScore.value,
                productScore: productScore.value,
                finalScore: finalScore.value,
                penalties,
                representativeSearchVolume: representativeKeywordMetrics.searchVolume,
                averageDomainTraffic,
                averageOnpageScore,
                averageKeywordCompetition,
                decisionLabel,
              });
            }

            await this.saveArtifact({
              runId: run.id,
              stage: 'cluster_scoring',
              artifactType: 'cluster_scoring_snapshot',
              payload: {
                totalClusters: clustering.clusters.length,
                scoredClusterCount: scoredClusters.length,
                truncatedClusterCount: Math.max(
                  0,
                  clustering.clusters.length - scoredClusters.length,
                ),
                scoredClusters: scoredClusters as unknown as SeoBriefJsonValue,
              },
              attempt: step.attemptNumber,
            });

            return { scoredClusters };
          })
        : restoreClusterScoring(priorArtifacts);

      if (shouldStopAfter(options.stopAfterStage, 'cluster_scoring')) {
        return this.finishCheckpoint(run, 'cluster_scoring', {
          hypothesisCount: keywordExpansion.hypotheses.length,
          keywordCount: keywordResearch.enrichedKeywords.length,
          relatedSeedCount: relatedKeywordSeeds.length,
          relatedKeywordCount: relatedKeywordResearch.uniqueSuggestions.length,
          serpKeywordCount: serpKeywords.length,
          domainCount: domainMetricsResearch.metrics.length,
          onpageTargetCount: onpageResearch.pages.length,
          acceptedKeywordCount: triage.accepted.length,
          clusterCount: clustering.clusters.length,
        });
      }

      const clusterSelection = shouldExecuteStage(options.startStage, 'cluster_selection')
        ? await this.executeStage(run.id, 'cluster_selection', async (step) => {
            const rankedClusters = [...clusterScoring.scoredClusters].sort(
              (left, right) => right.finalScore - left.finalScore,
            );
            const selectedCluster = rankedClusters[0] ?? null;
            if (!selectedCluster) {
              return {
                selectedCluster: null,
                rejectedClusters: [],
                explanation: null,
                outcome: 'needs_manual_review' as const,
                reason: 'No clusters available for selection',
              };
            }

            const explanation = await this.ai.explainClusterSelection({
              runId: run.id,
              stepId: step.id,
              model: aiModel,
              modelMode: aiModelMode,
              timeoutMs: requestTimeoutMs,
              selectedClusterLabel: selectedCluster.label,
              candidates: rankedClusters.map((cluster) => ({
                label: cluster.label,
                primaryKeyword: cluster.representativeKeyword,
                seoScore: cluster.seoScore,
                productScore: cluster.productScore,
                totalScore: cluster.finalScore,
                notes: cluster.penalties.map((item) => item.reason),
              })),
            });

            const outcome = 'done' as const;
            const reason = null;
            const rejectedClusters = rankedClusters.slice(1).map((cluster) => ({
              label: cluster.label,
              representativeKeyword: cluster.representativeKeyword,
              finalScore: cluster.finalScore,
              decisionLabel: cluster.decisionLabel,
              reason:
                explanation.rejectedClusters.find((item) => item.label === cluster.label)?.reason ??
                'Lower-ranked than the selected cluster',
            }));

            await this.saveArtifact({
              runId: run.id,
              stage: 'cluster_selection',
              artifactType: 'cluster_selection_snapshot',
              payload: {
                selectedCluster: {
                  ...selectedCluster,
                  explanationSummary: explanation.summary,
                  explanationReasons: explanation.reasons,
                } as unknown as SeoBriefJsonValue,
                rejectedClusters: rejectedClusters as unknown as SeoBriefJsonValue,
                outcome,
                reason,
              },
              attempt: step.attemptNumber,
            });

            return {
              selectedCluster,
              rejectedClusters,
              explanation,
              outcome,
              reason,
            };
          })
        : restoreClusterSelection(priorArtifacts);

      const canAutoAcceptSelection =
        options.skipManualReview === true && clusterSelection.selectedCluster != null;

      if (clusterSelection.outcome === 'needs_manual_review' && !canAutoAcceptSelection) {
        run.markNeedsManualReview(clusterSelection.reason);
        await this.runRepository.save(run);

        return {
          runId: run.id,
          status: run.status,
          hypothesisCount: keywordExpansion.hypotheses.length,
          keywordCount: keywordResearch.enrichedKeywords.length,
          relatedSeedCount: relatedKeywordSeeds.length,
          relatedKeywordCount: relatedKeywordResearch.uniqueSuggestions.length,
          serpKeywordCount: serpKeywords.length,
          domainCount: domainMetricsResearch.metrics.length,
          onpageTargetCount: onpageResearch.pages.length,
          acceptedKeywordCount: triage.accepted.length,
          clusterCount: clustering.clusters.length,
          selectedClusterLabel: clusterSelection.selectedCluster?.label ?? null,
          briefDocumentId: null,
          briefTitle: null,
        };
      }

      if (shouldStopAfter(options.stopAfterStage, 'cluster_selection')) {
        return this.finishCheckpoint(run, 'cluster_selection', {
          hypothesisCount: keywordExpansion.hypotheses.length,
          keywordCount: keywordResearch.enrichedKeywords.length,
          relatedSeedCount: relatedKeywordSeeds.length,
          relatedKeywordCount: relatedKeywordResearch.uniqueSuggestions.length,
          serpKeywordCount: serpKeywords.length,
          domainCount: domainMetricsResearch.metrics.length,
          onpageTargetCount: onpageResearch.pages.length,
          acceptedKeywordCount: triage.accepted.length,
          clusterCount: clustering.clusters.length,
          selectedClusterLabel: clusterSelection.selectedCluster?.label ?? null,
        });
      }

      const briefGeneration = shouldExecuteStage(options.startStage, 'brief_generation')
        ? await this.executeStage(run.id, 'brief_generation', async (step) => {
            const selectedCluster = clusterSelection.selectedCluster;
            if (!selectedCluster) {
              throw new Error('Selected cluster missing for brief generation');
            }

            const representativeSerp =
              findSerpEntry(serpResearch.serpResults, selectedCluster.representativeKeyword) ??
              findSerpEntry(serpResearch.serpResults, selectedCluster.primaryKeyword);
            const serpInsights = deriveSerpInsights(representativeSerp);
            const constraints = createBriefConstraints(run, selectedCluster);
            const brief = await this.ai.generateSeoBrief({
              runId: run.id,
              stepId: step.id,
              model: aiModel,
              modelMode: aiModelMode,
              timeoutMs: requestTimeoutMs,
              promptInstructionOverrides,
              primaryKeyword: selectedCluster.representativeKeyword,
              clusterLabel: selectedCluster.label,
              intent: selectedCluster.intent,
              audience: run.audience,
              productName: run.productName,
              productDescription: run.productDescription,
              market: {
                country: run.country,
                language: run.language,
                locationName: run.country,
              },
              productBridge: selectedCluster.productBridge,
              serpInsights,
              constraints,
              brandMemorySnapshot: run.brandMemorySnapshot,
            });

            const selectedClusterPayload = toJsonValue({
              label: selectedCluster.label,
              intent: selectedCluster.intent,
              primaryKeyword: selectedCluster.primaryKeyword,
              representativeKeyword: selectedCluster.representativeKeyword,
              keywords: selectedCluster.keywords,
              demandScore: selectedCluster.demandScore,
              competitionScore: selectedCluster.competitionScore,
              seoScore: selectedCluster.seoScore,
              productScore: selectedCluster.productScore,
              finalScore: selectedCluster.finalScore,
              penalties: selectedCluster.penalties,
              productBridge: selectedCluster.productBridge,
              explanationSummary: clusterSelection.explanation?.summary ?? null,
              explanationReasons: clusterSelection.explanation?.reasons ?? [],
            });
            const briefPayload = toJsonValue({
              topic: run.topicSeed,
              title: brief.title,
              metaTitle: brief.metaTitle,
              metaDescription: brief.metaDescription,
              angle: brief.angle,
              primaryKeyword: selectedCluster.representativeKeyword,
              secondaryKeywords: selectedCluster.keywords
                .map((item) => item.keyword)
                .filter((keyword) => keyword !== selectedCluster.representativeKeyword),
              outline: brief.outline,
              faq: brief.faq,
              productPlacement: brief.productPlacement,
            });
            const rejectedClustersPayload =
              clusterSelection.rejectedClusters as unknown as SeoBriefJsonValue;
            const evidencePack = {
              topicSeed: run.topicSeed,
              market: {
                country: run.country,
                language: run.language,
              },
              selectedCluster: selectedClusterPayload,
              rejectedClusters: rejectedClustersPayload,
              serpInsights,
              selectionExplanation: {
                summary: clusterSelection.explanation?.summary ?? null,
                reasons: clusterSelection.explanation?.reasons ?? [],
              },
              researchSummary: {
                hypothesisCount: keywordExpansion.hypotheses.length,
                keywordCount: keywordResearch.enrichedKeywords.length,
                relatedSeedCount: relatedKeywordSeeds.length,
                relatedKeywordCount: relatedKeywordResearch.uniqueSuggestions.length,
                serpKeywordCount: serpKeywords.length,
                domainCount: domainMetricsResearch.metrics.length,
                onpageTargetCount: onpageResearch.pages.length,
              },
            } as SeoBriefJsonObject;

            const document = SeoBriefDocument.create({
              runId: run.id,
              selectedClusterPayload,
              briefPayload,
              rejectedClustersPayload,
            });
            await this.documentRepository.save(document);

            await this.saveArtifact({
              runId: run.id,
              stage: 'brief_generation',
              artifactType: 'final_brief_snapshot',
              payload: {
                brief: briefPayload,
                selectedCluster: selectedClusterPayload,
                rejectedClusters: rejectedClustersPayload,
              },
              attempt: step.attemptNumber,
            });
            await this.saveArtifact({
              runId: run.id,
              stage: 'brief_generation',
              artifactType: 'evidence_pack_snapshot',
              payload: evidencePack,
              attempt: step.attemptNumber,
            });

            return {
              documentId: document.id,
              briefTitle: brief.title,
            };
          })
        : restoreBriefGeneration(priorArtifacts);

      if (shouldStopAfter(options.stopAfterStage, 'brief_generation')) {
        return this.finishCheckpoint(run, 'brief_generation', {
          hypothesisCount: keywordExpansion.hypotheses.length,
          keywordCount: keywordResearch.enrichedKeywords.length,
          relatedSeedCount: relatedKeywordSeeds.length,
          relatedKeywordCount: relatedKeywordResearch.uniqueSuggestions.length,
          serpKeywordCount: serpKeywords.length,
          domainCount: domainMetricsResearch.metrics.length,
          onpageTargetCount: onpageResearch.pages.length,
          acceptedKeywordCount: triage.accepted.length,
          clusterCount: clustering.clusters.length,
          selectedClusterLabel: clusterSelection.selectedCluster?.label ?? null,
          briefDocumentId: briefGeneration.documentId,
          briefTitle: briefGeneration.briefTitle,
        });
      }

      run.complete();
      await this.runRepository.save(run);

      return {
        runId: run.id,
        status: 'done',
        hypothesisCount: keywordExpansion.hypotheses.length,
        keywordCount: keywordResearch.enrichedKeywords.length,
        relatedSeedCount: relatedKeywordSeeds.length,
        relatedKeywordCount: relatedKeywordResearch.uniqueSuggestions.length,
        serpKeywordCount: serpKeywords.length,
        domainCount: domainMetricsResearch.metrics.length,
        onpageTargetCount: onpageResearch.pages.length,
        acceptedKeywordCount: triage.accepted.length,
        clusterCount: clustering.clusters.length,
        selectedClusterLabel: clusterSelection.selectedCluster?.label ?? null,
        briefDocumentId: briefGeneration.documentId,
        briefTitle: briefGeneration.briefTitle,
      };
    } catch (error) {
      run.fail(describeError(error));
      await this.runRepository.save(run);
      throw error;
    }
  }

  private async executeStage<TResult>(
    runId: string,
    stage: SeoBriefRunStage,
    callback: (step: SeoBriefRunStep) => Promise<TResult>,
  ): Promise<TResult> {
    const existingSteps = await this.stepRepository.findByRunId(runId as never);
    const attemptNumber =
      existingSteps
        .filter((item) => item.stage === stage)
        .reduce((max, item) => Math.max(max, item.attemptNumber), 0) + 1;
    const step = SeoBriefRunStep.create({
      runId: runId as never,
      stage,
      status: 'running',
      attemptNumber,
    });
    step.markRunning();
    await this.stepRepository.save(step);

    try {
      const result = await callback(step);
      step.complete();
      await this.stepRepository.save(step);
      return result;
    } catch (error) {
      step.fail(describeError(error));
      await this.stepRepository.save(step);
      throw error;
    }
  }

  private async saveArtifact(params: {
    runId: string;
    stage: SeoBriefRunStage;
    artifactType: string;
    payload: SeoBriefJsonObject;
    attempt?: number;
  }): Promise<void> {
    await this.artifactRepository.save(
      SeoBriefArtifact.create({
        runId: params.runId as never,
        stage: params.stage,
        artifactType: params.artifactType,
        payload: params.payload,
        attempt: params.attempt,
      }),
    );
  }

  private async finishCheckpoint(
    run: SeoBriefRun,
    stage: SeoBriefRunStage,
    progress: Partial<ProcessSeoBriefRunResult>,
  ): Promise<ProcessSeoBriefRunResult> {
    if (stage === 'brief_generation') {
      run.complete();
    } else {
      run.awaitConfirmation();
    }
    await this.runRepository.save(run);

    return this.createProgressResult(run, progress);
  }

  private createProgressResult(
    run: SeoBriefRun,
    progress: Partial<ProcessSeoBriefRunResult>,
  ): ProcessSeoBriefRunResult {
    return {
      runId: run.id,
      status: run.status,
      hypothesisCount: progress.hypothesisCount ?? 0,
      keywordCount: progress.keywordCount ?? 0,
      relatedSeedCount: progress.relatedSeedCount ?? 0,
      relatedKeywordCount: progress.relatedKeywordCount ?? 0,
      serpKeywordCount: progress.serpKeywordCount ?? 0,
      domainCount: progress.domainCount ?? 0,
      onpageTargetCount: progress.onpageTargetCount ?? 0,
      acceptedKeywordCount: progress.acceptedKeywordCount ?? 0,
      clusterCount: progress.clusterCount ?? 0,
      selectedClusterLabel: progress.selectedClusterLabel ?? null,
      briefDocumentId: progress.briefDocumentId ?? null,
      briefTitle: progress.briefTitle ?? null,
    };
  }
}

function shouldExecuteStage(
  startStage: SeoBriefRerunnableStage | undefined,
  stage: SeoBriefRunStage,
): boolean {
  if (!startStage) {
    return true;
  }

  return findStageIndex(stage) >= findStageIndex(startStage);
}

function shouldStopAfter(
  stopAfterStage: SeoBriefRerunnableStage | undefined,
  stage: SeoBriefRunStage,
): boolean {
  return stopAfterStage === stage;
}

function findStageIndex(stage: SeoBriefRunStage): number {
  return SEO_BRIEF_RUN_STAGE_ORDER.indexOf(stage);
}

function findLatestArtifactByType(
  artifacts: SeoBriefArtifact[],
  artifactType: string,
): SeoBriefArtifact {
  const artifact = findLatestArtifactByTypeOrNull(artifacts, artifactType);
  if (!artifact) {
    throw new Error(`SEO brief artifact ${artifactType} is missing for rerun restoration`);
  }

  return artifact;
}

function findLatestArtifactByTypeOrNull(
  artifacts: SeoBriefArtifact[],
  artifactType: string,
): SeoBriefArtifact | null {
  for (let index = artifacts.length - 1; index >= 0; index -= 1) {
    const artifact = artifacts[index];
    if (artifact?.artifactType === artifactType) {
      return artifact;
    }
  }

  return null;
}

function asObjectRecord(
  value: SeoBriefJsonValue,
  context: string,
): Record<string, SeoBriefJsonValue> {
  if (!value || Array.isArray(value) || typeof value !== 'object') {
    throw new Error(`SEO brief ${context} artifact payload is not an object`);
  }

  return value as Record<string, SeoBriefJsonValue>;
}

function asArrayField<T>(
  record: Record<string, SeoBriefJsonValue>,
  field: string,
  context: string,
): T[] {
  const value = record[field];
  if (!Array.isArray(value)) {
    throw new Error(`SEO brief ${context} artifact field ${field} is not an array`);
  }

  return value as T[];
}

function asOptionalArrayField<T>(
  record: Record<string, SeoBriefJsonValue>,
  field: string,
): T[] | undefined {
  const value = record[field];
  return Array.isArray(value) ? (value as T[]) : undefined;
}

function asNullableString(value: SeoBriefJsonValue, fallback: string | null = null): string | null {
  return typeof value === 'string' ? value : fallback;
}

function readKeywordExpansionPrompt(artifacts: SeoBriefArtifact[]): string {
  const artifact = findLatestArtifactByTypeOrNull(artifacts, 'normalized_input');
  if (!artifact) {
    return resolveSeoBriefKeywordExpansionPrompt();
  }

  const payload = asObjectRecord(artifact.payload, 'normalized_input');
  return resolveSeoBriefKeywordExpansionPrompt(asNullableString(payload.keywordExpansionPrompt));
}

function readAiModelMode(artifacts: SeoBriefArtifact[]): SeoBriefAiModelMode {
  const artifact = findLatestArtifactByTypeOrNull(artifacts, 'normalized_input');
  if (!artifact) {
    return 'pro';
  }

  const payload = asObjectRecord(artifact.payload, 'normalized_input');
  const value = asNullableString(payload.aiModelMode);
  return value === 'flash' || value === 'pro' || value === 'pro_thinking' ? value : 'pro';
}

function readAiModel(artifacts: SeoBriefArtifact[]): string | null {
  const artifact = findLatestArtifactByTypeOrNull(artifacts, 'normalized_input');
  if (!artifact) {
    return null;
  }

  const payload = asObjectRecord(artifact.payload, 'normalized_input');
  const value = asNullableString(payload.aiModel);
  return value?.trim() || null;
}

function readCampaignContext(artifacts: SeoBriefArtifact[]): string | null {
  const artifact = findLatestArtifactByTypeOrNull(artifacts, 'normalized_input');
  if (!artifact) {
    return null;
  }

  const payload = asObjectRecord(artifact.payload, 'normalized_input');
  return asNullableString(payload.campaignContext);
}

function readSeoProductContext(artifacts: SeoBriefArtifact[]): SeoBriefJsonObject | null {
  const artifact = findLatestArtifactByTypeOrNull(artifacts, 'seo_product_context');
  if (!artifact) {
    return null;
  }

  return asObjectRecord(artifact.payload, 'seo_product_context');
}

function readHypothesesCount(artifacts: SeoBriefArtifact[]): number {
  const artifact = findLatestArtifactByTypeOrNull(artifacts, 'normalized_input');
  if (!artifact) {
    return 10;
  }

  const payload = asObjectRecord(artifact.payload, 'normalized_input');
  const value = payload.hypothesesCount;
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : 10;
}

function restoreUserPainScenariosOrNull(
  artifacts: SeoBriefArtifact[],
): ExtractUserPainScenariosResult | null {
  const artifact = findLatestArtifactByTypeOrNull(artifacts, 'user_pain_scenarios');
  if (!artifact) {
    return null;
  }

  const payload = asObjectRecord(artifact.payload, 'user_pain_scenarios');
  return {
    topicHintInterpretation: asNullableString(payload.topicHintInterpretation, '') ?? '',
    userPains:
      asOptionalArrayField<ExtractUserPainScenariosResult['userPains'][number]>(
        payload,
        'userPains',
      ) ?? [],
    userScenarios:
      asOptionalArrayField<ExtractUserPainScenariosResult['userScenarios'][number]>(
        payload,
        'userScenarios',
      ) ?? [],
    riskNotes: asOptionalArrayField<string>(payload, 'riskNotes') ?? [],
  };
}

function limitKeywordExpansionResult(
  result: KeywordExpansionResult,
  limit: number,
): KeywordExpansionResult {
  const hypotheses = result.hypotheses.slice(0, limit);
  if (!result.groups?.length) {
    return { hypotheses };
  }

  const allowedKeywords = new Set(hypotheses.map((item) => item.keyword.trim().toLowerCase()));
  const groups = result.groups
    .map((group) => ({
      ...group,
      hypotheses: group.hypotheses.filter((item) =>
        allowedKeywords.has(item.keyword.trim().toLowerCase()),
      ),
    }))
    .filter((group) => group.hypotheses.length > 0);

  return { hypotheses, groups };
}

function restoreKeywordExpansion(artifacts: SeoBriefArtifact[]): KeywordExpansionResult {
  const payload = asObjectRecord(
    findLatestArtifactByType(artifacts, 'keyword_hypotheses').payload,
    'keyword_hypotheses',
  );

  return {
    hypotheses: asArrayField<KeywordExpansionResult['hypotheses'][number]>(
      payload,
      'hypotheses',
      'keyword_hypotheses',
    ),
    groups: asOptionalArrayField<NonNullable<KeywordExpansionResult['groups']>[number]>(
      payload,
      'groups',
    ),
  };
}

function restoreKeywordResearch(artifacts: SeoBriefArtifact[]): {
  enrichedKeywords: ResearchKeywordItem[];
} {
  const payload = asObjectRecord(
    findLatestArtifactByType(artifacts, 'keyword_research_snapshot').payload,
    'keyword_research_snapshot',
  );

  return {
    enrichedKeywords: asArrayField<ResearchKeywordItem>(
      payload,
      'enrichedKeywords',
      'keyword_research_snapshot',
    ),
  };
}

function restoreRelatedKeywordResearch(artifacts: SeoBriefArtifact[]): {
  uniqueSuggestions: Array<{
    keyword: string;
    searchVolume: number | null;
    competition: number | null;
    cpc: number | null;
    relevance: number | null;
  }>;
} {
  const payload = asObjectRecord(
    findLatestArtifactByType(artifacts, 'related_keyword_research_snapshot').payload,
    'related_keyword_research_snapshot',
  );

  return {
    uniqueSuggestions: asArrayField<{
      keyword: string;
      searchVolume: number | null;
      competition: number | null;
      cpc: number | null;
      relevance: number | null;
    }>(payload, 'uniqueSuggestions', 'related_keyword_research_snapshot'),
  };
}

function restoreSerpResearch(artifacts: SeoBriefArtifact[]): {
  serpResults: SerpResearchEntry[];
  domains: string[];
  urls: string[];
} {
  const payload = asObjectRecord(
    findLatestArtifactByType(artifacts, 'serp_research_snapshot').payload,
    'serp_research_snapshot',
  );

  return {
    serpResults: asArrayField<SerpResearchEntry>(payload, 'serpResults', 'serp_research_snapshot'),
    domains: asArrayField<string>(payload, 'domains', 'serp_research_snapshot'),
    urls: asArrayField<string>(payload, 'urls', 'serp_research_snapshot'),
  };
}

function restoreDomainMetricsResearch(artifacts: SeoBriefArtifact[]): {
  metrics: DomainMetricsEntry[];
} {
  const payload = asObjectRecord(
    findLatestArtifactByType(artifacts, 'domain_metrics_snapshot').payload,
    'domain_metrics_snapshot',
  );

  return {
    metrics: asArrayField<DomainMetricsEntry>(payload, 'metrics', 'domain_metrics_snapshot'),
  };
}

function restoreOnpageResearch(artifacts: SeoBriefArtifact[]): {
  pages: OnPageResearchEntry[];
} {
  const payload = asObjectRecord(
    findLatestArtifactByType(artifacts, 'onpage_research_snapshot').payload,
    'onpage_research_snapshot',
  );

  return {
    pages: asArrayField<OnPageResearchEntry>(payload, 'pages', 'onpage_research_snapshot'),
  };
}

function restoreClustering(artifacts: SeoBriefArtifact[]): { clusters: ClusterEntry[] } {
  const payload = asObjectRecord(
    findLatestArtifactByType(artifacts, 'cluster_snapshot').payload,
    'cluster_snapshot',
  );

  return {
    clusters: asArrayField<ClusterEntry>(payload, 'clusters', 'cluster_snapshot'),
  };
}

function restoreClusterScoring(artifacts: SeoBriefArtifact[]): {
  scoredClusters: ClusterScoreEntry[];
} {
  const payload = asObjectRecord(
    findLatestArtifactByType(artifacts, 'cluster_scoring_snapshot').payload,
    'cluster_scoring_snapshot',
  );

  return {
    scoredClusters: asArrayField<ClusterScoreEntry>(
      payload,
      'scoredClusters',
      'cluster_scoring_snapshot',
    ),
  };
}

function restoreClusterSelection(artifacts: SeoBriefArtifact[]): ClusterSelectionResult {
  const payload = asObjectRecord(
    findLatestArtifactByType(artifacts, 'cluster_selection_snapshot').payload,
    'cluster_selection_snapshot',
  );
  const selectedClusterRecord =
    payload.selectedCluster == null
      ? null
      : asObjectRecord(payload.selectedCluster, 'cluster_selection_snapshot.selectedCluster');
  const selectedCluster = selectedClusterRecord as unknown as ClusterScoreEntry | null;
  const explanationSummary = selectedClusterRecord
    ? asNullableString(selectedClusterRecord.explanationSummary)
    : null;
  const explanationReasons = selectedClusterRecord
    ? Array.isArray(selectedClusterRecord.explanationReasons)
      ? (selectedClusterRecord.explanationReasons as string[])
      : []
    : [];
  const rejectedClusters = asArrayField<ClusterSelectionRejectedEntry>(
    payload,
    'rejectedClusters',
    'cluster_selection_snapshot',
  );
  const outcome =
    payload.outcome === 'needs_manual_review' ? 'needs_manual_review' : ('done' as const);

  return {
    selectedCluster,
    rejectedClusters,
    explanation: selectedCluster
      ? {
          summary: explanationSummary ?? '',
          reasons: explanationReasons,
          rejectedClusters: rejectedClusters.map((cluster) => ({
            label: cluster.label,
            reason: cluster.reason,
          })),
        }
      : null,
    outcome,
    reason: asNullableString(payload.reason),
  };
}

function restoreBriefGeneration(artifacts: SeoBriefArtifact[]): {
  documentId: string | null;
  briefTitle: string | null;
} {
  const payload = asObjectRecord(
    findLatestArtifactByType(artifacts, 'final_brief_snapshot').payload,
    'final_brief_snapshot',
  );
  const brief = asObjectRecord(payload.brief ?? null, 'final_brief_snapshot.brief');

  return {
    documentId: null,
    briefTitle: asNullableString(brief.title),
  };
}

function uniqueKeywords(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = value.trim().toLowerCase();
    if (normalized.length === 0 || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    result.push(value.trim());
  }

  return result;
}

function filterDataForSeoKeywords(values: string[]): string[] {
  return values.filter((value) => isDataForSeoKeywordSafe(value));
}

function isDataForSeoKeywordSafe(value: string): boolean {
  const normalized = value.trim().replace(/\s+/g, ' ');
  if (!normalized) {
    return false;
  }

  const wordCount = normalized.split(' ').filter(Boolean).length;
  return (
    wordCount > 0 &&
    wordCount <= DATAFORSEO_KEYWORD_MAX_WORDS &&
    normalized.length <= DATAFORSEO_KEYWORD_MAX_CHARS
  );
}

function describeUnknownError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return 'Unknown error';
}

function uniqueKeywordItems(items: ResearchKeywordItem[]): ResearchKeywordItem[] {
  const seen = new Set<string>();
  const result: ResearchKeywordItem[] = [];

  for (const item of items) {
    const normalized = item.keyword.trim().toLowerCase();
    if (normalized.length === 0 || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    result.push({
      keyword: item.keyword.trim(),
      searchVolume: item.searchVolume,
      competition: item.competition,
      cpc: item.cpc,
      lowTopBid: item.lowTopBid,
      highTopBid: item.highTopBid,
    });
  }

  return result;
}

function deriveRelatedKeywordSeeds(topicSeed: string, items: ResearchKeywordItem[]): string[] {
  const sorted = [...items].sort((left, right) => {
    const leftVolume = left.searchVolume ?? -1;
    const rightVolume = right.searchVolume ?? -1;
    return rightVolume - leftVolume;
  });

  const candidates = filterDataForSeoKeywords(
    uniqueKeywords([topicSeed, ...sorted.map((item) => item.keyword)]),
  );
  return candidates.slice(0, RELATED_KEYWORD_SEED_LIMIT);
}

function deriveSerpResearchKeywords(
  topicSeed: string,
  researchKeywords: ResearchKeywordItem[],
  relatedKeywords: Array<{
    keyword: string;
    searchVolume: number | null;
  }>,
): string[] {
  const rankedResearchKeywords = [...researchKeywords].sort((left, right) => {
    const leftVolume = left.searchVolume ?? -1;
    const rightVolume = right.searchVolume ?? -1;
    return rightVolume - leftVolume;
  });
  const rankedRelatedKeywords = [...relatedKeywords].sort((left, right) => {
    const leftVolume = left.searchVolume ?? -1;
    const rightVolume = right.searchVolume ?? -1;
    return rightVolume - leftVolume;
  });

  const candidates = filterDataForSeoKeywords(
    uniqueKeywords([
      topicSeed,
      ...rankedResearchKeywords.map((item) => item.keyword),
      ...rankedRelatedKeywords.map((item) => item.keyword),
    ]),
  );

  return candidates.slice(0, SERP_RESEARCH_KEYWORD_LIMIT);
}

function deriveUniqueDomains(serpResults: SerpResearchEntry[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const entry of serpResults) {
    for (const item of entry.items) {
      const domain = item.domain?.trim();
      const domainKey = domain?.toLowerCase() ?? null;
      if (!domain || !domainKey || seen.has(domainKey)) {
        continue;
      }

      seen.add(domainKey);
      result.push(domain);
    }
  }

  return result;
}

function deriveUniqueUrls(serpResults: SerpResearchEntry[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const entry of serpResults) {
    for (const item of entry.items) {
      const url = item.url?.trim();
      const urlKey = url?.toLowerCase() ?? null;
      if (!url || !urlKey || seen.has(urlKey)) {
        continue;
      }

      seen.add(urlKey);
      result.push(url);
    }
  }

  return result;
}

function uniqueKeywordSuggestionItems(groups: RelatedKeywordGroup[]): Array<{
  keyword: string;
  searchVolume: number | null;
  competition: number | null;
  cpc: number | null;
  relevance: number | null;
}> {
  const seen = new Set<string>();
  const result: Array<{
    keyword: string;
    searchVolume: number | null;
    competition: number | null;
    cpc: number | null;
    relevance: number | null;
  }> = [];

  for (const group of groups) {
    for (const suggestion of group.suggestions) {
      const normalized = suggestion.keyword.trim().toLowerCase();
      if (normalized.length === 0 || seen.has(normalized)) {
        continue;
      }

      seen.add(normalized);
      result.push({
        keyword: suggestion.keyword.trim(),
        searchVolume: suggestion.searchVolume,
        competition: suggestion.competition,
        cpc: suggestion.cpc,
        relevance: suggestion.relevance,
      });
    }
  }

  return result;
}

function createSyntheticKeywordItem(keyword: string): ResearchKeywordItem {
  return {
    keyword,
    searchVolume: null,
    competition: null,
    cpc: null,
    lowTopBid: null,
    highTopBid: null,
  };
}

function createSyntheticKeywordMetrics(keyword: string): KeywordUniverseEntry {
  return {
    keyword,
    searchVolume: null,
    competition: null,
    cpc: null,
  };
}

function buildKeywordUniverse(
  researchKeywords: ResearchKeywordItem[],
  relatedKeywords: Array<{
    keyword: string;
    searchVolume: number | null;
    competition: number | null;
    cpc: number | null;
  }>,
): KeywordUniverseEntry[] {
  const records = new Map<string, KeywordUniverseEntry>();

  const upsert = (item: KeywordUniverseEntry): void => {
    const key = item.keyword.trim().toLowerCase();
    if (!key) {
      return;
    }

    const existing = records.get(key);
    if (!existing) {
      records.set(key, {
        keyword: item.keyword.trim(),
        searchVolume: item.searchVolume,
        competition: item.competition,
        cpc: item.cpc,
      });
      return;
    }

    records.set(key, {
      keyword: existing.keyword,
      searchVolume: existing.searchVolume ?? item.searchVolume,
      competition: existing.competition ?? item.competition,
      cpc: existing.cpc ?? item.cpc,
    });
  };

  for (const item of researchKeywords) {
    upsert(item);
  }

  for (const item of relatedKeywords) {
    upsert({
      keyword: item.keyword,
      searchVolume: item.searchVolume,
      competition: item.competition,
      cpc: item.cpc,
    });
  }

  return [...records.values()];
}

function limitKeywordUniverse(
  items: KeywordUniverseEntry[],
  maxItems: number,
): KeywordUniverseEntry[] {
  if (items.length <= maxItems) {
    return items;
  }

  return [...items]
    .sort((left, right) => {
      const volumeDiff = (right.searchVolume ?? -1) - (left.searchVolume ?? -1);
      if (volumeDiff !== 0) {
        return volumeDiff;
      }

      return (right.cpc ?? -1) - (left.cpc ?? -1);
    })
    .slice(0, maxItems);
}

function rankClustersForScoring(
  clusters: ClusterEntry[],
  keywordUniverse: KeywordUniverseEntry[],
): ClusterEntry[] {
  return [...clusters].sort((left, right) => {
    const rightScore = deriveClusterRankingScore(right, keywordUniverse);
    const leftScore = deriveClusterRankingScore(left, keywordUniverse);
    return rightScore - leftScore;
  });
}

function deriveClusterRankingScore(
  cluster: ClusterEntry,
  keywordUniverse: KeywordUniverseEntry[],
): number {
  const searchVolumeSum = cluster.keywords.reduce((sum, keyword) => {
    return sum + (findKeywordUniverseEntry(keywordUniverse, keyword.keyword)?.searchVolume ?? 0);
  }, 0);

  return searchVolumeSum + cluster.keywords.length * 100;
}

function findKeywordUniverseEntry(
  keywordUniverse: KeywordUniverseEntry[],
  keyword: string,
): KeywordUniverseEntry | null {
  const normalizedKeyword = keyword.trim().toLowerCase();
  return (
    keywordUniverse.find((item) => item.keyword.trim().toLowerCase() === normalizedKeyword) ?? null
  );
}

function buildClusterInputCandidates(
  keywordUniverse: KeywordUniverseEntry[],
  topicSeed: string,
): TriageAcceptedEntry[] {
  return keywordUniverse.map((item) => ({
    keyword: item.keyword,
    intent: inferKeywordIntent(item.keyword, topicSeed),
    stage: 'consideration',
    reason: 'Passed from SERP-expanded keyword universe directly into clustering.',
    searchVolume: item.searchVolume,
    competition: item.competition,
    cpc: item.cpc,
  }));
}

function inferKeywordIntent(keyword: string, topicSeed: string): SeoBriefAiKeywordIntent {
  const normalized = `${keyword} ${topicSeed}`.toLowerCase();
  if (
    /\b(buy|price|pricing|cost|fees?|review|reviews|best|compare|vs|alternative|alternatives)\b/u.test(
      normalized,
    )
  ) {
    return 'commercial';
  }
  if (/\b(login|sign in|app|dashboard|account)\b/u.test(normalized)) {
    return 'navigational';
  }
  if (/\b(apply|open|start|register|signup|sign up|download)\b/u.test(normalized)) {
    return 'transactional';
  }
  return 'informational';
}

function buildClusterEntry(
  cluster: {
    label: string;
    primaryKeyword: string;
    intent: SeoBriefAiKeywordIntent;
    keywords: string[];
    rationale: string;
  },
  acceptedKeywords: TriageAcceptedEntry[],
  keywordUniverse: KeywordUniverseEntry[],
  topicSeed: string,
): ClusterEntry | null {
  const normalizedClusterKeywords = uniqueKeywords(cluster.keywords);
  const clusterKeywordMetrics = normalizedClusterKeywords.map(
    (keyword) =>
      findKeywordUniverseEntry(keywordUniverse, keyword) ?? createSyntheticKeywordMetrics(keyword),
  );
  if (clusterKeywordMetrics.length === 0) {
    return null;
  }

  const preferredRepresentative =
    findKeywordUniverseEntry(keywordUniverse, cluster.primaryKeyword) ??
    findHighestVolumeKeyword(clusterKeywordMetrics) ??
    findKeywordUniverseEntry(keywordUniverse, topicSeed) ??
    clusterKeywordMetrics[0];
  const acceptedPrimaryKeyword = acceptedKeywords.find(
    (item) => item.keyword.trim().toLowerCase() === cluster.primaryKeyword.trim().toLowerCase(),
  );
  const representativeReason = acceptedPrimaryKeyword
    ? 'AI primary keyword retained as representative keyword'
    : 'Highest-demand keyword from the cluster selected as representative keyword';

  return {
    label: cluster.label,
    primaryKeyword: cluster.primaryKeyword,
    representativeKeyword: preferredRepresentative.keyword,
    representativeKeywordReason: representativeReason,
    intent: cluster.intent,
    rationale: cluster.rationale,
    keywords: clusterKeywordMetrics,
  };
}

function findHighestVolumeKeyword(items: KeywordUniverseEntry[]): KeywordUniverseEntry | null {
  return (
    [...items].sort((left, right) => (right.searchVolume ?? -1) - (left.searchVolume ?? -1))[0] ??
    null
  );
}

function findSerpEntry(entries: SerpResearchEntry[], keyword: string): SerpResearchEntry | null {
  const normalizedKeyword = keyword.trim().toLowerCase();
  return entries.find((entry) => entry.keyword.trim().toLowerCase() === normalizedKeyword) ?? null;
}

function averageNumbers(values: Array<number | null | undefined>): number | null {
  const normalized = values.filter((value): value is number => typeof value === 'number');
  if (normalized.length === 0) {
    return null;
  }

  return (
    Math.round((normalized.reduce((sum, item) => sum + item, 0) / normalized.length) * 100) / 100
  );
}

function deriveAverageDomainTraffic(
  serpEntry: SerpResearchEntry | null,
  metrics: DomainMetricsEntry[],
): number | null {
  if (!serpEntry) {
    return null;
  }

  const domainMap = new Map(metrics.map((item) => [item.target.trim().toLowerCase(), item]));
  return averageNumbers(
    serpEntry.items.map((item) => {
      const domain = item.domain?.trim().toLowerCase();
      return domain ? (domainMap.get(domain)?.organicTraffic ?? null) : null;
    }),
  );
}

function deriveAverageOnpageScore(
  serpEntry: SerpResearchEntry | null,
  pages: OnPageResearchEntry[],
): number | null {
  if (!serpEntry) {
    return null;
  }

  const pageMap = new Map(pages.map((item) => [item.target.trim().toLowerCase(), item]));
  return averageNumbers(
    serpEntry.items.map((item) => {
      const url = item.url?.trim().toLowerCase();
      return url ? (pageMap.get(url)?.onpageScore ?? null) : null;
    }),
  );
}

function deriveClusterPenalties(input: {
  clusterKeywordCount: number;
  representativeSearchVolume: number | null;
  fit: SeoBriefAiProductFit;
  serpResultCount: number;
  hasDomainMetrics: boolean;
}): ClusterPenalty[] {
  const penalties: ClusterPenalty[] = [];

  if (input.clusterKeywordCount < 2) {
    penalties.push({
      code: 'narrow_cluster',
      points: 5,
      reason: 'Cluster contains fewer than two distinct keywords',
    });
  }

  if ((input.representativeSearchVolume ?? 0) < 500) {
    penalties.push({
      code: 'low_demand',
      points: 10,
      reason: 'Representative keyword has weak observed demand',
    });
  }

  if (input.fit === 'weak') {
    penalties.push({
      code: 'weak_product_fit',
      points: 15,
      reason: 'AI product bridge marked the cluster as weak product fit',
    });
  }

  if (input.serpResultCount === 0) {
    penalties.push({
      code: 'missing_serp_context',
      points: 10,
      reason: 'No SERP evidence available for the representative keyword',
    });
  }

  if (!input.hasDomainMetrics) {
    penalties.push({
      code: 'missing_domain_metrics',
      points: 5,
      reason: 'No domain strength data available for the representative SERP set',
    });
  }

  return penalties;
}

function deriveSerpInsights(serpEntry: SerpResearchEntry | null): Array<{
  title: string;
  url: string | null;
  observation: string;
}> {
  if (!serpEntry) {
    return [];
  }

  return serpEntry.items.slice(0, 3).map((item) => ({
    title: item.title ?? 'Untitled SERP result',
    url: item.url,
    observation:
      item.description ??
      `Organic result ranked at position ${item.rankAbsolute ?? item.rankGroup ?? 'unknown'}`,
  }));
}

function createBriefConstraints(
  run: {
    keyMessage: string | null;
    cta: string | null;
    audienceBefore: string | null;
    audienceAfter: string | null;
    brandMemorySnapshot: {
      forbiddenClaims: string[];
      requiredPhrases: string[];
      bannedPhrases: string[];
    };
  },
  selectedCluster: {
    finalScore: number;
    seoScore: number;
    productScore: number;
  },
): string[] {
  const constraints = [
    run.keyMessage ? `Preserve the core message: ${run.keyMessage}` : null,
    run.cta ? `Use this CTA direction: ${run.cta}` : null,
    run.audienceBefore && run.audienceAfter
      ? `Move the audience from "${run.audienceBefore}" to "${run.audienceAfter}".`
      : null,
    `Selected cluster scores: final ${selectedCluster.finalScore}, SEO ${selectedCluster.seoScore}, product ${selectedCluster.productScore}.`,
    ...run.brandMemorySnapshot.requiredPhrases.map((value) => `Required phrase: ${value}`),
    ...run.brandMemorySnapshot.forbiddenClaims.map((value) => `Forbidden claim: ${value}`),
    ...run.brandMemorySnapshot.bannedPhrases.map((value) => `Avoid phrase: ${value}`),
  ];

  return constraints.filter((value): value is string => Boolean(value?.trim()));
}

function toJsonValue(value: unknown): SeoBriefJsonValue {
  return value as SeoBriefJsonValue;
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown SEO brief processing error';
}
