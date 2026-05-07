import { Inject } from '@nestjs/common';
import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import { PublicationPlanRepository } from '../../domain/publication-plan.repository.js';
import { GetArticlePublicationPlansQuery } from './get-article-publication-plans.query.js';

export interface GetArticlePublicationPlansResultItem {
  id: string;
  articleId: string;
  projectId: string;
  channelId: string;
  targetLanguage: string;
  publishAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

@QueryHandler(GetArticlePublicationPlansQuery)
export class GetArticlePublicationPlansHandler
  implements IQueryHandler<GetArticlePublicationPlansQuery, GetArticlePublicationPlansResultItem[]>
{
  constructor(
    @Inject(PublicationPlanRepository)
    private readonly publicationPlanRepository: PublicationPlanRepository,
  ) {}

  async execute(query: GetArticlePublicationPlansQuery): Promise<GetArticlePublicationPlansResultItem[]> {
    const plans = await this.publicationPlanRepository.findByArticleId(query.articleId);

    return plans.map((plan) => ({
      id: plan.id,
      articleId: plan.articleId,
      projectId: plan.projectId,
      channelId: plan.channelId,
      targetLanguage: plan.targetLanguage,
      publishAt: plan.publishAt,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    }));
  }
}
