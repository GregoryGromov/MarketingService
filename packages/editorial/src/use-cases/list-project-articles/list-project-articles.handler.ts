import { Inject } from '@nestjs/common';
import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import { AdaptationVersionRepository } from '../../domain/adaptation-version.repository.js';
import { ArticleRepository } from '../../domain/article.repository.js';
import { ChannelAdaptationRepository } from '../../domain/channel-adaptation.repository.js';
import { TranslationRepository } from '../../domain/translation.repository.js';
import { ListProjectArticlesQuery } from './list-project-articles.query.js';

export interface ListProjectArticlesResultItem {
  id: string;
  projectId: string;
  status: string;
  defaultCoverUrl: string | null;
  originalLanguage: string;
  originalTitle: string;
  originalExcerpt: string;
  releasePlanSnapshot: Record<string, unknown> | null;
  adaptationCount: number;
  approvedAdaptationCount: number;
  translationCount: number;
  approvedTranslationCount: number;
  versionCount: number;
  createdAt: Date;
  updatedAt: Date;
}

@QueryHandler(ListProjectArticlesQuery)
export class ListProjectArticlesHandler
  implements IQueryHandler<ListProjectArticlesQuery, ListProjectArticlesResultItem[]>
{
  constructor(
    @Inject(ArticleRepository)
    private readonly articleRepository: ArticleRepository,
    @Inject(ChannelAdaptationRepository)
    private readonly channelAdaptationRepository: ChannelAdaptationRepository,
    @Inject(AdaptationVersionRepository)
    private readonly adaptationVersionRepository: AdaptationVersionRepository,
    @Inject(TranslationRepository)
    private readonly translationRepository: TranslationRepository,
  ) {}

  async execute(query: ListProjectArticlesQuery): Promise<ListProjectArticlesResultItem[]> {
    const articles = await this.articleRepository.findByProjectId(query.projectId);

    const rows = await Promise.all(
      articles.map(async (article) => {
        const adaptations = await this.channelAdaptationRepository.findByArticleId(article.id);
        const translationsByAdaptation = await Promise.all(
          adaptations.map((adaptation) => this.translationRepository.findByAdaptationId(adaptation.id)),
        );
        const versionsByAdaptation = await Promise.all(
          adaptations.map((adaptation) => this.adaptationVersionRepository.findByAdaptationId(adaptation.id)),
        );

        const title = firstMeaningfulLine(article.original.content);
        const excerpt = article.original.content.trim().replace(/\s+/g, ' ').slice(0, 220);
        const translations = translationsByAdaptation.flat();
        const versionCount = versionsByAdaptation.reduce((sum, items) => sum + items.length, 0);

        return {
          id: article.id,
          projectId: article.projectId,
          status: article.status,
          defaultCoverUrl: article.defaultCoverUrl,
          originalLanguage: article.original.language,
          originalTitle: title,
          originalExcerpt: excerpt,
          releasePlanSnapshot: article.releasePlanSnapshot,
          adaptationCount: adaptations.length,
          approvedAdaptationCount: adaptations.filter((item) => item.status === 'approved').length,
          translationCount: translations.length,
          approvedTranslationCount: translations.filter((item) => item.status === 'approved').length,
          versionCount,
          createdAt: article.createdAt,
          updatedAt: article.updatedAt,
        } satisfies ListProjectArticlesResultItem;
      }),
    );

    return rows.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }
}

function firstMeaningfulLine(content: string): string {
  const line = content
    .split(/\r?\n/)
    .map((item) => item.trim())
    .find(Boolean);

  return (line || content.trim() || 'Untitled article').slice(0, 120);
}
