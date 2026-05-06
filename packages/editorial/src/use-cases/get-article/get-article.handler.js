var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { QueryHandler } from '@nestjs/cqrs';
import { AdaptationVersionRepository } from '../../domain/adaptation-version.repository.js';
import { ArticleRepository } from '../../domain/article.repository.js';
import { ChannelAdaptationRepository } from '../../domain/channel-adaptation.repository.js';
import { TranslationRepository } from '../../domain/translation.repository.js';
import { GetArticleQuery } from './get-article.query.js';
let GetArticleHandler = class GetArticleHandler {
    articleRepository;
    channelAdaptationRepository;
    adaptationVersionRepository;
    translationRepository;
    constructor(articleRepository, channelAdaptationRepository, adaptationVersionRepository, translationRepository) {
        this.articleRepository = articleRepository;
        this.channelAdaptationRepository = channelAdaptationRepository;
        this.adaptationVersionRepository = adaptationVersionRepository;
        this.translationRepository = translationRepository;
    }
    async execute(query) {
        const article = await this.articleRepository.findById(query.articleId);
        if (!article) {
            return null;
        }
        const adaptations = await this.channelAdaptationRepository.findByArticleId(query.articleId);
        const adaptationRows = await Promise.all(adaptations.map(async (adaptation) => {
            const versions = await this.adaptationVersionRepository.findByAdaptationId(adaptation.id);
            const translations = await this.translationRepository.findByAdaptationId(adaptation.id);
            return {
                id: adaptation.id,
                articleId: adaptation.articleId,
                channelId: adaptation.channelId,
                displayName: adaptation.displayName,
                promptInstructions: adaptation.promptInstructions,
                sourceLanguage: adaptation.sourceLanguage,
                status: adaptation.status,
                adaptedContent: adaptation.adaptedContent,
                selectedVersionId: adaptation.selectedVersionId,
                approvedVersionId: adaptation.approvedVersionId,
                translations: translations.map((translation) => ({
                    id: translation.id,
                    adaptationId: translation.adaptationId,
                    sourceLanguage: translation.sourceLanguage,
                    targetLanguage: translation.targetLanguage,
                    status: translation.status,
                    translatedContent: translation.translatedContent,
                    createdAt: translation.createdAt,
                    updatedAt: translation.updatedAt,
                })),
                versions: versions.map((version) => ({
                    id: version.id,
                    adaptationId: version.adaptationId,
                    content: version.content,
                    kind: version.kind,
                    sourceVersionId: version.sourceVersionId,
                    meta: version.meta,
                    createdAt: version.createdAt,
                })),
                createdAt: adaptation.createdAt,
                updatedAt: adaptation.updatedAt,
            };
        }));
        return {
            id: article.id,
            projectId: article.projectId,
            status: article.status,
            paused: article.paused,
            releasePlanSnapshot: article.releasePlanSnapshot,
            original: article.original,
            adaptations: adaptationRows,
            createdAt: article.createdAt,
            updatedAt: article.updatedAt,
        };
    }
};
GetArticleHandler = __decorate([
    QueryHandler(GetArticleQuery),
    __metadata("design:paramtypes", [ArticleRepository,
        ChannelAdaptationRepository,
        AdaptationVersionRepository,
        TranslationRepository])
], GetArticleHandler);
export { GetArticleHandler };
//# sourceMappingURL=get-article.handler.js.map