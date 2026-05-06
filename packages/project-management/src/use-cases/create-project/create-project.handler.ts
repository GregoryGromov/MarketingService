import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, type ICommandHandler } from '@nestjs/cqrs';
import { Project } from '../../domain/project.aggregate.js';
import { ProjectRepository } from '../../domain/project.repository.js';
import { CreateProjectCommand } from './create-project.command.js';

@CommandHandler(CreateProjectCommand)
export class CreateProjectHandler implements ICommandHandler<CreateProjectCommand, string> {
  constructor(
    @Inject(ProjectRepository)
    private readonly projectRepository: ProjectRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateProjectCommand): Promise<string> {
    const project = Project.create({ name: command.name });

    await this.projectRepository.save(project);
    this.eventBus.publishAll(project.pullEvents());

    return project.id;
  }
}
