import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import {
  DiscordPublisherPort,
  type PublishDiscordMessageParams,
  type PublishDiscordMessageResult,
} from '@marketing-service/editorial';

interface DiscordWebhookResponse {
  id?: string;
  channel_id?: string;
  message?: string;
}

@Injectable()
export class DiscordWebhookPublisher extends DiscordPublisherPort {
  constructor(private readonly config: ConfigService) {
    super();
  }

  async publishMessage(
    params: PublishDiscordMessageParams,
  ): Promise<PublishDiscordMessageResult> {
    const webhookUrl = this.config.get<string>('DISCORD_WEBHOOK_URL');

    if (!webhookUrl) {
      throw new Error('DISCORD_WEBHOOK_URL is not configured');
    }

    const url = webhookUrl.includes('?') ? `${webhookUrl}&wait=true` : `${webhookUrl}?wait=true`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: params.text,
      }),
    });

    const payload = (await response.json()) as DiscordWebhookResponse;

    if (!response.ok) {
      throw new Error(
        payload.message ?? `Discord webhook publish failed with ${response.status}`,
      );
    }

    return {
      channelId: payload.channel_id ?? null,
      messageId: payload.id ?? null,
    };
  }
}
