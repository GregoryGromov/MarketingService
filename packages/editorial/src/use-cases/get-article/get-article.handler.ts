import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
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

@QueryHandler(GetArticleQuery)
export class GetArticleHandler implements IQueryHandler<GetArticleQuery> {
  constructor(
    private readonly articleRepository: ArticleRepository,
    private readonly channelAdaptationRepository: ChannelAdaptationRepository,
    private readonly adaptationVersionRepository: AdaptationVersionRepository,
    private readonly translationRepository: TranslationRepository,
  ) {}

  async execute(query: GetArticleQuery) {
    const article = await this.articleRepository.findById(query.articleId);

    if (!article) {
      return null;
    }

    const adaptations = await this.channelAdaptationRepository.findByArticleId(query.articleId);

    const adaptationRows = await Promise.all(
      adaptations.map(async (adaptation) => {
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
      }),
    );

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
    } satisfies GetArticleResult;
  }
}
