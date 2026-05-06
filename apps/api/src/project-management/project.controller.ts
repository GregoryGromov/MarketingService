import { Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  CreateProjectCommand,
  GetProjectQuery,
  ListProjectsQuery,
  type ProjectId,
} from '@marketing-service/project-management';
import * as v from 'valibot';
import { ValibotPipe } from '../infrastructure/common/valibot-validation.pipe';

const CreateProjectSchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(120)),
});

type CreateProjectDto = v.InferOutput<typeof CreateProjectSchema>;

@Controller('projects')
export class ProjectController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  async create(
    @Body(new ValibotPipe(CreateProjectSchema)) dto: CreateProjectDto,
  ): Promise<{ id: string }> {
    const id = await this.commandBus.execute(
      new CreateProjectCommand(dto.name),
    );

    return { id };
  }

  @Get()
  async list() {
    return this.queryBus.execute(new ListProjectsQuery());
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const project = await this.queryBus.execute(
      new GetProjectQuery(id as ProjectId),
    );

    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }

    return project;
  }
}
