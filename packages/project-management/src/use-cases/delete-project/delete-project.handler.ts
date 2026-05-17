import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ProjectRepository } from '../../domain/project.repository.js';
import { ProjectDeletionPort } from '../../ports/project-deletion.port.js';
import { DeleteProjectCommand } from './delete-project.command.js';

@CommandHandler(DeleteProjectCommand)
export class DeleteProjectHandler implements ICommandHandler<DeleteProjectCommand, void> {
  constructor(
    @Inject(ProjectRepository)
    private readonly projectRepository: ProjectRepository,
    @Inject(ProjectDeletionPort)
    private readonly projectDeletionPort: ProjectDeletionPort,
  ) {}

  async execute(command: DeleteProjectCommand): Promise<void> {
    const project = await this.projectRepository.findById(command.projectId);
    if (!project) {
      throw new Error(`Project ${command.projectId} not found`);
    }

    await this.projectDeletionPort.deleteProjectGraph(command.projectId);
  }
}
