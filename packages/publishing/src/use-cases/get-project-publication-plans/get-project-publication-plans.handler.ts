import { Inject } from '@nestjs/common';
import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import { PublicationRepository } from '../../domain/publication.repository.js';
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
    @Inject(PublicationRepository)
    private readonly publicationRepository: PublicationRepository,
  ) {}

  async execute(query: GetProjectPublicationPlansQuery): Promise<GetProjectPublicationPlansResultItem[]> {
    const [plans, publications] = await Promise.all([
      this.publicationPlanRepository.findByProjectId(query.projectId, {
        from: query.from,
        to: query.to,
      }),
      this.publicationRepository.findByProjectId(query.projectId, {
        from: query.from,
        to: query.to,
      }),
    ]);

    const items = [
      ...plans.map((plan) => ({
        id: plan.id,
        articleId: plan.articleId,
        projectId: plan.projectId,
        channelId: plan.channelId,
        targetLanguage: plan.targetLanguage,
        publishAt: plan.publishAt,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
      })),
      ...publications.map((publication) => ({
        id: publication.id,
        articleId: publication.articleId,
        projectId: query.projectId,
        channelId: publication.channelId,
        targetLanguage: publication.targetLanguage,
        publishAt: publication.publishAt,
        createdAt: publication.createdAt,
        updatedAt: publication.updatedAt,
      })),
    ];

    return items.sort((left, right) => {
      const publishAtDiff = left.publishAt.getTime() - right.publishAt.getTime();
      if (publishAtDiff !== 0) {
        return publishAtDiff;
      }

      return left.createdAt.getTime() - right.createdAt.getTime();
    });
  }
}
