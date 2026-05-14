import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, type ICommandHandler } from '@nestjs/cqrs';
import type { BrandMemory } from '../../domain/project.aggregate.js';
import { ProjectRepository } from '../../domain/project.repository.js';
import { UpdateProjectBrandMemoryCommand } from './update-project-brand-memory.command.js';

export interface UpdateProjectBrandMemoryResult {
  projectId: string;
  brandMemory: BrandMemory;
  updatedAt: Date;
}

@CommandHandler(UpdateProjectBrandMemoryCommand)
export class UpdateProjectBrandMemoryHandler
  implements
    ICommandHandler<
      UpdateProjectBrandMemoryCommand,
      UpdateProjectBrandMemoryResult
    >
{
  constructor(
    @Inject(ProjectRepository)
    private readonly projectRepository: ProjectRepository,
    @Inject(EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    command: UpdateProjectBrandMemoryCommand,
  ): Promise<UpdateProjectBrandMemoryResult> {
    const project = await this.projectRepository.findById(command.projectId);
    if (!project) {
      throw new Error(`Project ${command.projectId} not found`);
    }

    project.updateBrandMemory(command.brandMemory);
    await this.projectRepository.save(project);
    this.eventBus.publishAll(project.pullEvents());

    return {
      projectId: project.id,
      brandMemory: project.brandMemory,
      updatedAt: project.updatedAt,
    };
  }
}
