import { Inject } from '@nestjs/common';
import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import { ProjectRepository } from '../../domain/project.repository.js';
import { ListProjectsQuery } from './list-projects.query.js';

export interface ListProjectsResultItem {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

@QueryHandler(ListProjectsQuery)
export class ListProjectsHandler implements IQueryHandler<ListProjectsQuery, ListProjectsResultItem[]> {
  constructor(
    @Inject(ProjectRepository)
    private readonly projectRepository: ProjectRepository,
  ) {}

  async execute(): Promise<ListProjectsResultItem[]> {
    const projects = await this.projectRepository.findAll();

    return projects.map((project) => ({
      id: project.id,
      name: project.name,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }));
  }
}
