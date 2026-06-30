import {
  type SeoBriefJsonValue,
  SeoResearchConfigurationError,
  SeoResearchTransportError,
} from '@marketing-service/seo-briefing';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DataForSeoHttpClientPort,
  type DataForSeoHttpRequest,
  type DataForSeoHttpResponse,
} from './dataforseo-http-client.port.js';

@Injectable()
export class FetchDataForSeoHttpClient extends DataForSeoHttpClientPort {
  constructor(@Inject(ConfigService) private readonly config: ConfigService) {
    super();
  }

  async request(request: DataForSeoHttpRequest): Promise<DataForSeoHttpResponse> {
    const login = this.config.get<string>('DATAFORSEO_LOGIN')?.trim();
    const password = this.config.get<string>('DATAFORSEO_PASSWORD')?.trim();
    if (!login || !password) {
      throw new SeoResearchConfigurationError(
        'DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD must be configured',
      );
    }

    const baseUrl =
      this.config.get<string>('DATAFORSEO_BASE_URL')?.trim() || 'https://api.dataforseo.com';
    const url = new URL(request.path, baseUrl);
    const auth = Buffer.from(`${login}:${password}`).toString('base64');

    let response: Response;
    try {
      response = await fetch(url, {
        method: request.method,
        headers: {
          authorization: `Basic ${auth}`,
          'content-type': 'application/json',
        },
        body:
          request.method === 'POST' && request.payload !== undefined
            ? JSON.stringify([request.payload])
            : undefined,
        signal: AbortSignal.timeout(request.timeoutMs),
      });
    } catch (error) {
      throw new SeoResearchTransportError(
        error instanceof Error ? error.message : 'DataForSEO request failed',
        request.path,
        'dataforseo',
        null,
      );
    }

    let payload: SeoBriefJsonValue;
    try {
      payload = (await response.json()) as SeoBriefJsonValue;
    } catch (error) {
      throw new SeoResearchTransportError(
        error instanceof Error ? error.message : 'DataForSEO returned invalid JSON',
        request.path,
        'dataforseo',
        response.status,
      );
    }

    if (!response.ok) {
      throw new SeoResearchTransportError(
        `DataForSEO request failed with status ${response.status}`,
        request.path,
        'dataforseo',
        response.status,
        payload,
      );
    }

    return {
      status: response.status,
      payload,
    };
  }
}
