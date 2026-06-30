import type { SeoBriefJsonValue } from '../domain/seo-briefing.types.js';

export class SeoResearchConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SeoResearchConfigurationError';
  }
}

export class SeoResearchTransportError extends Error {
  constructor(
    message: string,
    public readonly endpoint: string,
    public readonly provider: string,
    public readonly status: number | null,
    public readonly responsePayload: SeoBriefJsonValue | null = null,
  ) {
    super(message);
    this.name = 'SeoResearchTransportError';
  }
}

export class SeoResearchValidationError extends Error {
  constructor(
    message: string,
    public readonly endpoint: string,
    public readonly provider: string,
    public readonly responsePayload: SeoBriefJsonValue | null = null,
  ) {
    super(message);
    this.name = 'SeoResearchValidationError';
  }
}
