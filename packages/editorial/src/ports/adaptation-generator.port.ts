import type { ChannelId } from '../domain/channel-adaptation.entity.js';

export interface GenerateAdaptationParams {
  originalContent: string;
  sourceLanguage: string;
  channelId: ChannelId;
  displayName: string;
  model?: string | null;
  promptInstructions: string | null;
}

export interface ReviseAdaptationSelectionParams {
  fullContent: string;
  selectedText: string;
  sourceLanguage: string;
  channelId: ChannelId;
  displayName: string;
  promptInstructions: string | null;
  instruction: string;
}

export abstract class AdaptationGeneratorPort {
  abstract generate(params: GenerateAdaptationParams): Promise<string>;

  abstract reviseSelection(params: ReviseAdaptationSelectionParams): Promise<string>;
}
