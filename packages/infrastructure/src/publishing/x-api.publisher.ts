import {
  type PublishXMessageParams,
  type PublishXMessageResult,
  XPublisherPort,
} from '@marketing-service/editorial';
import { Inject, Injectable } from '@nestjs/common';
import { XIntegrationService } from './x-integration.service.js';

@Injectable()
export class XApiPublisher extends XPublisherPort {
  constructor(
    @Inject(XIntegrationService)
    private readonly xIntegration: XIntegrationService,
  ) {
    super();
  }

  async publishMessage(params: PublishXMessageParams): Promise<PublishXMessageResult> {
    const result = await this.xIntegration.publishPost({
      text: params.text,
      imagePath: params.imagePath,
      publishingTarget: params.publishingTarget,
      requestId: params.requestId,
      madeWithAi: params.madeWithAi,
    });

    return {
      tweetId: result.tweetId,
      screenName: result.screenName,
    };
  }
}
