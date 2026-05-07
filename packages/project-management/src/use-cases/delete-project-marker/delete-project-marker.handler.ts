import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ProjectRepository } from '../../domain/project.repository.js';
import { ProjectMarkerRepository } from '../../domain/project-marker.repository.js';
import { ProjectMarkerPlacementRepository } from '../../domain/project-marker-placement.repository.js';
import { DeleteProjectMarkerCommand } from './delete-project-marker.command.js';

@CommandHandler(DeleteProjectMarkerCommand)
export class DeleteProjectMarkerHandler
  implements ICommandHandler<DeleteProjectMarkerCommand, void>
{
  constructor(
    @Inject(ProjectRepository)
    private readonly projectRepository: ProjectRepository,
    @Inject(ProjectMarkerRepository)
    private readonly projectMarkerRepository: ProjectMarkerRepository,
    @Inject(ProjectMarkerPlacementRepository)
    private readonly projectMarkerPlacementRepository: ProjectMarkerPlacementRepository,
  ) {}

  async execute(command: DeleteProjectMarkerCommand): Promise<void> {
    const project = await this.projectRepository.findById(command.projectId);
    if (!project) {
      throw new Error(`Project ${command.projectId} not found`);
    }

    const marker = await this.projectMarkerRepository.findById(command.markerId);
    if (!marker || marker.projectId !== command.projectId) {
      throw new Error(`Marker ${command.markerId} not found in project ${command.projectId}`);
    }

    await this.projectMarkerPlacementRepository.deleteByMarkerId(command.markerId);
    await this.projectMarkerRepository.deleteById(command.markerId);
  }
}
