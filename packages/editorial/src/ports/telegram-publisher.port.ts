export interface PublishTelegramMessageParams {
  language: string;
  text: string;
}

export interface PublishTelegramMessageResult {
  chatId: string;
  messageId: number;
}

export abstract class TelegramPublisherPort {
  abstract publishMessage(
    params: PublishTelegramMessageParams,
  ): Promise<PublishTelegramMessageResult>;
}
