import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SeoBriefExternalCallLoggerService } from './services/seo-brief-external-call-logger.service.js';
import { SeoBriefLlmLoggerService } from './services/seo-brief-llm-logger.service.js';
import { SeoBriefRunControlService } from './services/seo-brief-run-control.service.js';
import { SeoBriefScoreLoggerService } from './services/seo-brief-score-logger.service.js';
import { AggregateSerpDomainsHandler } from './use-cases/aggregate-serp-domains/aggregate-serp-domains.handler.js';
import { BuildCompetitorKeywordMapHandler } from './use-cases/build-competitor-keyword-map/build-competitor-keyword-map.handler.js';
import { BuildDirtyKeywordPoolHandler } from './use-cases/build-dirty-keyword-pool/build-dirty-keyword-pool.handler.js';
import { ClassifySerpDomainsHandler } from './use-cases/classify-serp-domains/classify-serp-domains.handler.js';
import { CleanupLongreadArticleHandler } from './use-cases/cleanup-longread-article/cleanup-longread-article.handler.js';
import { ClusterKeywordCandidatesHandler } from './use-cases/cluster-keyword-candidates/cluster-keyword-candidates.handler.js';
import { ContinueSeoBriefRunHandler } from './use-cases/continue-seo-brief-run/continue-seo-brief-run.handler.js';
import { CreateSeoBriefRunHandler } from './use-cases/create-seo-brief-run/create-seo-brief-run.handler.js';
import { ExtractSerpDerivedCandidatesHandler } from './use-cases/extract-serp-derived-candidates/extract-serp-derived-candidates.handler.js';
import { FetchFirstKeywordSerpPreviewHandler } from './use-cases/fetch-first-keyword-serp-preview/fetch-first-keyword-serp-preview.handler.js';
import { FetchKeywordSerpPreviewsHandler } from './use-cases/fetch-keyword-serp-previews/fetch-keyword-serp-previews.handler.js';
import { FetchRankedKeywordsHandler } from './use-cases/fetch-ranked-keywords/fetch-ranked-keywords.handler.js';
import { FetchSelectedClusterOnPageHandler } from './use-cases/fetch-selected-cluster-onpage/fetch-selected-cluster-onpage.handler.js';
import { GenerateFinalSeoBriefHandler } from './use-cases/generate-final-seo-brief/generate-final-seo-brief.handler.js';
import { GenerateKeywordHypothesesHandler } from './use-cases/generate-keyword-hypotheses/generate-keyword-hypotheses.handler.js';
import { GenerateLongreadDraftHandler } from './use-cases/generate-longread-draft/generate-longread-draft.handler.js';
import { GenerateUserPainScenariosHandler } from './use-cases/generate-user-pain-scenarios/generate-user-pain-scenarios.handler.js';
import { GetSeoBriefRunHandler } from './use-cases/get-seo-brief-run/get-seo-brief-run.handler.js';
import { ListSeoBriefRunsHandler } from './use-cases/list-seo-brief-runs/list-seo-brief-runs.handler.js';
import { MarkSeoBriefRunManualReviewHandler } from './use-cases/mark-seo-brief-run-manual-review/mark-seo-brief-run-manual-review.handler.js';
import { MatchCompetitorKeywordsHandler } from './use-cases/match-competitor-keywords/match-competitor-keywords.handler.js';
import { PackageLongreadArticleHandler } from './use-cases/package-longread-article/package-longread-article.handler.js';
import { ProcessSeoBriefRunExecutor } from './use-cases/process-seo-brief-run/process-seo-brief-run.executor.js';
import { RegenerateSeoBriefHandler } from './use-cases/regenerate-seo-brief/regenerate-seo-brief.handler.js';
import { RejectSeoBriefRunHandler } from './use-cases/reject-seo-brief-run/reject-seo-brief-run.handler.js';
import { ReviewClusterProductFitHandler } from './use-cases/review-cluster-product-fit/review-cluster-product-fit.handler.js';
import { RerunSeoBriefRunHandler } from './use-cases/rerun-seo-brief-run/rerun-seo-brief-run.handler.js';
import { RerunSeoBriefStageHandler } from './use-cases/rerun-seo-brief-stage/rerun-seo-brief-stage.handler.js';
import { ScoreKeywordCandidatesHandler } from './use-cases/score-keyword-candidates/score-keyword-candidates.handler.js';
import { SelectFirstKeywordRelatedQueriesHandler } from './use-cases/select-first-keyword-related-queries/select-first-keyword-related-queries.handler.js';
import { SelectKeywordRelatedQueriesHandler } from './use-cases/select-keyword-related-queries/select-keyword-related-queries.handler.js';
import { SelectSeoBriefClustersHandler } from './use-cases/select-seo-brief-clusters/select-seo-brief-clusters.handler.js';
import { SynthesizeOnPageHandler } from './use-cases/synthesize-onpage/synthesize-onpage.handler.js';
import { UpdateFinalSeoBriefHandler } from './use-cases/update-final-seo-brief/update-final-seo-brief.handler.js';

@Module({
  imports: [CqrsModule],
  providers: [
    AggregateSerpDomainsHandler,
    BuildCompetitorKeywordMapHandler,
    BuildDirtyKeywordPoolHandler,
    ClassifySerpDomainsHandler,
    CleanupLongreadArticleHandler,
    ClusterKeywordCandidatesHandler,
    ContinueSeoBriefRunHandler,
    CreateSeoBriefRunHandler,
    ExtractSerpDerivedCandidatesHandler,
    FetchFirstKeywordSerpPreviewHandler,
    FetchKeywordSerpPreviewsHandler,
    FetchRankedKeywordsHandler,
    FetchSelectedClusterOnPageHandler,
    GenerateFinalSeoBriefHandler,
    GenerateKeywordHypothesesHandler,
    GenerateLongreadDraftHandler,
    GenerateUserPainScenariosHandler,
    GetSeoBriefRunHandler,
    ListSeoBriefRunsHandler,
    MarkSeoBriefRunManualReviewHandler,
    MatchCompetitorKeywordsHandler,
    PackageLongreadArticleHandler,
    ProcessSeoBriefRunExecutor,
    RegenerateSeoBriefHandler,
    RejectSeoBriefRunHandler,
    ReviewClusterProductFitHandler,
    RerunSeoBriefRunHandler,
    RerunSeoBriefStageHandler,
    ScoreKeywordCandidatesHandler,
    SelectFirstKeywordRelatedQueriesHandler,
    SelectKeywordRelatedQueriesHandler,
    SelectSeoBriefClustersHandler,
    SynthesizeOnPageHandler,
    UpdateFinalSeoBriefHandler,
    SeoBriefExternalCallLoggerService,
    SeoBriefLlmLoggerService,
    SeoBriefRunControlService,
    SeoBriefScoreLoggerService,
  ],
  exports: [
    SeoBriefExternalCallLoggerService,
    SeoBriefLlmLoggerService,
    ProcessSeoBriefRunExecutor,
    SeoBriefRunControlService,
    SeoBriefScoreLoggerService,
  ],
})
export class SeoBriefingModule {}
