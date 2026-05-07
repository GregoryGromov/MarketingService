import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ProjectMarkerRepository } from '../../domain/project-marker.repository.js';
import { ListProjectMarkersQuery } from './list-project-markers.query.js';

export interface ListProjectMarkersResultItem {
  id: string;
  projectId: string;
  title: string;
  notes: string | null;
  colorBg: string;
  colorBorder: string;
  colorText: string;
  createdAt: Date;
  updatedAt: Date;
}

@QueryHandler(ListProjectMarkersQuery)
export class ListProjectMarkersHandler
  implements IQueryHandler<ListProjectMarkersQuery, ListProjectMarkersResultItem[]>
{
  constructor(
    @Inject(ProjectMarkerRepository)
    private readonly projectMarkerRepository: ProjectMarkerRepository,
  ) {}

  async execute(query: ListProjectMarkersQuery): Promise<ListProjectMarkersResultItem[]> {
    const markers = await this.projectMarkerRepository.findByProjectId(query.projectId);

    return markers.map((marker) => ({
      id: marker.id,
      projectId: marker.projectId,
      title: marker.title,
      notes: marker.notes,
      colorBg: marker.colorBg,
      colorBorder: marker.colorBorder,
      colorText: marker.colorText,
      createdAt: marker.createdAt,
      updatedAt: marker.updatedAt,
    }));
  }
}
