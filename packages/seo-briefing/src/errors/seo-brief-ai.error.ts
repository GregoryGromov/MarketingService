import type { SeoBriefJsonValue } from '../domain/seo-briefing.types.js';

export class SeoBriefAiConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SeoBriefAiConfigurationError';
  }
}

export class SeoBriefAiTransportError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly provider: string,
    public readonly status: number | null,
    public readonly responsePayload: SeoBriefJsonValue | null = null,
  ) {
    super(message);
    this.name = 'SeoBriefAiTransportError';
  }
}

export class SeoBriefAiValidationError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly provider: string,
    public readonly responsePayload: SeoBriefJsonValue | null = null,
  ) {
    super(message);
    this.name = 'SeoBriefAiValidationError';
  }
}
