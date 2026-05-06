import { Inject } from '@nestjs/common';
import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import { ProjectRepository } from '../../domain/project.repository.js';
import { GetProjectQuery } from './get-project.query.js';

export interface GetProjectResult {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

@QueryHandler(GetProjectQuery)
export class GetProjectHandler implements IQueryHandler<GetProjectQuery, GetProjectResult | null> {
  constructor(
    @Inject(ProjectRepository)
    private readonly projectRepository: ProjectRepository,
  ) {}

  async execute(query: GetProjectQuery): Promise<GetProjectResult | null> {
    const project = await this.projectRepository.findById(query.projectId);

    if (!project) {
      return null;
    }

    return {
      id: project.id,
      name: project.name,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }
}
