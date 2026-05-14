import {
  ListCampaignPresetsQuery,
  type ListCampaignPresetsResultItem,
} from '@marketing-service/project-management';
import { Controller, Get, Inject } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

@Controller('campaign-presets')
export class CampaignPresetController {
  constructor(
    @Inject(QueryBus)
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  async list(): Promise<ListCampaignPresetsResultItem[]> {
    return this.queryBus.execute(new ListCampaignPresetsQuery());
  }
}
