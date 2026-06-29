import {
  AdaptationGeneratorPort,
  type GenerateAdaptationParams,
  type GenerateTranslationParams,
  type ReviseAdaptationSelectionParams,
  type TranslationGeneratorPort,
} from '@marketing-service/editorial';
import type { AiGatewayPort } from '@marketing-service/project-management';
import { Injectable } from '@nestjs/common';

@Injectable()
export class DeepSeekAdaptationGenerator
  extends AdaptationGeneratorPort
  implements TranslationGeneratorPort
{
  constructor(private readonly aiGateway: AiGatewayPort) {
    super();
  }

  async generate(params: GenerateAdaptationParams): Promise<string> {
    const result = await this.aiGateway.generateAdaptation({
      sourceContent: params.originalContent,
      sourceLanguage: params.sourceLanguage,
      channel: params.channelId,
      displayName: params.displayName,
      model: params.model,
      promptInstructions: params.promptInstructions,
    });

    return result.content;
  }

  async reviseSelection(params: ReviseAdaptationSelectionParams): Promise<string> {
    const result = await this.aiGateway.reviseAdaptation({
      currentContent: params.fullContent,
      sourceLanguage: params.sourceLanguage,
      channel: params.channelId,
      displayName: params.displayName,
      promptInstructions: params.promptInstructions,
      instruction: params.instruction,
      selectedText: params.selectedText,
    });

    return result.content;
  }

  async translate(params: GenerateTranslationParams): Promise<string> {
    const result = await this.aiGateway.generateTranslation({
      sourceContent: params.sourceContent,
      sourceLanguage: params.sourceLanguage,
      targetLanguage: params.targetLanguage,
      channel: params.channelId,
      displayName: params.displayName,
      promptInstructions: params.promptInstructions,
    });

    return result.content;
  }
}
