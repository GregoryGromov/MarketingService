import {
  CreateCampaignCommand,
  CreateProjectCommand,
  CreateProjectMarkerCommand,
  CreateProjectMarkerPlacementCommand,
  DeleteProjectMarkerCommand,
  GetProjectMarkerPlacementsQuery,
  GetProjectQuery,
  ListProjectCampaignsQuery,
  ListProjectMarkersQuery,
  ListProjectsQuery,
  UpdateProjectBrandMemoryCommand,
  type BrandMemory,
  type ProjectId,
  type ProjectMarkerId,
} from '@marketing-service/project-management';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import * as v from 'valibot';
import { rethrowProjectManagementHttpError } from './project-management-http-error';
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

const BrandMemoryDocumentSchema = v.object({
  title: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(180)),
  url: v.optional(v.nullish(v.pipe(v.string(), v.trim(), v.maxLength(1000)))),
  notes: v.optional(v.nullish(v.pipe(v.string(), v.trim(), v.maxLength(2000)))),
});

const GlossarySchema = v.record(
  v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(120)),
  v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(300)),
);

const UpdateProjectBrandMemorySchema = v.object({
  brandName: v.optional(v.nullish(v.pipe(v.string(), v.trim(), v.maxLength(120)))),
  productDescription: v.optional(v.nullish(v.pipe(v.string(), v.trim(), v.maxLength(4000)))),
  targetAudience: v.optional(v.nullish(v.pipe(v.string(), v.trim(), v.maxLength(2000)))),
  approvedFacts: v.optional(
    v.nullish(v.array(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(500)))),
  ),
  forbiddenClaims: v.optional(
    v.nullish(v.array(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(500)))),
  ),
  glossary: v.optional(v.nullish(GlossarySchema)),
  bannedPhrases: v.optional(
    v.nullish(v.array(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(240)))),
  ),
  requiredPhrases: v.optional(
    v.nullish(v.array(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(240)))),
  ),
  brandDocs: v.optional(v.nullish(v.array(BrandMemoryDocumentSchema))),
});

const CreateCampaignSchema = v.object({
  presetId: v.pipe(v.string(), v.trim(), v.minLength(1)),
  name: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(160)),
  startDate: v.pipe(v.string(), v.trim(), v.minLength(1)),
  sourceLanguage: v.optional(v.nullish(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(16)))),
  extraInstructions: v.optional(v.nullish(v.pipe(v.string(), v.trim(), v.maxLength(5000)))),
});

type CreateProjectDto = v.InferOutput<typeof CreateProjectSchema>;
type CreateProjectMarkerDto = v.InferOutput<typeof CreateProjectMarkerSchema>;
type CreateProjectMarkerPlacementDto = v.InferOutput<typeof CreateProjectMarkerPlacementSchema>;
type UpdateProjectBrandMemoryDto = v.InferOutput<typeof UpdateProjectBrandMemorySchema>;
type CreateCampaignDto = v.InferOutput<typeof CreateCampaignSchema>;

function parseDateInput(value: string, field: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`${field} must be a valid ISO date string`);
  }

  return date;
}

function normalizeBrandMemoryUpdate(
  dto: UpdateProjectBrandMemoryDto,
): Partial<BrandMemory> {
  return {
    ...(dto.brandName !== undefined ? { brandName: dto.brandName } : {}),
    ...(dto.productDescription !== undefined
      ? { productDescription: dto.productDescription }
      : {}),
    ...(dto.targetAudience !== undefined ? { targetAudience: dto.targetAudience } : {}),
    ...(dto.approvedFacts !== undefined
      ? { approvedFacts: dto.approvedFacts ?? [] }
      : {}),
    ...(dto.forbiddenClaims !== undefined
      ? { forbiddenClaims: dto.forbiddenClaims ?? [] }
      : {}),
    ...(dto.glossary !== undefined ? { glossary: dto.glossary ?? {} } : {}),
    ...(dto.bannedPhrases !== undefined
      ? { bannedPhrases: dto.bannedPhrases ?? [] }
      : {}),
    ...(dto.requiredPhrases !== undefined
      ? { requiredPhrases: dto.requiredPhrases ?? [] }
      : {}),
    ...(dto.brandDocs !== undefined
      ? {
          brandDocs: (dto.brandDocs ?? []).map((doc) => ({
            title: doc.title,
            url: doc.url ?? null,
            notes: doc.notes ?? null,
          })),
        }
      : {}),
  };
}

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

  @Get(':id/brand-memory')
  async getBrandMemory(@Param('id') id: string): Promise<{
    projectId: string;
    brandMemory: BrandMemory;
    updatedAt: Date;
  }> {
    const project = await this.queryBus.execute(new GetProjectQuery(id as ProjectId));

    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }

    return {
      projectId: project.id,
      brandMemory: project.brandMemory,
      updatedAt: project.updatedAt,
    };
  }

  @Put(':id/brand-memory')
  async updateBrandMemory(
    @Param('id') id: string,
    @Body(new ValibotPipe(UpdateProjectBrandMemorySchema)) dto: UpdateProjectBrandMemoryDto,
  ) {
    try {
      return await this.commandBus.execute(
        new UpdateProjectBrandMemoryCommand(
          id as ProjectId,
          normalizeBrandMemoryUpdate(dto),
        ),
      );
    } catch (error) {
      rethrowProjectManagementHttpError(error);
    }
  }

  @Get(':id/campaigns')
  async listCampaigns(@Param('id') id: string) {
    const campaigns = await this.queryBus.execute(
      new ListProjectCampaignsQuery(id as ProjectId),
    );

    if (!campaigns) {
      throw new NotFoundException(`Project ${id} not found`);
    }

    return campaigns;
  }

  @Post(':id/campaigns')
  async createCampaign(
    @Param('id') id: string,
    @Body(new ValibotPipe(CreateCampaignSchema)) dto: CreateCampaignDto,
  ) {
    try {
      return await this.commandBus.execute(
        new CreateCampaignCommand(
          id as ProjectId,
          dto.presetId,
          dto.name,
          parseDateInput(dto.startDate, 'startDate'),
          dto.sourceLanguage ?? undefined,
          dto.extraInstructions ?? null,
        ),
      );
    } catch (error) {
      rethrowProjectManagementHttpError(error);
    }
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
