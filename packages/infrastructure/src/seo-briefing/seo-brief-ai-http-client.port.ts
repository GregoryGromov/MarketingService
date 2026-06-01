import type { SeoBriefJsonValue } from '@marketing-service/seo-briefing';

export type SeoBriefAiThinkingType = 'enabled' | 'disabled';
export type SeoBriefAiReasoningEffort = 'high' | 'max';

export interface SeoBriefAiCompletionRequest {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  timeoutMs: number;
  temperature?: number;
  thinkingType?: SeoBriefAiThinkingType;
  reasoningEffort?: SeoBriefAiReasoningEffort;
}

export interface SeoBriefAiCompletionResponse {
  status: number;
  rawPayload: SeoBriefJsonValue;
  content: string;
  model: string;
  tokenUsageInput: number | null;
  tokenUsageOutput: number | null;
  estimatedCost: number | null;
}

export abstract class SeoBriefAiHttpClientPort {
  abstract requestCompletion(
    request: SeoBriefAiCompletionRequest,
  ): Promise<SeoBriefAiCompletionResponse>;
}
