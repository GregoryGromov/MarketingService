import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ProjectRepository } from '../../domain/project.repository.js';
import { ProjectMarkerPlacementRepository } from '../../domain/project-marker-placement.repository.js';
import { DeleteProjectMarkerPlacementCommand } from './delete-project-marker-placement.command.js';

@CommandHandler(DeleteProjectMarkerPlacementCommand)
export class DeleteProjectMarkerPlacementHandler
  implements ICommandHandler<DeleteProjectMarkerPlacementCommand, void>
{
  constructor(
    @Inject(ProjectRepository)
    private readonly projectRepository: ProjectRepository,
    @Inject(ProjectMarkerPlacementRepository)
    private readonly projectMarkerPlacementRepository: ProjectMarkerPlacementRepository,
  ) {}

  async execute(command: DeleteProjectMarkerPlacementCommand): Promise<void> {
    const project = await this.projectRepository.findById(command.projectId);
    if (!project) {
      throw new Error(`Project ${command.projectId} not found`);
    }

    const placement = await this.projectMarkerPlacementRepository.findById(command.placementId);
    if (!placement || placement.projectId !== command.projectId) {
      throw new Error(
        `Marker placement ${command.placementId} not found in project ${command.projectId}`,
      );
    }

    await this.projectMarkerPlacementRepository.deleteById(command.placementId);
  }
}
