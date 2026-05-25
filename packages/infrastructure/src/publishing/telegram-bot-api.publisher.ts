import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import {
  TelegramPublisherPort,
  type PublishTelegramMessageParams,
  type PublishTelegramMessageResult,
} from '@marketing-service/editorial';

interface TelegramSendMessageResponse {
  ok: boolean;
  description?: string;
  result?: {
    message_id?: number;
    chat?: {
      id?: number | string;
      username?: string;
    };
  };
}

@Injectable()
export class TelegramBotApiPublisher extends TelegramPublisherPort {
  constructor(private readonly config: ConfigService) {
    super();
  }

  async publishMessage(
    params: PublishTelegramMessageParams,
  ): Promise<PublishTelegramMessageResult> {
    const channelConfig = this.resolveChannelConfig(params.language);
    const text = this.formatTelegramHtml(params.text);

    const response = await fetch(
      `https://api.telegram.org/bot${channelConfig.botToken}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: channelConfig.chatId,
          text,
          parse_mode: 'HTML',
        }),
      },
    );

    const payload = (await response.json()) as TelegramSendMessageResponse;

    if (!response.ok || !payload.ok) {
      throw new Error(
        payload.description ??
          `Telegram sendMessage failed for language ${params.language} with ${response.status}`,
      );
    }

    const messageId = payload.result?.message_id;
    if (!messageId) {
      throw new Error('Telegram sendMessage returned no message_id');
    }

    return {
      chatId: this.resolveLinkableChatRef(payload, channelConfig.chatId),
      messageId,
    };
  }

  private resolveLinkableChatRef(
    payload: TelegramSendMessageResponse,
    configuredChatId: string,
  ): string {
    const username = payload.result?.chat?.username?.trim();
    if (username) {
      return username.startsWith('@') ? username : `@${username}`;
    }

    if (configuredChatId.trim().startsWith('@')) {
      return configuredChatId.trim();
    }

    return String(payload.result?.chat?.id ?? configuredChatId);
  }

  private resolveChannelConfig(language: string): { botToken: string; chatId: string } {
    const normalized = language.trim().toUpperCase();
    const candidates = this.resolveLanguageCandidates(normalized);

    for (const candidate of candidates) {
      const botToken = this.config.get<string>(`TELEGRAM_PUBLISH_${candidate}_BOT_TOKEN`);
      const chatId = this.config.get<string>(`TELEGRAM_PUBLISH_${candidate}_CHAT_ID`);

      if (botToken && chatId) {
        return { botToken, chatId };
      }
    }

    throw new Error(
      candidates.length > 1
        ? `Telegram publish is not configured for ${normalized}; also no fallback config was found for ${candidates.slice(1).join(', ')}`
        : `TELEGRAM_PUBLISH_${normalized}_BOT_TOKEN / TELEGRAM_PUBLISH_${normalized}_CHAT_ID are not configured`,
    );
  }

  private resolveLanguageCandidates(language: string): string[] {
    switch (language) {
      case 'RU':
        return ['RU'];
      case 'EN':
        return ['EN'];
      default:
        return [language, 'EN'];
    }
  }

  private formatTelegramHtml(text: string): string {
    const withHtmlBold = text.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
    const escaped = withHtmlBold
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return escaped
      .replace(/&lt;(\/?)(b|strong|i|em|u|s|strike|del|code|pre)&gt;/gi, '<$1$2>');
  }
}
