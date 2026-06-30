import type { SeoBriefJsonValue } from '@marketing-service/seo-briefing';

export interface DataForSeoHttpRequest {
  method: 'GET' | 'POST';
  path: string;
  payload?: SeoBriefJsonValue;
  timeoutMs: number;
}

export interface DataForSeoHttpResponse {
  payload: SeoBriefJsonValue;
  status: number;
}

export abstract class DataForSeoHttpClientPort {
  abstract request(request: DataForSeoHttpRequest): Promise<DataForSeoHttpResponse>;
}
