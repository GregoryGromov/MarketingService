import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SeoBriefExternalCallLoggerService } from './services/seo-brief-external-call-logger.service.js';
import { SeoBriefLlmLoggerService } from './services/seo-brief-llm-logger.service.js';
import { SeoBriefRunControlService } from './services/seo-brief-run-control.service.js';
import { SeoBriefScoreLoggerService } from './services/seo-brief-score-logger.service.js';
import { ContinueSeoBriefRunHandler } from './use-cases/continue-seo-brief-run/continue-seo-brief-run.handler.js';
import { CreateSeoBriefRunHandler } from './use-cases/create-seo-brief-run/create-seo-brief-run.handler.js';
import { FetchFirstKeywordSerpPreviewHandler } from './use-cases/fetch-first-keyword-serp-preview/fetch-first-keyword-serp-preview.handler.js';
import { FetchKeywordSerpPreviewsHandler } from './use-cases/fetch-keyword-serp-previews/fetch-keyword-serp-previews.handler.js';
import { GetSeoBriefRunHandler } from './use-cases/get-seo-brief-run/get-seo-brief-run.handler.js';
import { ListSeoBriefRunsHandler } from './use-cases/list-seo-brief-runs/list-seo-brief-runs.handler.js';
import { MarkSeoBriefRunManualReviewHandler } from './use-cases/mark-seo-brief-run-manual-review/mark-seo-brief-run-manual-review.handler.js';
import { ProcessSeoBriefRunExecutor } from './use-cases/process-seo-brief-run/process-seo-brief-run.executor.js';
import { RegenerateSeoBriefHandler } from './use-cases/regenerate-seo-brief/regenerate-seo-brief.handler.js';
import { RejectSeoBriefRunHandler } from './use-cases/reject-seo-brief-run/reject-seo-brief-run.handler.js';
import { RerunSeoBriefRunHandler } from './use-cases/rerun-seo-brief-run/rerun-seo-brief-run.handler.js';
import { RerunSeoBriefStageHandler } from './use-cases/rerun-seo-brief-stage/rerun-seo-brief-stage.handler.js';
import { SelectFirstKeywordRelatedQueriesHandler } from './use-cases/select-first-keyword-related-queries/select-first-keyword-related-queries.handler.js';
import { SelectKeywordRelatedQueriesHandler } from './use-cases/select-keyword-related-queries/select-keyword-related-queries.handler.js';

@Module({
  imports: [CqrsModule],
  providers: [
    ContinueSeoBriefRunHandler,
    CreateSeoBriefRunHandler,
    FetchFirstKeywordSerpPreviewHandler,
    FetchKeywordSerpPreviewsHandler,
    GetSeoBriefRunHandler,
    ListSeoBriefRunsHandler,
    MarkSeoBriefRunManualReviewHandler,
    ProcessSeoBriefRunExecutor,
    RegenerateSeoBriefHandler,
    RejectSeoBriefRunHandler,
    RerunSeoBriefRunHandler,
    RerunSeoBriefStageHandler,
    SelectFirstKeywordRelatedQueriesHandler,
    SelectKeywordRelatedQueriesHandler,
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
