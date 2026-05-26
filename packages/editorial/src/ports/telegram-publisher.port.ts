export interface PublishTelegramMessageParams {
  language: string;
  text: string;
  imagePath?: string | null;
  publishingTarget?: 'test' | 'production';
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
