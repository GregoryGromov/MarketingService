export interface PublishDiscordMessageParams {
  text: string;
  imagePath?: string | null;
}

export interface PublishDiscordMessageResult {
  guildId?: string | null;
  channelId: string | null;
  messageId: string | null;
}

export abstract class DiscordPublisherPort {
  abstract publishMessage(
    params: PublishDiscordMessageParams,
  ): Promise<PublishDiscordMessageResult>;
}
