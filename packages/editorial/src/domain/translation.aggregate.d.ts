import { AggregateRoot, type TypedId } from '@marketing-service/shared';
import type { AdaptationId, NodeStatus } from './channel-adaptation.entity.js';
export type TranslationId = TypedId<'translation'>;
export interface CreateTranslationParams {
    adaptationId: AdaptationId;
    sourceLanguage: string;
    targetLanguage: string;
}
export interface TranslationProps {
    id: TranslationId;
    adaptationId: AdaptationId;
    sourceLanguage: string;
    targetLanguage: string;
    status: NodeStatus;
    translatedContent: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export declare class Translation extends AggregateRoot {
    readonly id: TranslationId;
    readonly adaptationId: AdaptationId;
    readonly sourceLanguage: string;
    readonly targetLanguage: string;
    status: NodeStatus;
    translatedContent: string | null;
    readonly createdAt: Date;
    updatedAt: Date;
    private constructor();
    static create(params: CreateTranslationParams): Translation;
    static rehydrate(props: TranslationProps): Translation;
    markGenerated(translatedContent: string): void;
    edit(translatedContent: string): void;
    approve(): void;
    markOutdated(): void;
    resetToPending(): void;
}
//# sourceMappingURL=translation.aggregate.d.ts.map