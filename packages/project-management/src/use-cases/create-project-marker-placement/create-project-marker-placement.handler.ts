import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, type ICommandHandler } from '@nestjs/cqrs';
import { ProjectRepository } from '../../domain/project.repository.js';
import { ProjectMarkerRepository } from '../../domain/project-marker.repository.js';
import { ProjectMarkerPlacement } from '../../domain/project-marker-placement.aggregate.js';
import { ProjectMarkerPlacementRepository } from '../../domain/project-marker-placement.repository.js';
import { CreateProjectMarkerPlacementCommand } from './create-project-marker-placement.command.js';

@CommandHandler(CreateProjectMarkerPlacementCommand)
export class CreateProjectMarkerPlacementHandler
  implements ICommandHandler<CreateProjectMarkerPlacementCommand, { id: string }>
{
  constructor(
    @Inject(ProjectRepository)
    private readonly projectRepository: ProjectRepository,
    @Inject(ProjectMarkerRepository)
    private readonly projectMarkerRepository: ProjectMarkerRepository,
    @Inject(ProjectMarkerPlacementRepository)
    private readonly projectMarkerPlacementRepository: ProjectMarkerPlacementRepository,
    @Inject(EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateProjectMarkerPlacementCommand): Promise<{ id: string }> {
    const project = await this.projectRepository.findById(command.projectId);
    if (!project) {
      throw new Error(`Project ${command.projectId} not found`);
    }

    const marker = await this.projectMarkerRepository.findById(command.markerId);
    if (!marker || marker.projectId !== command.projectId) {
      throw new Error(`Marker ${command.markerId} not found in project ${command.projectId}`);
    }

    const existing = await this.projectMarkerPlacementRepository.findByLogicalKey(
      command.markerId,
      command.channelId,
      command.targetLanguage,
      command.publishAt,
    );

    if (existing) {
      return { id: existing.id };
    }

    const placement = ProjectMarkerPlacement.create({
      markerId: command.markerId,
      projectId: command.projectId,
      channelId: command.channelId,
      targetLanguage: command.targetLanguage,
      publishAt: command.publishAt,
    });

    await this.projectMarkerPlacementRepository.save(placement);
    this.eventBus.publishAll(placement.pullEvents());

    return { id: placement.id };
  }
}
