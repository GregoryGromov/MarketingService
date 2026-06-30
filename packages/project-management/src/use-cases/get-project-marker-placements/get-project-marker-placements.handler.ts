import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ProjectMarkerPlacementRepository } from '../../domain/project-marker-placement.repository.js';
import { GetProjectMarkerPlacementsQuery } from './get-project-marker-placements.query.js';

export interface GetProjectMarkerPlacementsResultItem {
  id: string;
  markerId: string;
  projectId: string;
  channelId: string;
  targetLanguage: string;
  marketCountry: string | null;
  marketLocationName: string | null;
  publishAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

@QueryHandler(GetProjectMarkerPlacementsQuery)
export class GetProjectMarkerPlacementsHandler
  implements IQueryHandler<GetProjectMarkerPlacementsQuery, GetProjectMarkerPlacementsResultItem[]>
{
  constructor(
    @Inject(ProjectMarkerPlacementRepository)
    private readonly projectMarkerPlacementRepository: ProjectMarkerPlacementRepository,
  ) {}

  async execute(
    query: GetProjectMarkerPlacementsQuery,
  ): Promise<GetProjectMarkerPlacementsResultItem[]> {
    const placements = await this.projectMarkerPlacementRepository.findByProjectId(
      query.projectId,
      {
        from: query.from,
        to: query.to,
      },
    );

    return placements.map((placement) => ({
      id: placement.id,
      markerId: placement.markerId,
      projectId: placement.projectId,
      channelId: placement.channelId,
      targetLanguage: placement.targetLanguage,
      marketCountry: placement.marketCountry,
      marketLocationName: placement.marketLocationName,
      publishAt: placement.publishAt,
      createdAt: placement.createdAt,
      updatedAt: placement.updatedAt,
    }));
  }
}
