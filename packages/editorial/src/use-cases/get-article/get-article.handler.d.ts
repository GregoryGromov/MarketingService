import { type IQueryHandler } from '@nestjs/cqrs';
import { AdaptationVersionRepository } from '../../domain/adaptation-version.repository.js';
import { ArticleRepository } from '../../domain/article.repository.js';
import { ChannelAdaptationRepository } from '../../domain/channel-adaptation.repository.js';
import { TranslationRepository } from '../../domain/translation.repository.js';
import { GetArticleQuery } from './get-article.query.js';
export interface GetArticleResult {
    id: string;
    projectId: string;
    status: string;
    paused: boolean;
    releasePlanSnapshot: Record<string, unknown> | null;
    original: {
        content: string;
        language: string;
        uploadedAt: Date;
    };
    adaptations: Array<{
        id: string;
        articleId: string;
        channelId: string;
        displayName: string;
        promptInstructions: string | null;
        sourceLanguage: string;
        status: string;
        adaptedContent: string | null;
        selectedVersionId: string | null;
        approvedVersionId: string | null;
        translations: Array<{
            id: string;
            adaptationId: string;
            sourceLanguage: string;
            targetLanguage: string;
            status: string;
            translatedContent: string | null;
            createdAt: Date;
            updatedAt: Date;
        }>;
        versions: Array<{
            id: string;
            adaptationId: string;
            content: string;
            kind: string;
            sourceVersionId: string | null;
            meta: Record<string, unknown> | null;
            createdAt: Date;
        }>;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
}
export declare class GetArticleHandler implements IQueryHandler<GetArticleQuery> {
    private readonly articleRepository;
    private readonly channelAdaptationRepository;
    private readonly adaptationVersionRepository;
    private readonly translationRepository;
    constructor(articleRepository: ArticleRepository, channelAdaptationRepository: ChannelAdaptationRepository, adaptationVersionRepository: AdaptationVersionRepository, translationRepository: TranslationRepository);
    execute(query: GetArticleQuery): Promise<{
        id: `article_${string}`;
        projectId: `project_${string}`;
        status: import("../../index.js").ArticleStatus;
        paused: boolean;
        releasePlanSnapshot: Record<string, unknown> | null;
        original: import("../../index.js").Original;
        adaptations: {
            id: `adaptation_${string}`;
            articleId: `article_${string}`;
            channelId: `channel_${string}`;
            displayName: string;
            promptInstructions: string | null;
            sourceLanguage: string;
            status: import("../../index.js").NodeStatus;
            adaptedContent: string | null;
            selectedVersionId: `adaptation_version_${string}` | null;
            approvedVersionId: `adaptation_version_${string}` | null;
            translations: {
                id: `translation_${string}`;
                adaptationId: `adaptation_${string}`;
                sourceLanguage: string;
                targetLanguage: string;
                status: import("../../index.js").NodeStatus;
                translatedContent: string | null;
                createdAt: Date;
                updatedAt: Date;
            }[];
            versions: {
                id: `adaptation_version_${string}`;
                adaptationId: `adaptation_${string}`;
                content: string;
                kind: import("../../index.js").AdaptationVersionKind;
                sourceVersionId: `adaptation_version_${string}` | null;
                meta: Record<string, unknown> | null;
                createdAt: Date;
            }[];
            createdAt: Date;
            updatedAt: Date;
        }[];
        createdAt: Date;
        updatedAt: Date;
    } | null>;
}
//# sourceMappingURL=get-article.handler.d.ts.map