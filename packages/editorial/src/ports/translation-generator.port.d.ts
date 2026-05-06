import type { ChannelId } from '../domain/channel-adaptation.entity.js';
export interface GenerateTranslationParams {
    sourceContent: string;
    sourceLanguage: string;
    targetLanguage: string;
    channelId: ChannelId;
    displayName: string;
    promptInstructions: string | null;
}
export declare abstract class TranslationGeneratorPort {
    abstract translate(params: GenerateTranslationParams): Promise<string>;
}
//# sourceMappingURL=translation-generator.port.d.ts.map