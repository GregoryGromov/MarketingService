import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import {
  DiscordPublisherPort,
  type PublishDiscordMessageParams,
  type PublishDiscordMessageResult,
} from '@marketing-service/editorial';

interface DiscordWebhookResponse {
  id?: string;
  guild_id?: string;
  channel_id?: string;
  message?: string;
  code?: number;
}

const DISCORD_CONTENT_CHARACTER_LIMIT = 2000;

@Injectable()
export class DiscordWebhookPublisher extends DiscordPublisherPort {
  constructor(private readonly config: ConfigService) {
    super();
  }

  async publishMessage(params: PublishDiscordMessageParams): Promise<PublishDiscordMessageResult> {
    const webhookUrl = this.config.get<string>('DISCORD_WEBHOOK_URL');
    const textLength = Array.from(params.text).length;

    if (!webhookUrl) {
      throw new Error('DISCORD_WEBHOOK_URL is not configured');
    }

    if (textLength > DISCORD_CONTENT_CHARACTER_LIMIT) {
      throw new Error(
        `Discord publish blocked before request: text is ${textLength} characters, but Discord webhook content must be ${DISCORD_CONTENT_CHARACTER_LIMIT} characters or shorter. Regenerate or edit the publication to fit the Discord limit. ${this.formatPostTextDiagnostics(params.text, textLength)}`,
      );
    }

    const url = webhookUrl.includes('?') ? `${webhookUrl}&wait=true` : `${webhookUrl}?wait=true`;

    const response = await fetch(url, {
      method: 'POST',
      ...(params.imagePath
        ? { body: this.buildMultipartBody(params.text, params.imagePath) }
        : {
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              content: params.text,
            }),
          }),
    });

    const rawBody = await response.text();
    const payload = this.parseResponseBody<DiscordWebhookResponse>(rawBody);

    if (!response.ok) {
      throw new Error(
        `Discord webhook publish failed with ${response.status} ${response.statusText}. ${this.formatPostTextDiagnostics(params.text, textLength)} ${this.describeErrorPayload(payload, rawBody)}`,
      );
    }

    return {
      guildId: payload?.guild_id ?? null,
      channelId: payload?.channel_id ?? null,
      messageId: payload?.id ?? null,
    };
  }

  private buildMultipartBody(text: string, imagePath: string): FormData {
    const form = new FormData();
    const bytes = readFileSync(imagePath);
    const body = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

    form.append('payload_json', JSON.stringify({ content: text }));
    form.append('files[0]', new Blob([body], { type: 'image/jpeg' }), basename(imagePath));

    return form;
  }

  private parseResponseBody<T>(rawBody: string): T | null {
    if (!rawBody.trim()) {
      return null;
    }

    try {
      return JSON.parse(rawBody) as T;
    } catch {
      return null;
    }
  }

  private describeErrorPayload(payload: DiscordWebhookResponse | null, rawBody: string): string {
    if (!payload) {
      return rawBody.trim() ? `Raw response: ${rawBody}` : 'Response body is empty.';
    }

    const parts: string[] = [];
    if (payload.message) {
      parts.push(`Message: ${payload.message}`);
    }
    if (payload.code != null) {
      parts.push(`Code: ${String(payload.code)}`);
    }
    parts.push(`Raw response: ${rawBody}`);
    return parts.join(' ');
  }

  private formatPostTextDiagnostics(text: string, textLength: number): string {
    return `Attempted post text (${textLength} characters): ${JSON.stringify(text)}`;
  }
}
