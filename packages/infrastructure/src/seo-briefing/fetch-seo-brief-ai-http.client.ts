import {
  SeoBriefAiConfigurationError,
  SeoBriefAiTransportError,
  type SeoBriefJsonValue,
} from '@marketing-service/seo-briefing';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  type SeoBriefAiCompletionRequest,
  type SeoBriefAiCompletionResponse,
  SeoBriefAiHttpClientPort,
} from './seo-brief-ai-http-client.port.js';

interface DeepSeekChatCompletionResponse {
  model?: string;
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
  error?: {
    message?: string;
  };
}

@Injectable()
export class FetchSeoBriefAiHttpClient extends SeoBriefAiHttpClientPort {
  constructor(@Inject(ConfigService) private readonly config: ConfigService) {
    super();
  }

  async requestCompletion(
    request: SeoBriefAiCompletionRequest,
  ): Promise<SeoBriefAiCompletionResponse> {
    const apiKey =
      this.config.get<string>('SEO_BRIEF_AI_API_KEY')?.trim() ||
      this.config.get<string>('DEEPSEEK_API_KEY')?.trim();
    if (!apiKey) {
      throw new SeoBriefAiConfigurationError(
        'SEO_BRIEF_AI_API_KEY or DEEPSEEK_API_KEY must be configured',
      );
    }
    if (!isValidHeaderToken(apiKey)) {
      throw new SeoBriefAiConfigurationError(
        'SEO_BRIEF_AI_API_KEY or DEEPSEEK_API_KEY must contain only ASCII characters and no whitespace',
      );
    }

    const baseUrl =
      this.config.get<string>('SEO_BRIEF_AI_BASE_URL')?.trim() ||
      this.config.get<string>('DEEPSEEK_BASE_URL')?.trim() ||
      'https://api.deepseek.com';

    let response: Response;
    try {
      const body: Record<string, unknown> = {
        model: request.model,
        stream: false,
        messages: [
          {
            role: 'system',
            content: request.systemPrompt,
          },
          {
            role: 'user',
            content: request.userPrompt,
          },
        ],
      };

      if (request.thinkingType) {
        body.thinking = { type: request.thinkingType };
      }

      if (request.thinkingType === 'enabled') {
        body.reasoning_effort = request.reasoningEffort ?? 'high';
      } else if (typeof request.temperature === 'number') {
        body.temperature = request.temperature;
      }

      response = await fetch(new URL('/chat/completions', baseUrl), {
        method: 'POST',
        headers: {
          authorization: `Bearer ${apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(request.timeoutMs),
      });
    } catch (error) {
      throw new SeoBriefAiTransportError(
        error instanceof Error ? error.message : 'SEO brief AI request failed',
        'completion',
        'deepseek',
        null,
      );
    }

    let payload: SeoBriefJsonValue;
    try {
      payload = (await response.json()) as SeoBriefJsonValue;
    } catch (error) {
      throw new SeoBriefAiTransportError(
        error instanceof Error ? error.message : 'SEO brief AI returned invalid JSON',
        'completion',
        'deepseek',
        response.status,
      );
    }

    const normalized = payload as DeepSeekChatCompletionResponse;
    if (!response.ok) {
      throw new SeoBriefAiTransportError(
        normalized.error?.message ?? `SEO brief AI request failed with status ${response.status}`,
        'completion',
        'deepseek',
        response.status,
        payload,
      );
    }

    const content = normalized.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new SeoBriefAiTransportError(
        'SEO brief AI response does not contain message content',
        'completion',
        'deepseek',
        response.status,
        payload,
      );
    }

    return {
      status: response.status,
      rawPayload: payload,
      content,
      model: normalized.model?.trim() || request.model,
      tokenUsageInput: normalizeNumber(normalized.usage?.prompt_tokens),
      tokenUsageOutput: normalizeNumber(normalized.usage?.completion_tokens),
      estimatedCost: null,
    };
  }
}

function isValidHeaderToken(value: string): boolean {
  return /^[!-~]+$/.test(value);
}

function normalizeNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
