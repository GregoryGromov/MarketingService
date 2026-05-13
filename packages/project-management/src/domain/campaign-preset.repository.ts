import type { CampaignPreset, CampaignPresetId } from './campaign-preset.aggregate.js';

export abstract class CampaignPresetRepository {
  abstract findById(id: CampaignPresetId): Promise<CampaignPreset | null>;
  abstract findAll(): Promise<CampaignPreset[]>;
  abstract findActiveSystemPresets(): Promise<CampaignPreset[]>;
  abstract save(preset: CampaignPreset): Promise<void>;
}
