import { describe, expect, it, vi } from 'vitest';
import { XApiPublisher } from './x-api.publisher.js';
import type { XIntegrationService } from './x-integration.service.js';

describe('XApiPublisher', () => {
  it('delegates scheduled X publishing params to the OAuth integration service', async () => {
    const publishPost = vi.fn().mockResolvedValue({
      tweetId: '1234567890',
      screenName: 'reinforce_fi',
      url: 'https://x.com/reinforce_fi/status/1234567890',
      mediaCount: 1,
    });
    const publisher = new XApiPublisher({ publishPost } as unknown as XIntegrationService);

    const result = await publisher.publishMessage({
      text: 'hello',
      imagePath: '/tmp/x-image.jpg',
      publishingTarget: 'test',
      requestId: 'publication_1',
      madeWithAi: true,
    });

    expect(publishPost).toHaveBeenCalledWith({
      text: 'hello',
      imagePath: '/tmp/x-image.jpg',
      publishingTarget: 'test',
      requestId: 'publication_1',
      madeWithAi: true,
    });
    expect(result).toEqual({
      tweetId: '1234567890',
      screenName: 'reinforce_fi',
    });
  });
});
