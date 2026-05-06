import { AggregateRoot, type TypedId } from '@marketing-service/shared';
import type { ArticleId } from './article.aggregate.js';
import type { AdaptationVersionId } from './adaptation-version.entity.js';
export type AdaptationId = TypedId<'adaptation'>;
export type ChannelId = TypedId<'channel'>;
export type NodeStatus = 'pending' | 'generated' | 'edited' | 'approved' | 'outdated';
export interface CreateChannelAdaptationParams {
    articleId: ArticleId;
    channelId: ChannelId;
    displayName: string;
    promptInstructions: string | null;
    sourceLanguage: string;
}
export interface ChannelAdaptationProps {
    id: AdaptationId;
    articleId: ArticleId;
    channelId: ChannelId;
    displayName: string;
    promptInstructions: string | null;
    sourceLanguage: string;
    status: NodeStatus;
    adaptedContent: string | null;
    selectedVersionId: AdaptationVersionId | null;
    approvedVersionId: AdaptationVersionId | null;
    createdAt: Date;
    updatedAt: Date;
}
export declare class ChannelAdaptation extends AggregateRoot {
    readonly id: AdaptationId;
    readonly articleId: ArticleId;
    readonly channelId: ChannelId;
    readonly displayName: string;
    readonly promptInstructions: string | null;
    readonly sourceLanguage: string;
    status: NodeStatus;
    adaptedContent: string | null;
    selectedVersionId: AdaptationVersionId | null;
    approvedVersionId: AdaptationVersionId | null;
    readonly createdAt: Date;
    updatedAt: Date;
    private constructor();
    static create(params: CreateChannelAdaptationParams): ChannelAdaptation;
    static rehydrate(props: ChannelAdaptationProps): ChannelAdaptation;
    markGenerated(versionId: AdaptationVersionId, adaptedContent: string): void;
    edit(versionId: AdaptationVersionId, adaptedContent: string): void;
    selectVersion(versionId: AdaptationVersionId, adaptedContent: string): void;
    approve(): void;
    markOutdated(): void;
    resetToPending(): void;
}
//# sourceMappingURL=channel-adaptation.entity.d.ts.map