import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AiGatewayPort,
  type AiGatewayQualityOutcome,
  type AiGatewayReason,
  type AiGatewaySeverity,
  type AiGatewaySourceValidationOutcome,
  type AiGatewaySuggestedFix,
  type AiQualityCheckResult,
  type BrandMemory,
  type CheckAdaptationQualityParams,
  type CheckTranslationFidelityParams,
  describePublicationTypeForChannel,
  type GenerateAdaptationAiParams,
  type GenerateTranslationAiParams,
  type ReviseAdaptationAiParams,
  type ReviseTranslationAiParams,
  type ValidateSourceLongreadParams,
  type ValidateSourceLongreadResult,
} from '@marketing-service/project-management';

interface DeepSeekChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
      reasoning_content?: string | null;
    };
  }>;
  error?: {
    message?: string;
  };
}

class AiGatewayConfigurationError extends Error {}

class AiGatewayTransportError extends Error {
  constructor(
    message: string,
    public readonly status: number | null,
  ) {
    super(message);
  }
}

class AiGatewayValidationError extends Error {}

type StructuredResultParser<TResult> = (payload: unknown) => TResult;
type DeepSeekThinkingType = 'enabled' | 'disabled';

interface DeepSeekCompletionOptions {
  model?: string;
  thinkingType?: DeepSeekThinkingType;
  reasoningEffort?: 'high' | 'max';
}

const SOURCE_VALIDATION_OUTCOMES = ['passed', 'needs_review', 'blocked'] as const;
const QUALITY_CHECK_OUTCOMES = ['passed', 'warning', 'failed', 'blocked'] as const;
const REASON_SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;

@Injectable()
export class DeepSeekAiGateway extends AiGatewayPort {
  private readonly logger = new Logger(DeepSeekAiGateway.name);

  constructor(private readonly config: ConfigService) {
    super();
  }

  async validateSourceLongread(
    params: ValidateSourceLongreadParams,
  ): Promise<ValidateSourceLongreadResult> {
    return this.runStructuredOperation(
      'validateSourceLongread',
      this.buildSourceValidationSystemPrompt(params),
      this.buildSourceValidationUserPrompt(params),
      0.1,
      (payload) => this.parseSourceValidationResult(payload),
    );
  }

  async generateAdaptation(params: GenerateAdaptationAiParams): Promise<{ content: string }> {
    return this.runTextOperation(
      'generateAdaptation',
      this.buildAdaptationSystemPrompt(params),
      this.buildAdaptationUserPrompt(params),
      0.7,
    );
  }

  async reviseAdaptation(params: ReviseAdaptationAiParams): Promise<{ content: string }> {
    return this.runTextOperation(
      'reviseAdaptation',
      this.buildAdaptationRevisionSystemPrompt(params),
      this.buildAdaptationRevisionUserPrompt(params),
      0.4,
    );
  }

  async generateTranslation(params: GenerateTranslationAiParams): Promise<{ content: string }> {
    return this.runTextOperation(
      'generateTranslation',
      this.buildTranslationSystemPrompt(params),
      this.buildTranslationUserPrompt(params),
      0.4,
    );
  }

  async reviseTranslation(params: ReviseTranslationAiParams): Promise<{ content: string }> {
    return this.runTextOperation(
      'reviseTranslation',
      this.buildTranslationRevisionSystemPrompt(params),
      this.buildTranslationRevisionUserPrompt(params),
      0.3,
    );
  }

  async checkAdaptationQuality(
    params: CheckAdaptationQualityParams,
  ): Promise<AiQualityCheckResult> {
    return this.runStructuredOperation(
      'checkAdaptationQuality',
      this.buildAdaptationQualitySystemPrompt(params),
      this.buildAdaptationQualityUserPrompt(params),
      0.1,
      (payload) => this.parseQualityCheckResult(payload),
    );
  }

  async checkTranslationFidelity(
    params: CheckTranslationFidelityParams,
  ): Promise<AiQualityCheckResult> {
    return this.runStructuredOperation(
      'checkTranslationFidelity',
      this.buildTranslationFidelitySystemPrompt(params),
      this.buildTranslationFidelityUserPrompt(params),
      0.1,
      (payload) => this.parseQualityCheckResult(payload),
    );
  }

  private async runTextOperation(
    operationName: string,
    systemPrompt: string,
    userPrompt: string,
    temperature: number,
  ): Promise<{ content: string }> {
    return this.executeWithRetry(operationName, async () => {
      const content = this.parseTextResult(
        await this.requestCompletion(systemPrompt, userPrompt, temperature, {
          model: this.resolveAdaptationModel(),
          thinkingType: this.resolveAdaptationThinkingType(),
          reasoningEffort: this.resolveAdaptationReasoningEffort(),
        }),
      );

      return { content };
    });
  }

  private async runStructuredOperation<TResult>(
    operationName: string,
    systemPrompt: string,
    userPrompt: string,
    temperature: number,
    parser: StructuredResultParser<TResult>,
  ): Promise<TResult> {
    return this.executeWithRetry(operationName, async () => {
      const rawContent = await this.requestCompletion(systemPrompt, userPrompt, temperature);
      const payload = this.parseJsonPayload(rawContent, operationName);
      return parser(payload);
    });
  }

  private async executeWithRetry<T>(
    operationName: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    const maxAttempts = Math.max(
      1,
      Number.parseInt(this.config.get<string>('AI_GATEWAY_MAX_ATTEMPTS') ?? '3', 10),
    );
    const retryDelayMs = Math.max(
      0,
      Number.parseInt(this.config.get<string>('AI_GATEWAY_RETRY_DELAY_MS') ?? '250', 10),
    );

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const startedAt = Date.now();

      try {
        const result = await operation();
        this.logger.log(
          `${operationName} succeeded on attempt ${attempt}/${maxAttempts} in ${Date.now() - startedAt}ms`,
        );
        return result;
      } catch (error) {
        const message = this.describeError(error);
        const retryable = this.isRetryableError(error);

        if (attempt < maxAttempts && retryable) {
          this.logger.warn(
            `${operationName} failed on attempt ${attempt}/${maxAttempts}: ${message}. Retrying in ${retryDelayMs}ms`,
          );
          await this.delay(retryDelayMs);
          continue;
        }

        this.logger.error(
          `${operationName} failed on attempt ${attempt}/${maxAttempts}: ${message}`,
        );
        throw error;
      }
    }

    throw new Error(`${operationName} failed after exhausting retry policy`);
  }

  private async requestCompletion(
    systemPrompt: string,
    userPrompt: string,
    temperature: number,
    options: DeepSeekCompletionOptions = {},
  ): Promise<string> {
    const baseUrl = this.config.get<string>('DEEPSEEK_BASE_URL') ?? 'https://api.deepseek.com';
    const apiKey = this.config.get<string>('DEEPSEEK_API_KEY');
    const model =
      options.model?.trim() ||
      this.config.get<string>('DEEPSEEK_MODEL')?.trim() ||
      'deepseek-v4-flash';
    const thinkingType = options.thinkingType ?? 'disabled';

    if (!apiKey) {
      throw new AiGatewayConfigurationError('DEEPSEEK_API_KEY is not configured');
    }

    const body: Record<string, unknown> = {
      model,
      thinking: { type: thinkingType },
      stream: false,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    };

    if (thinkingType === 'enabled') {
      body.reasoning_effort = options.reasoningEffort ?? 'max';
    } else {
      body.temperature = temperature;
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const payload = (await response.json()) as DeepSeekChatCompletionResponse;

    if (!response.ok) {
      throw new AiGatewayTransportError(
        payload.error?.message ?? `DeepSeek request failed with ${response.status}`,
        response.status,
      );
    }

    const content = payload.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new AiGatewayValidationError('DeepSeek returned empty content');
    }

    return content;
  }

  private resolveAdaptationModel(): string {
    return (
      this.config.get<string>('DEEPSEEK_ADAPTATION_MODEL')?.trim() ||
      this.config.get<string>('DEEPSEEK_CONTENT_MODEL')?.trim() ||
      'deepseek-v4-pro'
    );
  }

  private resolveAdaptationThinkingType(): DeepSeekThinkingType {
    const value = (
      this.config.get<string>('DEEPSEEK_ADAPTATION_THINKING') ??
      this.config.get<string>('DEEPSEEK_CONTENT_THINKING') ??
      'enabled'
    )
      .trim()
      .toLowerCase();

    return value === 'disabled' ? 'disabled' : 'enabled';
  }

  private resolveAdaptationReasoningEffort(): 'high' | 'max' {
    const value = (
      this.config.get<string>('DEEPSEEK_ADAPTATION_REASONING_EFFORT') ??
      this.config.get<string>('DEEPSEEK_CONTENT_REASONING_EFFORT') ??
      'max'
    )
      .trim()
      .toLowerCase();

    return value === 'high' ? 'high' : 'max';
  }

  private parseTextResult(rawContent: string): string {
    const content = rawContent.trim();
    if (!content) {
      throw new AiGatewayValidationError('AI gateway expected non-empty text content');
    }

    return content;
  }

  private parseJsonPayload(rawContent: string, operationName: string): unknown {
    const candidate = this.extractJsonCandidate(rawContent);

    try {
      return JSON.parse(candidate);
    } catch {
      throw new AiGatewayValidationError(
        `${operationName} returned invalid JSON: ${candidate.slice(0, 300)}`,
      );
    }
  }

  private extractJsonCandidate(rawContent: string): string {
    const trimmed = rawContent.trim();
    const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);

    if (fencedMatch?.[1]) {
      return fencedMatch[1].trim();
    }

    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return trimmed.slice(firstBrace, lastBrace + 1).trim();
    }

    return trimmed;
  }

  private parseSourceValidationResult(payload: unknown): ValidateSourceLongreadResult {
    const record = this.ensureRecord(payload, 'source validation result');

    return {
      outcome: this.readPicklist(
        record,
        'outcome',
        SOURCE_VALIDATION_OUTCOMES,
        'source validation result',
      ),
      summary: this.readNonEmptyString(record, 'summary', 'source validation result'),
      reasons: this.readReasons(record, 'source validation result'),
      suggestedFix: this.readSuggestedFix(record, 'source validation result'),
    };
  }

  private parseQualityCheckResult(payload: unknown): AiQualityCheckResult {
    const record = this.ensureRecord(payload, 'quality check result');

    return {
      outcome: this.readPicklist(record, 'outcome', QUALITY_CHECK_OUTCOMES, 'quality check result'),
      summary: this.readNonEmptyString(record, 'summary', 'quality check result'),
      reasons: this.readReasons(record, 'quality check result'),
      suggestedFix: this.readSuggestedFix(record, 'quality check result'),
    };
  }

  private readReasons(record: Record<string, unknown>, context: string): AiGatewayReason[] {
    const rawReasons = record.reasons;

    if (!Array.isArray(rawReasons)) {
      throw new AiGatewayValidationError(`${context} must include a reasons array`);
    }

    return rawReasons.map((item, index) => {
      const reason = this.ensureRecord(item, `${context}.reasons[${index}]`);

      return {
        code: this.readNonEmptyString(reason, 'code', `${context}.reasons[${index}]`),
        severity: this.readPicklist(
          reason,
          'severity',
          REASON_SEVERITIES,
          `${context}.reasons[${index}]`,
        ),
        message: this.readNonEmptyString(reason, 'message', `${context}.reasons[${index}]`),
        excerpt: this.readNullableString(reason, 'excerpt', `${context}.reasons[${index}]`),
        suggestion: this.readNullableString(reason, 'suggestion', `${context}.reasons[${index}]`),
      };
    });
  }

  private readSuggestedFix(
    record: Record<string, unknown>,
    context: string,
  ): AiGatewaySuggestedFix | null {
    const rawSuggestedFix = record.suggestedFix;

    if (rawSuggestedFix === null || rawSuggestedFix === undefined) {
      return null;
    }

    const suggestedFix = this.ensureRecord(rawSuggestedFix, `${context}.suggestedFix`);
    const rawInstructions = suggestedFix.instructions;

    if (!Array.isArray(rawInstructions)) {
      throw new AiGatewayValidationError(`${context}.suggestedFix.instructions must be an array`);
    }

    return {
      summary: this.readNullableString(suggestedFix, 'summary', `${context}.suggestedFix`),
      instructions: rawInstructions.map((instruction, index) => {
        if (typeof instruction !== 'string' || instruction.trim().length === 0) {
          throw new AiGatewayValidationError(
            `${context}.suggestedFix.instructions[${index}] must be a non-empty string`,
          );
        }

        return instruction.trim();
      }),
    };
  }

  private readPicklist<TValue extends string>(
    record: Record<string, unknown>,
    key: string,
    allowedValues: readonly TValue[],
    context: string,
  ): TValue {
    const value = record[key];

    if (typeof value !== 'string') {
      throw new AiGatewayValidationError(`${context}.${key} must be a string`);
    }

    const normalized = value.trim();
    if (!allowedValues.includes(normalized as TValue)) {
      throw new AiGatewayValidationError(
        `${context}.${key} must be one of ${allowedValues.join(', ')}`,
      );
    }

    return normalized as TValue;
  }

  private readNonEmptyString(
    record: Record<string, unknown>,
    key: string,
    context: string,
  ): string {
    const value = record[key];

    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new AiGatewayValidationError(`${context}.${key} must be a non-empty string`);
    }

    return value.trim();
  }

  private readNullableString(
    record: Record<string, unknown>,
    key: string,
    context: string,
  ): string | null {
    const value = record[key];

    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value !== 'string') {
      throw new AiGatewayValidationError(`${context}.${key} must be a string or null`);
    }

    const normalized = value.trim();
    return normalized ? normalized : null;
  }

  private ensureRecord(value: unknown, context: string): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new AiGatewayValidationError(`${context} must be a JSON object`);
    }

    return value as Record<string, unknown>;
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof AiGatewayConfigurationError) {
      return false;
    }

    if (error instanceof AiGatewayTransportError) {
      return error.status === 429 || (error.status !== null && error.status >= 500);
    }

    return true;
  }

  private async delay(ms: number): Promise<void> {
    if (ms <= 0) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private describeError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return String(error);
  }

  private buildSourceValidationSystemPrompt(params: ValidateSourceLongreadParams): string {
    return [
      'You are an editorial source validation assistant.',
      'Review the source longread for brand safety, forbidden claims, unsupported claims, legal risk, clarity, and approved facts consistency.',
      'Return JSON only, with no markdown and no commentary.',
      'The JSON must have this shape:',
      '{"outcome":"passed|needs_review|blocked","summary":"string","reasons":[{"code":"string","severity":"low|medium|high|critical","message":"string","excerpt":"string|null","suggestion":"string|null"}],"suggestedFix":{"summary":"string|null","instructions":["string"]}|null}.',
      'Use "blocked" only for severe issues that should stop production.',
      'Use "needs_review" when a human should inspect or fix the source before production.',
      'Use "passed" only when the source is safe to continue.',
      this.formatBrandMemorySection(params.brandMemory),
      params.extraInstructions?.trim()
        ? `Additional source validation instructions:\n${params.extraInstructions.trim()}`
        : 'Additional source validation instructions: none.',
    ].join('\n\n');
  }

  private buildSourceValidationUserPrompt(params: ValidateSourceLongreadParams): string {
    return [
      `Source language: ${params.sourceLanguage}`,
      'Source longread:',
      params.sourceContent,
    ].join('\n\n');
  }

  private buildAdaptationSystemPrompt(params: GenerateAdaptationAiParams): string {
    const promptInstructions = params.promptInstructions?.trim();
    let basePrompt: string;

    if (promptInstructions) {
      basePrompt = [
        'You are an editorial adaptation assistant.',
        `Create a social adaptation for the channel "${params.displayName}" in the same language as the original text.`,
        'Preserve the core meaning and factual accuracy.',
        'Follow the channel-specific rules exactly.',
        'Return only the final adapted text with no commentary.',
        'Channel-specific rules:',
        promptInstructions,
      ].join(' ');
    } else if (params.channel === 'channel_telegram') {
      basePrompt = [
        'You are an editorial adaptation assistant.',
        'Rewrite the provided long-form article into a Telegram post in the same language.',
        'Preserve the core meaning and factual accuracy.',
        'Make it concise, readable, and engaging for Telegram.',
        'Return exactly 3 sentences.',
        'The output must be substantially shorter than the original article.',
        'Each sentence should carry one key idea only.',
        'Keep the final output under 900 characters so it can be used safely as a Telegram image caption.',
        'Use a strong opening hook.',
        'Keep the tone expert and clear.',
        'Use Telegram HTML tags for formatting when emphasis is needed, for example <b>important phrase</b>.',
        'Do not use Markdown formatting such as **bold** because Telegram will not render it in HTML parse mode.',
        'Do not use hashtags.',
        'Do not use emojis unless they are absolutely necessary.',
        'Do not produce bullet points or lists.',
        'Return only the final post text with no commentary.',
      ].join(' ');
    } else if (params.channel === 'channel_x') {
      basePrompt = [
        'You are an editorial adaptation assistant.',
        'Rewrite the provided long-form article into a post for X in the same language.',
        'Preserve the core meaning and factual accuracy.',
        'Return exactly 1 sentence.',
        'Use no more than 15 words.',
        'Make it sharp, compact, and readable as a social post.',
        'Do not use hashtags.',
        'Do not use emojis.',
        'Return only the final post text with no commentary.',
      ].join(' ');
    } else if (params.channel === 'channel_discord') {
      basePrompt = [
        'You are an editorial adaptation assistant.',
        'Rewrite the provided long-form article into a Discord post in the same language.',
        'Preserve the core meaning and factual accuracy.',
        'Return no more than 2 sentences.',
        'Keep the final output under 1800 characters so it fits Discord webhook content limits.',
        'Explain everything as simply as possible.',
        'Use plain words and short phrasing.',
        'Make it easy to understand immediately for a non-expert reader.',
        'Avoid jargon unless it is absolutely necessary.',
        'Do not use hashtags.',
        'Do not use emojis.',
        'Return only the final post text with no commentary.',
      ].join(' ');
    } else if (params.channel === 'channel_blog') {
      basePrompt = [
        'You are an editorial adaptation assistant.',
        'Rewrite the provided long-form article into a short blog post in the same language.',
        'Preserve the core meaning and factual accuracy.',
        'Return 2 to 4 short paragraphs.',
        'Keep the tone clear, informative, and readable.',
        'Do not use hashtags.',
        'Do not use emojis.',
        'Return only the final post text with no commentary.',
      ].join(' ');
    } else {
      basePrompt = [
        'You are an editorial adaptation assistant.',
        'Rewrite the provided article into a channel-specific social post in the same language.',
        'Preserve meaning and factual accuracy.',
        'Return only the final adapted text.',
      ].join(' ');
    }

    return [
      basePrompt,
      this.buildChannelRules(params.channel, params.promptInstructions),
      this.buildPublicationContext(params.channel, params.publicationType, params.style),
      this.formatBrandMemorySection(params.brandMemory),
      params.extraInstructions?.trim()
        ? `Extra production instructions:\n${params.extraInstructions.trim()}`
        : 'Extra production instructions: none.',
    ].join('\n\n');
  }

  private buildAdaptationUserPrompt(params: GenerateAdaptationAiParams): string {
    return [
      `Channel: ${params.displayName} (${params.channel})`,
      `Language: ${params.sourceLanguage}`,
      'Source text:',
      params.sourceContent,
    ].join('\n\n');
  }

  private buildAdaptationRevisionSystemPrompt(params: ReviseAdaptationAiParams): string {
    const promptInstructions = params.promptInstructions?.trim();
    let basePrompt: string;

    if (promptInstructions) {
      basePrompt = [
        'You are an editorial adaptation editor.',
        `You are editing a social adaptation for the channel "${params.displayName}".`,
        'You are given the full adaptation text, a selected fragment inside it, and a user instruction about what should change.',
        'Revise only what is necessary to satisfy the instruction.',
        'Keep the text in the same language and preserve the rest unless small surrounding adjustments are required for flow.',
        'Preserve the current paragraph structure and line breaks whenever possible.',
        'Keep the final text fully compliant with the channel-specific rules below.',
        'Return the complete revised text only, with no commentary or markdown.',
        'Channel-specific rules:',
        promptInstructions,
      ].join(' ');
    } else if (params.channel === 'channel_telegram') {
      basePrompt = [
        'You are an editorial adaptation editor.',
        'You are given the full Telegram adaptation text, a selected fragment inside it, and a user instruction about what is wrong with that fragment.',
        'Revise only what is necessary to satisfy the instruction.',
        'Keep the overall text in the same language and preserve the rest of the adaptation unless a tiny surrounding adjustment is required for natural flow.',
        'Preserve the existing paragraph structure and line breaks whenever possible.',
        'Do not collapse the whole text into one long line or one dense paragraph if the current text is already split naturally.',
        'Return the complete revised Telegram adaptation text, not just the fragment.',
        'The final output must still read like a concise Telegram post.',
        'Keep the final output under 900 characters so it can be used safely as a Telegram image caption.',
        'Use Telegram HTML tags for formatting when emphasis is needed, for example <b>important phrase</b>.',
        'Do not use Markdown formatting such as **bold** because Telegram will not render it in HTML parse mode.',
        'Do not add commentary, quotes, explanations, or markdown.',
        'Return only the final revised full text.',
      ].join(' ');
    } else if (params.channel === 'channel_x') {
      basePrompt = [
        'You are an editorial adaptation editor.',
        'You are given the full X post text, a selected fragment inside it, and a user instruction about how that fragment should change.',
        'Revise only what is necessary to satisfy the instruction.',
        'Keep the text in the same language and preserve the rest unless a tiny surrounding adjustment is required.',
        'Preserve the existing formatting and line breaks unless the instruction requires changing them.',
        'Return the complete revised X post, not just the fragment.',
        'The final output must remain exactly one sentence and no longer than 15 words.',
        'Do not add commentary, quotes, explanations, or markdown.',
        'Return only the final revised full text.',
      ].join(' ');
    } else if (params.channel === 'channel_discord') {
      basePrompt = [
        'You are an editorial adaptation editor.',
        'You are given the full Discord post text, a selected fragment inside it, and a user instruction about how that fragment should change.',
        'Revise only what is necessary to satisfy the instruction.',
        'Keep the text in the same language and preserve the rest unless a tiny surrounding adjustment is required.',
        'Return the complete revised Discord post, not just the fragment.',
        'The final output must remain no more than 2 sentences.',
        'Keep the final output under 1800 characters so it fits Discord webhook content limits.',
        'Keep the wording as simple and easy to understand as possible.',
        'Avoid jargon unless absolutely necessary.',
        'Do not add commentary, quotes, explanations, or markdown.',
        'Return only the final revised full text.',
      ].join(' ');
    } else if (params.channel === 'channel_blog') {
      basePrompt = [
        'You are an editorial adaptation editor.',
        'You are given the full short blog post text, a selected fragment inside it, and a user instruction about how that fragment should change.',
        'Revise only what is necessary to satisfy the instruction.',
        'Keep the text in the same language and preserve the rest unless a small surrounding adjustment is required.',
        'Return the complete revised short blog post, not just the fragment.',
        'Keep the final result in 2 to 4 short paragraphs.',
        'Keep the tone clear, informative, and easy to read.',
        'Do not add commentary, quotes, explanations, or markdown.',
        'Return only the final revised full text.',
      ].join(' ');
    } else {
      basePrompt = [
        'You are an editorial adaptation editor.',
        'Revise the selected fragment according to the user instruction and return the full revised text only.',
      ].join(' ');
    }

    return [
      basePrompt,
      this.buildChannelRules(params.channel, params.promptInstructions),
      this.buildPublicationContext(params.channel, params.publicationType, params.style),
      this.formatBrandMemorySection(params.brandMemory),
    ].join('\n\n');
  }

  private buildAdaptationRevisionUserPrompt(params: ReviseAdaptationAiParams): string {
    return [
      params.sourceContent?.trim()
        ? `Original source reference:\n${params.sourceContent.trim()}`
        : 'Original source reference: not provided.',
      `Instruction:\n${params.instruction}`,
      params.selectedText?.trim()
        ? `Selected fragment:\n${params.selectedText.trim()}`
        : 'Selected fragment: not provided.',
      params.qualityReasons?.length
        ? `Quality reasons:\n${this.formatReasons(params.qualityReasons)}`
        : 'Quality reasons: none.',
      params.suggestedFix
        ? `Suggested fix:\n${this.formatSuggestedFix(params.suggestedFix)}`
        : 'Suggested fix: none.',
      'Current adaptation:',
      params.currentContent,
    ].join('\n\n');
  }

  private buildTranslationSystemPrompt(params: GenerateTranslationAiParams): string {
    const promptInstructions = params.promptInstructions?.trim();
    const basePrompt = [
      'You are an editorial translation assistant.',
      `Translate the provided social adaptation for the channel "${params.displayName}".`,
      `Translate from ${params.sourceLanguage} to ${params.targetLanguage}.`,
      'Preserve the meaning, factual accuracy, and channel-specific tone.',
      'Keep the output natural and publication-ready.',
      promptInstructions
        ? 'Preserve compliance with the channel-specific rules below.'
        : 'Preserve the original adaptation format unless a natural translation requires tiny adjustments.',
      'Return only the final translated text with no commentary.',
    ].join(' ');

    return [
      basePrompt,
      this.buildPublicationContext(params.channel, params.publicationType, params.style),
      this.buildChannelRules(params.channel, params.promptInstructions),
      this.formatBrandMemorySection(params.brandMemory),
    ].join('\n\n');
  }

  private buildTranslationUserPrompt(params: GenerateTranslationAiParams): string {
    return [
      `Source language: ${params.sourceLanguage}`,
      `Target language: ${params.targetLanguage}`,
      'Source adaptation:',
      params.sourceContent,
    ].join('\n\n');
  }

  private buildTranslationRevisionSystemPrompt(params: ReviseTranslationAiParams): string {
    return [
      'You are an editorial translation editor.',
      `Revise an existing translation for ${params.displayName} (${params.channel}).`,
      `Keep the translation in ${params.targetLanguage}.`,
      'Fix meaning drift, unsupported claims, missing claims, glossary mismatches, and locale issues while preserving fluency.',
      'Return only the final revised translation with no commentary.',
      this.buildPublicationContext(params.channel, params.publicationType, params.style),
      this.buildChannelRules(params.channel, params.promptInstructions),
      this.formatBrandMemorySection(params.brandMemory),
    ].join('\n\n');
  }

  private buildTranslationRevisionUserPrompt(params: ReviseTranslationAiParams): string {
    return [
      `Source language: ${params.sourceLanguage}`,
      `Target language: ${params.targetLanguage}`,
      params.qualityReasons?.length
        ? `Quality reasons:\n${this.formatReasons(params.qualityReasons)}`
        : 'Quality reasons: none.',
      params.suggestedFix
        ? `Suggested fix:\n${this.formatSuggestedFix(params.suggestedFix)}`
        : 'Suggested fix: none.',
      'Source adaptation:',
      params.sourceContent,
      'Current translation:',
      params.currentContent,
    ].join('\n\n');
  }

  private buildAdaptationQualitySystemPrompt(params: CheckAdaptationQualityParams): string {
    return [
      'You are an adaptation quality reviewer.',
      'Evaluate the adaptation for channel compliance, style match, readability, brand safety, forbidden claims, legal risk, and approved facts consistency.',
      'Return JSON only, with no markdown and no commentary.',
      'The JSON must have this shape:',
      '{"outcome":"passed|warning|failed|blocked","summary":"string","reasons":[{"code":"string","severity":"low|medium|high|critical","message":"string","excerpt":"string|null","suggestion":"string|null"}],"suggestedFix":{"summary":"string|null","instructions":["string"]}|null}.',
      'Use "blocked" only for severe issues that should stop publishing.',
      'Use "failed" when another revision is required.',
      'Use "warning" when the content is usable but needs human attention.',
      'Use "passed" only when the adaptation is ready for the next step.',
      this.buildPublicationContext(params.channel, params.publicationType, params.style),
      this.buildChannelRules(params.channel, params.promptInstructions),
      this.formatBrandMemorySection(params.brandMemory),
    ].join('\n\n');
  }

  private buildAdaptationQualityUserPrompt(params: CheckAdaptationQualityParams): string {
    return [
      `Source language: ${params.sourceLanguage}`,
      'Original source text:',
      params.sourceContent,
      'Adaptation under review:',
      params.adaptationContent,
    ].join('\n\n');
  }

  private buildTranslationFidelitySystemPrompt(params: CheckTranslationFidelityParams): string {
    return [
      'You are a translation fidelity reviewer.',
      'Evaluate the translation for meaning drift, missing claims, added unsupported claims, glossary compliance, banned phrases, and locale risks.',
      'Return JSON only, with no markdown and no commentary.',
      'The JSON must have this shape:',
      '{"outcome":"passed|warning|failed|blocked","summary":"string","reasons":[{"code":"string","severity":"low|medium|high|critical","message":"string","excerpt":"string|null","suggestion":"string|null"}],"suggestedFix":{"summary":"string|null","instructions":["string"]}|null}.',
      'Use "blocked" only for severe issues that should stop publishing.',
      'Use "failed" when another translation revision is required.',
      'Use "warning" when the translation is usable but needs human attention.',
      'Use "passed" only when the translation is ready for publishing or scheduling.',
      this.buildPublicationContext(params.channel, params.publicationType, params.style),
      this.buildChannelRules(params.channel, params.promptInstructions),
      this.formatBrandMemorySection(params.brandMemory),
    ].join('\n\n');
  }

  private buildTranslationFidelityUserPrompt(params: CheckTranslationFidelityParams): string {
    return [
      `Source language: ${params.sourceLanguage}`,
      `Target language: ${params.targetLanguage}`,
      'Source adaptation:',
      params.sourceContent,
      'Translated text under review:',
      params.translatedContent,
    ].join('\n\n');
  }

  private buildPublicationContext(
    channel: string,
    publicationType?: string | null,
    style?: string | null,
  ): string {
    const publicationTypeDescription = describePublicationTypeForChannel(channel, publicationType);

    return [
      `Channel ID: ${channel}`,
      `Publication type: ${this.normalizeOptionalText(publicationType) ?? 'not specified'}`,
      `Publication type meaning: ${publicationTypeDescription}`,
      `Style: ${this.normalizeOptionalText(style) ?? 'not specified'}`,
    ].join('\n');
  }

  private buildChannelRules(channel: string, promptInstructions?: string | null): string {
    if (promptInstructions?.trim()) {
      const rules = [`Channel-specific rules:\n${promptInstructions.trim()}`];

      if (channel === 'channel_x') {
        rules.push(
          [
            'Non-negotiable X publishing constraints:',
            '- Keep the final text under 260 characters, including spaces.',
            '- Return one standalone post only.',
            '- Do not create a thread, numbered list, or multiple post variants.',
            '- If translation would become longer, compress the wording while preserving the core meaning.',
          ].join('\n'),
        );
      }

      if (channel === 'channel_telegram') {
        rules.push(
          [
            'Non-negotiable Telegram publishing constraints:',
            '- Keep the final text under 900 characters whenever an image may be attached.',
            '- Use Telegram HTML tags for emphasis, not Markdown.',
            '- If the source is long, compress aggressively into the central point only.',
          ].join('\n'),
        );
      }

      if (channel === 'channel_discord') {
        rules.push(
          [
            'Non-negotiable Discord publishing constraints:',
            '- Keep the final text under 1800 characters because Discord webhook content is limited.',
            '- If the source is long, compress aggressively into the central point only.',
          ].join('\n'),
        );
      }

      return rules.join('\n\n');
    }

    if (channel === 'channel_telegram') {
      return [
        'Channel-specific rules:',
        '- Keep the tone concise, clear, and strong.',
        '- Prefer short paragraphs.',
        '- Use Telegram HTML tags for formatting when emphasis is needed, for example <b>important phrase</b>.',
        '- Do not use Markdown formatting such as **bold** because Telegram will not render it in HTML parse mode.',
        '- Keep the final text under 900 characters whenever an image may be attached.',
        '- Do not use hashtags.',
        '- Do not use emojis unless absolutely necessary.',
      ].join('\n');
    }

    if (channel === 'channel_x') {
      return [
        'Channel-specific rules:',
        '- Keep the result sharp and compact.',
        '- Keep the final text under 260 characters so it can be published through the standard X API.',
        '- Prefer a single-sentence social post unless the task explicitly implies a thread.',
        '- Do not use hashtags.',
        '- Do not use emojis.',
      ].join('\n');
    }

    if (channel === 'channel_discord') {
      return [
        'Channel-specific rules:',
        '- Keep the wording simple and community-friendly.',
        '- Keep the final text under 1800 characters because Discord webhook content is limited.',
        '- Avoid jargon unless necessary.',
        '- Do not use hashtags.',
        '- Do not use emojis unless they are part of the intended voice.',
      ].join('\n');
    }

    if (channel === 'channel_blog') {
      return [
        'Channel-specific rules:',
        '- Keep the tone informative and readable.',
        '- Prefer 2 to 4 short paragraphs.',
        '- Do not use hashtags.',
        '- Do not use emojis.',
      ].join('\n');
    }

    return 'Channel-specific rules: none provided.';
  }

  private formatBrandMemorySection(brandMemory?: BrandMemory | null): string {
    if (!brandMemory) {
      return 'Brand memory: none provided.';
    }

    const lines: string[] = ['Brand memory:'];

    if (brandMemory.brandName) {
      lines.push(`- Brand name: ${brandMemory.brandName}`);
    }

    if (brandMemory.productDescription) {
      lines.push(`- Product description: ${brandMemory.productDescription}`);
    }

    if (brandMemory.targetAudience) {
      lines.push(`- Target audience: ${brandMemory.targetAudience}`);
    }

    if (brandMemory.approvedFacts.length > 0) {
      lines.push(`- Approved facts: ${brandMemory.approvedFacts.join(' | ')}`);
    }

    if (brandMemory.forbiddenClaims.length > 0) {
      lines.push(`- Forbidden claims: ${brandMemory.forbiddenClaims.join(' | ')}`);
    }

    if (brandMemory.bannedPhrases.length > 0) {
      lines.push(`- Banned phrases: ${brandMemory.bannedPhrases.join(' | ')}`);
    }

    if (brandMemory.requiredPhrases.length > 0) {
      lines.push(`- Required phrases: ${brandMemory.requiredPhrases.join(' | ')}`);
    }

    const glossaryEntries = Object.entries(brandMemory.glossary);
    if (glossaryEntries.length > 0) {
      lines.push(
        `- Glossary: ${glossaryEntries.map(([term, value]) => `${term} => ${value}`).join(' | ')}`,
      );
    }

    if (brandMemory.brandDocs.length > 0) {
      lines.push(
        `- Brand docs: ${brandMemory.brandDocs.map((doc) => `${doc.title}${doc.notes ? ` (${doc.notes})` : ''}`).join(' | ')}`,
      );
    }

    return lines.join('\n');
  }

  private formatReasons(reasons: AiGatewayReason[]): string {
    return reasons
      .map((reason) =>
        [
          `- [${reason.severity}] ${reason.code}: ${reason.message}`,
          reason.excerpt ? `  Excerpt: ${reason.excerpt}` : null,
          reason.suggestion ? `  Suggestion: ${reason.suggestion}` : null,
        ]
          .filter(Boolean)
          .join('\n'),
      )
      .join('\n');
  }

  private formatSuggestedFix(suggestedFix: AiGatewaySuggestedFix): string {
    return [
      suggestedFix.summary ? `Summary: ${suggestedFix.summary}` : null,
      suggestedFix.instructions.length > 0
        ? `Instructions:\n${suggestedFix.instructions
            .map((instruction: string) => `- ${instruction}`)
            .join('\n')}`
        : null,
    ]
      .filter(Boolean)
      .join('\n');
  }

  private normalizeOptionalText(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
}
