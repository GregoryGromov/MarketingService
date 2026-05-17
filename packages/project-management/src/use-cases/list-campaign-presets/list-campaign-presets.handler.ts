import { Inject } from '@nestjs/common';
import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import { CampaignPresetRepository } from '../../domain/campaign-preset.repository.js';
import { ListCampaignPresetsQuery } from './list-campaign-presets.query.js';

export interface ListCampaignPresetPublicationResultItem {
  id: string;
  dayOffset: number;
  localTime: string;
  channel: string;
  language: string;
  publicationType: string;
  style: string;
  position: number;
  createdAt: Date;
}

export interface ListCampaignPresetsResultItem {
  id: string;
  name: string;
  description: string;
  sourceLanguage: string;
  sourceType: string;
  isActive: boolean;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
  publications: ListCampaignPresetPublicationResultItem[];
}

@QueryHandler(ListCampaignPresetsQuery)
export class ListCampaignPresetsHandler
  implements
    IQueryHandler<ListCampaignPresetsQuery, ListCampaignPresetsResultItem[]>
{
  constructor(
    @Inject(CampaignPresetRepository)
    private readonly campaignPresetRepository: CampaignPresetRepository,
  ) {}

  async execute(query: ListCampaignPresetsQuery): Promise<ListCampaignPresetsResultItem[]> {
    const presets = await this.campaignPresetRepository.findAll();
    const visiblePresets = query.includeInactive
      ? presets
      : presets.filter((preset) => preset.isActive);

    return [...visiblePresets]
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((preset) => ({
        id: preset.id,
        name: preset.name,
        description: preset.description,
        sourceLanguage: preset.sourceLanguage,
        sourceType: preset.sourceType,
        isActive: preset.isActive,
        isSystem: preset.isSystem,
        createdAt: preset.createdAt,
        updatedAt: preset.updatedAt,
        publications: preset.publications.map((publication) => ({
          id: publication.id,
          dayOffset: publication.dayOffset,
          localTime: publication.localTime,
          channel: publication.channel,
          language: publication.language,
          publicationType: publication.publicationType,
          style: publication.style,
          position: publication.position,
          createdAt: publication.createdAt,
        })),
      }));
  }
}
