import {
  CreateProjectCommand,
  CreateProjectMarkerCommand,
  CreateProjectMarkerPlacementCommand,
  DeleteProjectMarkerCommand,
  GetProjectMarkerPlacementsQuery,
  GetProjectQuery,
  ListProjectMarkersQuery,
  ListProjectsQuery,
  type ProjectId,
  type ProjectMarkerId,
} from '@marketing-service/project-management';
import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import * as v from 'valibot';
import { ValibotPipe } from '../infrastructure/common/valibot-validation.pipe';

const CreateProjectSchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(120)),
});

const CreateProjectMarkerSchema = v.object({
  title: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(180)),
  notes: v.optional(v.nullish(v.pipe(v.string(), v.trim(), v.maxLength(2000)))),
});

const CreateProjectMarkerPlacementSchema = v.object({
  markerId: v.pipe(v.string(), v.trim(), v.minLength(1)),
  channelId: v.pipe(v.string(), v.trim(), v.minLength(1)),
  targetLanguage: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(16)),
  publishAt: v.pipe(v.string(), v.trim(), v.minLength(1)),
});

type CreateProjectDto = v.InferOutput<typeof CreateProjectSchema>;
type CreateProjectMarkerDto = v.InferOutput<typeof CreateProjectMarkerSchema>;
type CreateProjectMarkerPlacementDto = v.InferOutput<typeof CreateProjectMarkerPlacementSchema>;

@Controller('projects')
export class ProjectController {
  constructor(
    @Inject(CommandBus)
    private readonly commandBus: CommandBus,
    @Inject(QueryBus)
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  async create(
    @Body(new ValibotPipe(CreateProjectSchema)) dto: CreateProjectDto,
  ): Promise<{ id: string }> {
    const id = await this.commandBus.execute(new CreateProjectCommand(dto.name));

    return { id };
  }

  @Get()
  async list() {
    return this.queryBus.execute(new ListProjectsQuery());
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const project = await this.queryBus.execute(new GetProjectQuery(id as ProjectId));

    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }

    return project;
  }

  @Get(':id/markers')
  async listMarkers(@Param('id') id: string) {
    return this.queryBus.execute(new ListProjectMarkersQuery(id as ProjectId));
  }

  @Post(':id/markers')
  async createMarker(
    @Param('id') id: string,
    @Body(new ValibotPipe(CreateProjectMarkerSchema)) dto: CreateProjectMarkerDto,
  ): Promise<{ id: string }> {
    const markerId = await this.commandBus.execute(
      new CreateProjectMarkerCommand(id as ProjectId, dto.title, dto.notes ?? null),
    );

    return { id: markerId };
  }

  @Delete(':id/markers/:markerId')
  async deleteMarker(
    @Param('id') id: string,
    @Param('markerId') markerId: string,
  ): Promise<{ ok: true }> {
    await this.commandBus.execute(
      new DeleteProjectMarkerCommand(id as ProjectId, markerId as ProjectMarkerId),
    );

    return { ok: true };
  }

  @Get(':id/marker-placements')
  async listMarkerPlacements(
    @Param('id') id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.queryBus.execute(
      new GetProjectMarkerPlacementsQuery(
        id as ProjectId,
        from ? new Date(from) : null,
        to ? new Date(to) : null,
      ),
    );
  }

  @Post(':id/marker-placements')
  async createMarkerPlacement(
    @Param('id') id: string,
    @Body(new ValibotPipe(CreateProjectMarkerPlacementSchema)) dto: CreateProjectMarkerPlacementDto,
  ): Promise<{ id: string }> {
    return this.commandBus.execute(
      new CreateProjectMarkerPlacementCommand(
        id as ProjectId,
        dto.markerId as ProjectMarkerId,
        dto.channelId,
        dto.targetLanguage,
        new Date(dto.publishAt),
      ),
    );
  }
}
