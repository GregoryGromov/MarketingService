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

interface ChatCompletionResponse {
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
    const requestedOpenRouterModel = request.model.includes('/');
    const openRouterApiKey = this.config.get<string>('OPENROUTER_API_KEY')?.trim();
    const genericApiKey = this.config.get<string>('SEO_BRIEF_AI_API_KEY')?.trim();
    const apiKey =
      openRouterApiKey ||
      genericApiKey ||
      (requestedOpenRouterModel ? undefined : this.config.get<string>('DEEPSEEK_API_KEY')?.trim());
    if (!apiKey) {
      throw new SeoBriefAiConfigurationError(
        'OPENROUTER_API_KEY, SEO_BRIEF_AI_API_KEY, or DEEPSEEK_API_KEY must be configured',
      );
    }
    if (!isValidHeaderToken(apiKey)) {
      throw new SeoBriefAiConfigurationError(
        'OPENROUTER_API_KEY, SEO_BRIEF_AI_API_KEY, or DEEPSEEK_API_KEY must contain only ASCII characters and no whitespace',
      );
    }

    const baseUrl =
      this.config.get<string>('OPENROUTER_BASE_URL')?.trim() ||
      this.config.get<string>('SEO_BRIEF_AI_BASE_URL')?.trim() ||
      (requestedOpenRouterModel
        ? undefined
        : this.config.get<string>('DEEPSEEK_BASE_URL')?.trim()) ||
      (openRouterApiKey || genericApiKey || requestedOpenRouterModel
        ? 'https://openrouter.ai/api/v1'
        : 'https://api.deepseek.com');
    const provider = isOpenRouterBaseUrl(baseUrl) ? 'openrouter' : 'ai';

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

      if (!isOpenRouterBaseUrl(baseUrl) && request.thinkingType) {
        body.thinking = { type: request.thinkingType };
      }

      if (!isOpenRouterBaseUrl(baseUrl) && request.thinkingType === 'enabled') {
        body.reasoning_effort = request.reasoningEffort ?? 'high';
      } else if (typeof request.temperature === 'number') {
        body.temperature = request.temperature;
      }

      response = await fetch(createChatCompletionsUrl(baseUrl), {
        method: 'POST',
        headers: createHeaders({
          apiKey,
          appTitle: this.config.get<string>('OPENROUTER_APP_TITLE')?.trim(),
          referer: this.config.get<string>('OPENROUTER_HTTP_REFERER')?.trim(),
        }),
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(request.timeoutMs),
      });
    } catch (error) {
      throw new SeoBriefAiTransportError(
        error instanceof Error ? error.message : 'SEO brief AI request failed',
        'completion',
        provider,
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
        provider,
        response.status,
      );
    }

    const normalized = payload as ChatCompletionResponse;
    if (!response.ok) {
      throw new SeoBriefAiTransportError(
        normalized.error?.message ?? `SEO brief AI request failed with status ${response.status}`,
        'completion',
        provider,
        response.status,
        payload,
      );
    }

    const content = normalized.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new SeoBriefAiTransportError(
        'SEO brief AI response does not contain message content',
        'completion',
        provider,
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

function createChatCompletionsUrl(baseUrl: string): URL {
  return new URL('chat/completions', baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
}

function createHeaders(params: {
  apiKey: string;
  appTitle?: string | null;
  referer?: string | null;
}): Record<string, string> {
  const headers: Record<string, string> = {
    authorization: `Bearer ${params.apiKey}`,
    'content-type': 'application/json',
  };
  if (params.referer) {
    headers['HTTP-Referer'] = params.referer;
  }
  if (params.appTitle) {
    headers['X-Title'] = params.appTitle;
  }
  return headers;
}

function isOpenRouterBaseUrl(baseUrl: string): boolean {
  return baseUrl.toLowerCase().includes('openrouter.ai');
}

function normalizeNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
