import { Inject } from '@nestjs/common';
import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import { PublicationPlanRepository } from '../../domain/publication-plan.repository.js';
import { GetProjectPublicationPlansQuery } from './get-project-publication-plans.query.js';

export interface GetProjectPublicationPlansResultItem {
  id: string;
  articleId: string;
  projectId: string;
  channelId: string;
  targetLanguage: string;
  publishAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

@QueryHandler(GetProjectPublicationPlansQuery)
export class GetProjectPublicationPlansHandler
  implements IQueryHandler<GetProjectPublicationPlansQuery, GetProjectPublicationPlansResultItem[]>
{
  constructor(
    @Inject(PublicationPlanRepository)
    private readonly publicationPlanRepository: PublicationPlanRepository,
  ) {}

  async execute(query: GetProjectPublicationPlansQuery): Promise<GetProjectPublicationPlansResultItem[]> {
    const plans = await this.publicationPlanRepository.findByProjectId(query.projectId, {
      from: query.from,
      to: query.to,
    });

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
