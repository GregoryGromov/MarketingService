export interface PublishXMessageParams {
  text: string;
  imagePath?: string | null;
  publishingTarget?: 'test' | 'production';
}

export interface PublishXMessageResult {
  tweetId: string;
  screenName: string | null;
}

export abstract class XPublisherPort {
  abstract publishMessage(params: PublishXMessageParams): Promise<PublishXMessageResult>;
}
