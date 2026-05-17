import {
  CreateCampaignPresetCommand,
  ListCampaignPresetsQuery,
  type ListCampaignPresetsResultItem,
  UpdateCampaignPresetCommand,
} from '@marketing-service/project-management';
import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import * as v from 'valibot';
import { ValibotPipe } from '../infrastructure/common/valibot-validation.pipe';
import { normalizePublicationTypeInput } from './publication-type-input';

const CampaignPresetPublicationSchema = v.object({
  dayOffset: v.number(),
  localTime: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(16)),
  channel: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(64)),
  language: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(16)),
  publicationType: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(64)),
  style: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(64)),
  position: v.number(),
});

const CampaignPresetSchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(160)),
  description: v.pipe(v.string(), v.trim(), v.maxLength(2000)),
  sourceLanguage: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(16)),
  sourceType: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(64)),
  isActive: v.boolean(),
  publications: v.array(CampaignPresetPublicationSchema),
});

type CampaignPresetDto = v.InferOutput<typeof CampaignPresetSchema>;

function normalizePresetPublications(dto: CampaignPresetDto): CampaignPresetDto['publications'] {
  return dto.publications.map((publication) => {
    const publicationType = normalizePublicationTypeInput(
      publication.channel,
      publication.publicationType,
      'publicationType',
    );

    return {
      ...publication,
      publicationType,
    };
  });
}

@Controller('campaign-presets')
export class CampaignPresetController {
  constructor(
    @Inject(CommandBus)
    private readonly commandBus: CommandBus,
    @Inject(QueryBus)
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  async list(@Query('all') all?: string): Promise<ListCampaignPresetsResultItem[]> {
    return this.queryBus.execute(
      new ListCampaignPresetsQuery(all === '1' || all === 'true'),
    );
  }

  @Post()
  async create(
    @Body(new ValibotPipe(CampaignPresetSchema)) dto: CampaignPresetDto,
  ): Promise<{ id: string }> {
    const publications = normalizePresetPublications(dto);
    return this.commandBus.execute(
      new CreateCampaignPresetCommand(
        dto.name,
        dto.description,
        dto.sourceLanguage,
        dto.sourceType,
        publications,
        dto.isActive,
      ),
    );
  }

  @Post(':id')
  async update(
    @Param('id') id: string,
    @Body(new ValibotPipe(CampaignPresetSchema)) dto: CampaignPresetDto,
  ): Promise<{ id: string }> {
    const publications = normalizePresetPublications(dto);
    return this.commandBus.execute(
      new UpdateCampaignPresetCommand(
        id as never,
        dto.name,
        dto.description,
        dto.sourceLanguage,
        dto.sourceType,
        publications,
        dto.isActive,
      ),
    );
  }
}
