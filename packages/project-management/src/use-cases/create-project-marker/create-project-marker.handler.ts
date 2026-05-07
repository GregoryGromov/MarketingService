import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, type ICommandHandler } from '@nestjs/cqrs';
import { ProjectRepository } from '../../domain/project.repository.js';
import { ProjectMarker } from '../../domain/project-marker.aggregate.js';
import { ProjectMarkerRepository } from '../../domain/project-marker.repository.js';
import { CreateProjectMarkerCommand } from './create-project-marker.command.js';

const MARKER_COLOR_THEMES = [
  { bg: '#fff3e8', border: '#ffd7b3', text: '#b54708' },
  { bg: '#ebfff4', border: '#c9f0d9', text: '#117a43' },
  { bg: '#fff0f5', border: '#ffc9dc', text: '#b42363' },
  { bg: '#f5edff', border: '#dcc9ff', text: '#6f42c1' },
  { bg: '#e8fbff', border: '#bdebf5', text: '#0c6b7a' },
  { bg: '#eaf0ff', border: '#cfdbff', text: '#173b93' },
];

@CommandHandler(CreateProjectMarkerCommand)
export class CreateProjectMarkerHandler
  implements ICommandHandler<CreateProjectMarkerCommand, string>
{
  constructor(
    @Inject(ProjectRepository)
    private readonly projectRepository: ProjectRepository,
    @Inject(ProjectMarkerRepository)
    private readonly projectMarkerRepository: ProjectMarkerRepository,
    @Inject(EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateProjectMarkerCommand): Promise<string> {
    const project = await this.projectRepository.findById(command.projectId);
    if (!project) {
      throw new Error(`Project ${command.projectId} not found`);
    }

    const existingMarkers = await this.projectMarkerRepository.findByProjectId(command.projectId);
    const theme = MARKER_COLOR_THEMES[existingMarkers.length % MARKER_COLOR_THEMES.length];
    const marker = ProjectMarker.create({
      projectId: command.projectId,
      title: command.title,
      notes: command.notes,
      colorBg: theme.bg,
      colorBorder: theme.border,
      colorText: theme.text,
    });

    await this.projectMarkerRepository.save(marker);
    this.eventBus.publishAll(marker.pullEvents());

    return marker.id;
  }
}
