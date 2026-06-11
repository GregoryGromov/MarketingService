import {
  type BuildProductBridgeParams,
  type BuildProductBridgeResult,
  type CleanupLongreadArticleParams,
  type CleanupLongreadArticleResult,
  type ClassifySerpDomainsParams,
  type ClassifySerpDomainsResult,
  type ClusterKeywordsParams,
  type ClusterKeywordsResult,
  type CompleteSeoBriefLlmCallLogParams,
  type DraftLongreadArticleParams,
  type DraftLongreadArticleResult,
  type EvaluateCompetitorKeywordMatchesParams,
  type EvaluateCompetitorKeywordMatchesResult,
  type ExpandKeywordsParams,
  type ExpandKeywordsResult,
  type ExplainClusterSelectionParams,
  type ExplainClusterSelectionResult,
  type ExtractedSeoBriefContext,
  type ExtractSeoBriefContextParams,
  type ExtractUserPainScenariosParams,
  type ExtractUserPainScenariosResult,
  type FailSeoBriefLlmCallLogParams,
  type GenerateSeoBriefParams,
  type GenerateSeoBriefResult,
  type GroupCandidateKeywordsParams,
  type GroupCandidateKeywordsResult,
  type GroupCompetitorKeywordEvidenceParams,
  type GroupCompetitorKeywordEvidenceResult,
  type MatchKeywordGroupsParams,
  type MatchKeywordGroupsResult,
  type PackageLongreadArticleParams,
  type PackageLongreadArticleResult,
  type ReviewClusterProductFitParams,
  type ReviewClusterProductFitResult,
  type ScoreCompetitorKeywordCandidateGroupParams,
  type ScoreCompetitorKeywordCandidateGroupResult,
  type ScoreDirtyKeywordCandidatesParams,
  type ScoreDirtyKeywordCandidatesResult,
  type SelectRelatedKeywordsParams,
  type SelectRelatedKeywordsResult,
  type SeoBriefAiModelMode,
  SeoBriefAiTransportError,
  SeoBriefAiValidationError,
  type SeoBriefJsonValue,
  SeoBriefLlmCallLog,
  SeoBriefLlmLogRepository,
  type StartSeoBriefLlmCallLogParams,
  type SynthesizeOnPageParams,
  type SynthesizeOnPageResult,
  type TriageKeywordsParams,
  type TriageKeywordsResult,
} from '@marketing-service/seo-briefing';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  buildClusterKeywordsPrompt,
  buildClassifySerpDomainsPrompt,
  buildCleanupLongreadArticlePrompt,
  buildDraftLongreadArticlePrompt,
  buildEvaluateCompetitorKeywordMatchesPrompt,
  buildExpandKeywordsPrompt,
  buildExplainClusterSelectionPrompt,
  buildExtractContextPrompt,
  buildExtractUserPainScenariosPrompt,
  buildGenerateSeoBriefPrompt,
  buildGroupCandidateKeywordsPrompt,
  buildGroupCompetitorKeywordEvidencePrompt,
  buildMatchKeywordGroupsPrompt,
  buildPackageLongreadArticlePrompt,
  buildProductBridgePrompt,
  buildReviewClusterProductFitPrompt,
  buildScoreCompetitorKeywordCandidateGroupPrompt,
  buildScoreDirtyKeywordCandidatesPrompt,
  buildSelectRelatedKeywordsPrompt,
  buildSynthesizeOnPagePrompt,
  buildTriageKeywordsPrompt,
} from './deepseek-seo-brief-ai.prompts.js';
import {
  validateBuildProductBridgeResult,
  validateClassifySerpDomainsResult,
  validateCleanupLongreadArticleResult,
  validateClusterKeywordsResult,
  validateDraftLongreadArticleResult,
  validateEvaluateCompetitorKeywordMatchesResult,
  validateExpandKeywordsResult,
  validateExplainClusterSelectionResult,
  validateExtractContextResult,
  validateExtractUserPainScenariosResult,
  validateGenerateSeoBriefResult,
  validateGroupCandidateKeywordsResult,
  validateGroupCompetitorKeywordEvidenceResult,
  validateMatchKeywordGroupsResult,
  validatePackageLongreadArticleResult,
  validateReviewClusterProductFitResult,
  validateScoreCompetitorKeywordCandidateGroupResult,
  validateScoreDirtyKeywordCandidatesResult,
  validateSelectRelatedKeywordsResult,
  validateSynthesizeOnPageResult,
  validateTriageKeywordsResult,
} from './deepseek-seo-brief-ai.validators.js';
import {
  type SeoBriefAiCompletionRequest,
  SeoBriefAiHttpClientPort,
  type SeoBriefAiReasoningEffort,
  type SeoBriefAiThinkingType,
} from './seo-brief-ai-http-client.port.js';

interface SeoBriefStructuredPrompt {
  operation: string;
  promptVersion: string;
  temperature: number;
  systemPrompt: string;
  userPrompt: string;
}

@Injectable()
export class DeepSeekSeoBriefAiAdapter {
  private readonly logger = new Logger(DeepSeekSeoBriefAiAdapter.name);

  constructor(
    @Inject(ConfigService)
    private readonly config: ConfigService,
    @Inject(SeoBriefAiHttpClientPort)
    private readonly httpClient: SeoBriefAiHttpClientPort,
    @Inject(SeoBriefLlmLogRepository)
    private readonly llmLogRepository: SeoBriefLlmLogRepository,
  ) {}

  async extractContext(params: ExtractSeoBriefContextParams): Promise<ExtractedSeoBriefContext> {
    const prompt = buildExtractContextPrompt(params);
    const modelMode = params.modelMode ?? null;
    const model = this.getModel(modelMode);
    const completionRequest = this.createCompletionRequest(
      model,
      modelMode,
      prompt,
      prompt.userPrompt,
      params.timeoutMs,
    );
    const response = await this.executeWithRetry(prompt.operation, () =>
      this.httpClient.requestCompletion(completionRequest),
    );
    const jsonPayload = this.parseJsonPayload(
      response.content,
      prompt.operation,
      response.rawPayload,
    );
    return validateExtractContextResult(jsonPayload, prompt.operation);
  }

  async expandKeywords(params: ExpandKeywordsParams): Promise<ExpandKeywordsResult> {
    return this.runStructuredOperation(
      buildExpandKeywordsPrompt(params),
      params,
      validateExpandKeywordsResult,
    );
  }

  async extractUserPainScenarios(
    params: ExtractUserPainScenariosParams,
  ): Promise<ExtractUserPainScenariosResult> {
    return this.runStructuredOperation(
      buildExtractUserPainScenariosPrompt(params),
      params,
      validateExtractUserPainScenariosResult,
    );
  }

  async triageKeywords(params: TriageKeywordsParams): Promise<TriageKeywordsResult> {
    return this.runStructuredOperation(
      buildTriageKeywordsPrompt(params),
      params,
      validateTriageKeywordsResult,
    );
  }

  async clusterKeywords(params: ClusterKeywordsParams): Promise<ClusterKeywordsResult> {
    return this.runStructuredOperation(
      buildClusterKeywordsPrompt(params),
      params,
      validateClusterKeywordsResult,
    );
  }

  async selectRelatedKeywords(
    params: SelectRelatedKeywordsParams,
  ): Promise<SelectRelatedKeywordsResult> {
    return this.runStructuredOperation(
      buildSelectRelatedKeywordsPrompt(params),
      params,
      validateSelectRelatedKeywordsResult,
    );
  }

  async classifySerpDomains(
    params: ClassifySerpDomainsParams,
  ): Promise<ClassifySerpDomainsResult> {
    return this.runStructuredOperation(
      buildClassifySerpDomainsPrompt(params),
      params,
      validateClassifySerpDomainsResult,
    );
  }

  async scoreDirtyKeywordCandidates(
    params: ScoreDirtyKeywordCandidatesParams,
  ): Promise<ScoreDirtyKeywordCandidatesResult> {
    return this.runStructuredOperation(
      buildScoreDirtyKeywordCandidatesPrompt(params),
      params,
      validateScoreDirtyKeywordCandidatesResult,
    );
  }

  async evaluateCompetitorKeywordMatches(
    params: EvaluateCompetitorKeywordMatchesParams,
  ): Promise<EvaluateCompetitorKeywordMatchesResult> {
    return this.runStructuredOperation(
      buildEvaluateCompetitorKeywordMatchesPrompt(params),
      params,
      validateEvaluateCompetitorKeywordMatchesResult,
    );
  }

  async groupCompetitorKeywordEvidence(
    params: GroupCompetitorKeywordEvidenceParams,
  ): Promise<GroupCompetitorKeywordEvidenceResult> {
    return this.runStructuredOperation(
      buildGroupCompetitorKeywordEvidencePrompt(params),
      params,
      validateGroupCompetitorKeywordEvidenceResult,
    );
  }

  async groupCandidateKeywords(
    params: GroupCandidateKeywordsParams,
  ): Promise<GroupCandidateKeywordsResult> {
    return this.runStructuredOperation(
      buildGroupCandidateKeywordsPrompt(params),
      params,
      validateGroupCandidateKeywordsResult,
    );
  }

  async matchKeywordGroups(params: MatchKeywordGroupsParams): Promise<MatchKeywordGroupsResult> {
    return this.runStructuredOperation(
      buildMatchKeywordGroupsPrompt(params),
      params,
      validateMatchKeywordGroupsResult,
    );
  }

  async scoreCompetitorKeywordCandidateGroup(
    params: ScoreCompetitorKeywordCandidateGroupParams,
  ): Promise<ScoreCompetitorKeywordCandidateGroupResult> {
    return this.runStructuredOperation(
      buildScoreCompetitorKeywordCandidateGroupPrompt(params),
      params,
      validateScoreCompetitorKeywordCandidateGroupResult,
    );
  }

  async buildProductBridge(params: BuildProductBridgeParams): Promise<BuildProductBridgeResult> {
    return this.runStructuredOperation(
      buildProductBridgePrompt(params),
      params,
      validateBuildProductBridgeResult,
    );
  }

  async reviewClusterProductFit(
    params: ReviewClusterProductFitParams,
  ): Promise<ReviewClusterProductFitResult> {
    return this.runStructuredOperation(
      buildReviewClusterProductFitPrompt(params),
      params,
      validateReviewClusterProductFitResult,
    );
  }

  async explainClusterSelection(
    params: ExplainClusterSelectionParams,
  ): Promise<ExplainClusterSelectionResult> {
    return this.runStructuredOperation(
      buildExplainClusterSelectionPrompt(params),
      params,
      validateExplainClusterSelectionResult,
    );
  }

  async synthesizeOnPage(params: SynthesizeOnPageParams): Promise<SynthesizeOnPageResult> {
    return this.runStructuredOperation(
      buildSynthesizeOnPagePrompt(params),
      params,
      validateSynthesizeOnPageResult,
    );
  }

  async generateSeoBrief(params: GenerateSeoBriefParams): Promise<GenerateSeoBriefResult> {
    return this.runStructuredOperation(
      buildGenerateSeoBriefPrompt(params),
      params,
      validateGenerateSeoBriefResult,
    );
  }

  async draftLongreadArticle(
    params: DraftLongreadArticleParams,
  ): Promise<DraftLongreadArticleResult> {
    return this.runStructuredOperation(
      buildDraftLongreadArticlePrompt(params),
      params,
      validateDraftLongreadArticleResult,
    );
  }

  async cleanupLongreadArticle(
    params: CleanupLongreadArticleParams,
  ): Promise<CleanupLongreadArticleResult> {
    return this.runStructuredOperation(
      buildCleanupLongreadArticlePrompt(params),
      params,
      validateCleanupLongreadArticleResult,
    );
  }

  async packageLongreadArticle(
    params: PackageLongreadArticleParams,
  ): Promise<PackageLongreadArticleResult> {
    return this.runStructuredOperation(
      buildPackageLongreadArticlePrompt(params),
      params,
      validatePackageLongreadArticleResult,
    );
  }

  private async runStructuredOperation<
    TParams extends {
      runId: string;
      stepId?: string | null;
      modelMode?: SeoBriefAiModelMode | null;
      timeoutMs?: number | null;
    },
    TResult,
  >(
    prompt: SeoBriefStructuredPrompt,
    params: TParams,
    validator: (payload: unknown, operation: string) => TResult,
  ): Promise<TResult> {
    const modelMode = params.modelMode ?? null;
    const model = this.getModel(modelMode);
    const maxRepairAttempts = this.getStructuredRepairAttempts();
    let repairAttempt = 0;
    let userPrompt = prompt.userPrompt;

    while (repairAttempt <= maxRepairAttempts) {
      const completionRequest = this.createCompletionRequest(
        model,
        modelMode,
        prompt,
        userPrompt,
        params.timeoutMs,
      );
      const requestPayload = this.createRequestLogPayload(
        prompt,
        completionRequest,
        repairAttempt,
        modelMode,
      );
      const log = await this.startLog({
        runId: params.runId as never,
        stepId: (params.stepId ?? null) as never,
        operation: prompt.operation,
        model,
        promptVersion: prompt.promptVersion,
        requestPayload,
      });

      try {
        const response = await this.executeWithRetry(prompt.operation, () =>
          this.httpClient.requestCompletion(completionRequest),
        );

        try {
          const jsonPayload = this.parseJsonPayload(
            response.content,
            prompt.operation,
            response.rawPayload,
          );
          const result = validator(jsonPayload, prompt.operation);

          await this.completeLog(log.id, {
            responsePayload: {
              providerResponse: response.rawPayload,
              structuredResponse: result as SeoBriefJsonValue,
            },
            tokenUsageInput: response.tokenUsageInput,
            tokenUsageOutput: response.tokenUsageOutput,
            estimatedCost: response.estimatedCost,
          });

          return result;
        } catch (error) {
          await this.failLog(log.id, {
            errorMessage: this.describeError(error),
            responsePayload: response.rawPayload,
            tokenUsageInput: response.tokenUsageInput,
            tokenUsageOutput: response.tokenUsageOutput,
            estimatedCost: response.estimatedCost,
          });

          if (error instanceof SeoBriefAiValidationError && repairAttempt < maxRepairAttempts) {
            repairAttempt += 1;
            userPrompt = this.buildRepairPrompt(prompt.userPrompt, response.content, error.message);
            continue;
          }

          throw error;
        }
      } catch (error) {
        if (!(error instanceof SeoBriefAiValidationError)) {
          await this.failLog(log.id, {
            errorMessage: this.describeError(error),
            responsePayload:
              error instanceof SeoBriefAiTransportError ? error.responsePayload : null,
            estimatedCost: null,
            tokenUsageInput: null,
            tokenUsageOutput: null,
          });
        }

        throw error;
      }
    }

    throw new SeoBriefAiValidationError(
      `${prompt.operation} exhausted structured repair attempts`,
      prompt.operation,
      'deepseek',
    );
  }

  private createCompletionRequest(
    model: string,
    modelMode: SeoBriefAiModelMode | null,
    prompt: SeoBriefStructuredPrompt,
    userPrompt: string,
    timeoutMs?: number | null,
  ): SeoBriefAiCompletionRequest {
    const thinkingType = this.getThinkingType(modelMode);

    return {
      model,
      systemPrompt: prompt.systemPrompt,
      userPrompt,
      timeoutMs: this.getTimeoutMs(timeoutMs),
      thinkingType,
      reasoningEffort: thinkingType === 'enabled' ? this.getReasoningEffort() : undefined,
      temperature: thinkingType === 'disabled' ? prompt.temperature : undefined,
    };
  }

  private createRequestLogPayload(
    prompt: SeoBriefStructuredPrompt,
    request: SeoBriefAiCompletionRequest,
    repairAttempt: number,
    modelMode: SeoBriefAiModelMode | null,
  ): SeoBriefJsonValue {
    return {
      ...request,
      modelMode,
      promptVersion: prompt.promptVersion,
      repairAttempt,
    };
  }

  private parseJsonPayload(
    rawContent: string,
    operation: string,
    rawPayload: SeoBriefJsonValue,
  ): unknown {
    const normalized = rawContent
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    try {
      return JSON.parse(normalized) as unknown;
    } catch {
      throw new SeoBriefAiValidationError(
        `${operation} returned invalid JSON`,
        operation,
        'deepseek',
        rawPayload,
      );
    }
  }

  private async executeWithRetry<T>(operation: string, callback: () => Promise<T>): Promise<T> {
    const maxAttempts = this.getMaxAttempts();
    const retryDelayMs = this.getRetryDelayMs();

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await callback();
      } catch (error) {
        const retryable = this.isRetryableError(error);
        if (attempt < maxAttempts && retryable) {
          this.logger.warn(
            `${operation} failed on attempt ${attempt}/${maxAttempts}: ${this.describeError(error)}. Retrying in ${retryDelayMs}ms`,
          );
          await this.delay(retryDelayMs);
          continue;
        }

        throw error;
      }
    }

    throw new SeoBriefAiTransportError(
      `${operation} failed after exhausting retry policy`,
      operation,
      'deepseek',
      null,
    );
  }

  private isRetryableError(error: unknown): boolean {
    return (
      error instanceof SeoBriefAiTransportError &&
      (error.status == null || error.status >= 500 || error.status === 429)
    );
  }

  private buildRepairPrompt(
    originalUserPrompt: string,
    invalidResponse: string,
    reason: string,
  ): string {
    return [
      originalUserPrompt,
      '',
      'Previous response was invalid.',
      `Validation error: ${reason}`,
      'Return only valid JSON that matches the required schema exactly.',
      'Do not include markdown, commentary, or code fences.',
      'Previous invalid response:',
      invalidResponse,
    ].join('\n');
  }

  private getModel(modelMode: SeoBriefAiModelMode | null): string {
    if (modelMode === 'flash') {
      return (
        this.config.get<string>('SEO_BRIEF_AI_FLASH_MODEL')?.trim() ||
        this.config.get<string>('DEEPSEEK_FLASH_MODEL')?.trim() ||
        'deepseek-v4-flash'
      );
    }

    if (modelMode === 'pro' || modelMode === 'pro_thinking') {
      return (
        this.config.get<string>('SEO_BRIEF_AI_PRO_MODEL')?.trim() ||
        this.config.get<string>('DEEPSEEK_ADAPTATION_MODEL')?.trim() ||
        this.config.get<string>('SEO_BRIEF_AI_MODEL')?.trim() ||
        'deepseek-v4-pro'
      );
    }

    return (
      this.config.get<string>('SEO_BRIEF_AI_MODEL')?.trim() ||
      this.config.get<string>('DEEPSEEK_MODEL')?.trim() ||
      'deepseek-v4-pro'
    );
  }

  private getThinkingType(modelMode: SeoBriefAiModelMode | null): SeoBriefAiThinkingType {
    if (modelMode === 'flash' || modelMode === 'pro') {
      return 'disabled';
    }

    if (modelMode === 'pro_thinking') {
      return 'enabled';
    }

    const rawValue =
      this.config.get<string>('SEO_BRIEF_AI_THINKING_TYPE')?.trim().toLowerCase() ||
      this.config.get<string>('DEEPSEEK_THINKING_TYPE')?.trim().toLowerCase() ||
      'enabled';

    return rawValue === 'disabled' ? 'disabled' : 'enabled';
  }

  private getReasoningEffort(): SeoBriefAiReasoningEffort {
    const rawValue =
      this.config.get<string>('SEO_BRIEF_AI_REASONING_EFFORT')?.trim().toLowerCase() ||
      this.config.get<string>('DEEPSEEK_REASONING_EFFORT')?.trim().toLowerCase() ||
      'high';

    return rawValue === 'max' ? 'max' : 'high';
  }

  private getTimeoutMs(timeoutMs?: number | null): number {
    if (timeoutMs != null && Number.isFinite(timeoutMs)) {
      return Math.max(1000, Math.trunc(timeoutMs));
    }

    return this.getPositiveIntegerConfig('SEO_BRIEF_AI_TIMEOUT_MS', 300_000);
  }

  private getMaxAttempts(): number {
    return this.getPositiveIntegerConfig(
      'SEO_BRIEF_AI_MAX_ATTEMPTS',
      this.getPositiveIntegerConfig('AI_GATEWAY_MAX_ATTEMPTS', 2),
    );
  }

  private getRetryDelayMs(): number {
    return this.getPositiveIntegerConfig(
      'SEO_BRIEF_AI_RETRY_DELAY_MS',
      this.getPositiveIntegerConfig('AI_GATEWAY_RETRY_DELAY_MS', 250),
    );
  }

  private getStructuredRepairAttempts(): number {
    return this.getPositiveIntegerConfig('SEO_BRIEF_AI_STRUCTURED_REPAIR_ATTEMPTS', 1);
  }

  private getPositiveIntegerConfig(key: string, fallback: number): number {
    const rawValue = this.config.get<string>(key);
    if (!rawValue) {
      return fallback;
    }

    const parsed = Number.parseInt(rawValue, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  }

  private describeError(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown SEO brief AI error';
  }

  private async startLog(params: StartSeoBriefLlmCallLogParams): Promise<SeoBriefLlmCallLog> {
    const log = SeoBriefLlmCallLog.start(params);
    await this.llmLogRepository.save(log);
    return log;
  }

  private async completeLog(
    logId: SeoBriefLlmCallLog['id'],
    params: CompleteSeoBriefLlmCallLogParams,
  ): Promise<void> {
    const log = await this.llmLogRepository.findById(logId);
    if (!log) {
      throw new Error(`SEO brief LLM call log not found: ${logId}`);
    }

    log.complete(params);
    await this.llmLogRepository.save(log);
  }

  private async failLog(
    logId: SeoBriefLlmCallLog['id'],
    params: FailSeoBriefLlmCallLogParams,
  ): Promise<void> {
    const log = await this.llmLogRepository.findById(logId);
    if (!log || log.status !== 'running') {
      return;
    }

    log.fail(params);
    await this.llmLogRepository.save(log);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
