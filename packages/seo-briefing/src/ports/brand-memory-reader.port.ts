import type { SeoBriefBrandMemorySnapshot } from '../domain/seo-briefing.types.js';

export interface BrandMemoryReadResult {
  projectId: string;
  projectName: string;
  brandMemorySnapshot: SeoBriefBrandMemorySnapshot;
}

export abstract class BrandMemoryReaderPort {
  abstract readByProjectId(projectId: string): Promise<BrandMemoryReadResult | null>;
}
