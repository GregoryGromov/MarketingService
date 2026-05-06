export interface PublishDiscordMessageParams {
  text: string;
}

export interface PublishDiscordMessageResult {
  channelId: string | null;
  messageId: string | null;
}

export abstract class DiscordPublisherPort {
  abstract publishMessage(
    params: PublishDiscordMessageParams,
  ): Promise<PublishDiscordMessageResult>;
}
