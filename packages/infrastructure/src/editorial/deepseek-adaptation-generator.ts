import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AdaptationGeneratorPort,
  type GenerateAdaptationParams,
  type GenerateTranslationParams,
  type ReviseAdaptationSelectionParams,
  TranslationGeneratorPort,
} from '@marketing-service/editorial';

interface DeepSeekChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
  };
}

@Injectable()
export class DeepSeekAdaptationGenerator
  extends AdaptationGeneratorPort
  implements TranslationGeneratorPort
{
  constructor(private readonly config: ConfigService) {
    super();
  }

  async generate(params: GenerateAdaptationParams): Promise<string> {
    return this.runCompletion(
      this.buildSystemPrompt(params),
      this.buildUserPrompt(params),
      'DeepSeek returned empty adaptation content',
    );
  }

  async reviseSelection(params: ReviseAdaptationSelectionParams): Promise<string> {
    return this.runCompletion(
      this.buildRevisionSystemPrompt(params),
      this.buildRevisionUserPrompt(params),
      'DeepSeek returned empty revised adaptation content',
    );
  }

  async translate(params: GenerateTranslationParams): Promise<string> {
    return this.runCompletion(
      this.buildTranslationSystemPrompt(params),
      this.buildTranslationUserPrompt(params),
      'DeepSeek returned empty translation content',
    );
  }

  private async runCompletion(
    systemPrompt: string,
    userPrompt: string,
    emptyResponseMessage: string,
  ): Promise<string> {
    const baseUrl = this.config.get<string>('DEEPSEEK_BASE_URL') ?? 'https://api.deepseek.com';
    const apiKey = this.config.get<string>('DEEPSEEK_API_KEY');
    const model = this.config.get<string>('DEEPSEEK_MODEL') ?? 'deepseek-v4-flash';

    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY is not configured');
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        thinking: { type: 'disabled' },
        temperature: 0.7,
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
      }),
    });

    const payload = (await response.json()) as DeepSeekChatCompletionResponse;

    if (!response.ok) {
      throw new Error(payload.error?.message ?? `DeepSeek request failed with ${response.status}`);
    }

    const adaptedContent = payload.choices?.[0]?.message?.content?.trim();

    if (!adaptedContent) {
      throw new Error(emptyResponseMessage);
    }

    return adaptedContent;
  }

  private buildSystemPrompt(params: GenerateAdaptationParams): string {
    if (params.promptInstructions?.trim()) {
      return [
        'You are an editorial adaptation assistant.',
        `Create a social adaptation for the channel "${params.displayName}" in the same language as the original text.`,
        'Preserve the core meaning and factual accuracy.',
        'Follow the channel-specific rules exactly.',
        'Return only the final adapted text with no commentary.',
        'Channel-specific rules:',
        params.promptInstructions.trim(),
      ].join(' ');
    }

    if (params.channelId === 'channel_telegram') {
      return [
        'You are an editorial adaptation assistant.',
        'Rewrite the provided long-form article into a Telegram post in the same language.',
        'Preserve the core meaning and factual accuracy.',
        'Make it concise, readable, and engaging for Telegram.',
        'Return exactly 3 sentences.',
        'The output must be substantially shorter than the original article.',
        'Each sentence should carry one key idea only.',
        'Use a strong opening hook.',
        'Keep the tone expert and clear.',
        'Do not use hashtags.',
        'Do not use emojis unless they are absolutely necessary.',
        'Do not produce bullet points or lists.',
        'Return only the final post text with no commentary.',
      ].join(' ');
    }

    if (params.channelId === 'channel_x') {
      return [
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
    }

    if (params.channelId === 'channel_discord') {
      return [
        'You are an editorial adaptation assistant.',
        'Rewrite the provided long-form article into a Discord post in the same language.',
        'Preserve the core meaning and factual accuracy.',
        'Return no more than 2 sentences.',
        'Explain everything as simply as possible.',
        'Use plain words and short phrasing.',
        'Make it easy to understand immediately for a non-expert reader.',
        'Avoid jargon unless it is absolutely necessary.',
        'Do not use hashtags.',
        'Do not use emojis.',
        'Return only the final post text with no commentary.',
      ].join(' ');
    }

    return [
      'You are an editorial adaptation assistant.',
      'Rewrite the provided article into a channel-specific social post in the same language.',
      'Preserve meaning and factual accuracy.',
      'Return only the final adapted text.',
    ].join(' ');
  }

  private buildUserPrompt(params: GenerateAdaptationParams): string {
    return [
      `Channel ID: ${params.channelId}`,
      `Language: ${params.sourceLanguage}`,
      'Original article:',
      params.originalContent,
    ].join('\n\n');
  }

  private buildRevisionSystemPrompt(params: ReviseAdaptationSelectionParams): string {
    if (params.promptInstructions?.trim()) {
      return [
        'You are an editorial adaptation editor.',
        `You are editing a social adaptation for the channel "${params.displayName}".`,
        'You are given the full adaptation text, a selected fragment inside it, and a user instruction about what should change.',
        'Revise only what is necessary to satisfy the instruction.',
        'Keep the text in the same language and preserve the rest unless small surrounding adjustments are required for flow.',
        'Preserve the current paragraph structure and line breaks whenever possible.',
        'Keep the final text fully compliant with the channel-specific rules below.',
        'Return the complete revised text only, with no commentary or markdown.',
        'Channel-specific rules:',
        params.promptInstructions.trim(),
      ].join(' ');
    }

    if (params.channelId === 'channel_telegram') {
      return [
        'You are an editorial adaptation editor.',
        'You are given the full Telegram adaptation text, a selected fragment inside it, and a user instruction about what is wrong with that fragment.',
        'Revise only what is necessary to satisfy the instruction.',
        'Keep the overall text in the same language and preserve the rest of the adaptation unless a tiny surrounding adjustment is required for natural flow.',
        'Preserve the existing paragraph structure and line breaks whenever possible.',
        'Do not collapse the whole text into one long line or one dense paragraph if the current text is already split naturally.',
        'Return the complete revised Telegram adaptation text, not just the fragment.',
        'The final output must still read like a concise Telegram post.',
        'Do not add commentary, quotes, explanations, or markdown.',
        'Return only the final revised full text.',
      ].join(' ');
    }

    if (params.channelId === 'channel_x') {
      return [
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
    }

    if (params.channelId === 'channel_discord') {
      return [
        'You are an editorial adaptation editor.',
        'You are given the full Discord post text, a selected fragment inside it, and a user instruction about how that fragment should change.',
        'Revise only what is necessary to satisfy the instruction.',
        'Keep the text in the same language and preserve the rest unless a tiny surrounding adjustment is required.',
        'Return the complete revised Discord post, not just the fragment.',
        'The final output must remain no more than 2 sentences.',
        'Keep the wording as simple and easy to understand as possible.',
        'Avoid jargon unless absolutely necessary.',
        'Do not add commentary, quotes, explanations, or markdown.',
        'Return only the final revised full text.',
      ].join(' ');
    }

    return [
      'You are an editorial adaptation editor.',
      'Revise the selected fragment according to the user instruction and return the full revised text only.',
    ].join(' ');
  }

  private buildRevisionUserPrompt(params: ReviseAdaptationSelectionParams): string {
    return [
      `Channel ID: ${params.channelId}`,
      `Language: ${params.sourceLanguage}`,
      'User instruction for the selected fragment:',
      params.instruction,
      'Selected fragment:',
      params.selectedText,
      'Current full adaptation text:',
      params.fullContent,
    ].join('\n\n');
  }

  private buildTranslationSystemPrompt(params: GenerateTranslationParams): string {
    const customRules = params.promptInstructions?.trim();

    return [
      'You are an editorial translation assistant.',
      `Translate the provided social adaptation for the channel "${params.displayName}".`,
      `Translate from ${params.sourceLanguage} to ${params.targetLanguage}.`,
      'Preserve the meaning, factual accuracy, and channel-specific tone.',
      'Keep the output natural and publication-ready.',
      customRules
        ? `Preserve compliance with these channel-specific rules: ${customRules}`
        : 'Preserve the original adaptation format unless a natural translation requires tiny adjustments.',
      'Return only the final translated text with no commentary.',
    ].join(' ');
  }

  private buildTranslationUserPrompt(params: GenerateTranslationParams): string {
    return [
      `Channel ID: ${params.channelId}`,
      `Channel name: ${params.displayName}`,
      `Source language: ${params.sourceLanguage}`,
      `Target language: ${params.targetLanguage}`,
      'Source adaptation:',
      params.sourceContent,
    ].join('\n\n');
  }
}
