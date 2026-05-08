import { createHmac, randomBytes } from 'node:crypto';
import {
  type PublishXMessageParams,
  type PublishXMessageResult,
  XPublisherPort,
} from '@marketing-service/editorial';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface XStatusUpdateResponse {
  data?: {
    id?: string;
    text?: string;
  };
  errors?: Array<{ message?: string }>;
}

@Injectable()
export class XApiPublisher extends XPublisherPort {
  constructor(
    @Inject(ConfigService)
    private readonly config: ConfigService,
  ) {
    super();
  }

  async publishMessage(params: PublishXMessageParams): Promise<PublishXMessageResult> {
    const credentials = this.resolveCredentials();
    const url = 'https://api.x.com/2/tweets';
    const oauth = this.createOAuthParams(credentials);
    const signature = this.createSignature('POST', url, oauth, credentials);
    const authorization = this.buildAuthorizationHeader({
      ...oauth,
      oauth_signature: signature,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: params.text,
      }),
    });

    const payload = (await response.json()) as XStatusUpdateResponse;

    if (!response.ok) {
      const errorMessage = payload.errors?.[0]?.message;
      throw new Error(errorMessage ?? `X publish failed with ${response.status}`);
    }

    const tweetId = payload.data?.id ?? null;
    if (!tweetId) {
      throw new Error('X publish succeeded but returned no tweet id');
    }

    return {
      tweetId,
      screenName: null,
    };
  }

  private resolveCredentials(): {
    apiKey: string;
    apiKeySecret: string;
    accessToken: string;
    accessTokenSecret: string;
  } {
    const apiKey = this.config.get<string>('X_PUBLISH_API_KEY');
    const apiKeySecret = this.config.get<string>('X_PUBLISH_API_KEY_SECRET');
    const accessToken = this.config.get<string>('X_PUBLISH_ACCESS_TOKEN');
    const accessTokenSecret = this.config.get<string>('X_PUBLISH_ACCESS_TOKEN_SECRET');

    if (!apiKey) {
      throw new Error('X_PUBLISH_API_KEY is not configured');
    }

    if (!apiKeySecret) {
      throw new Error('X_PUBLISH_API_KEY_SECRET is not configured');
    }

    if (!accessToken) {
      throw new Error('X_PUBLISH_ACCESS_TOKEN is not configured');
    }

    if (!accessTokenSecret) {
      throw new Error('X_PUBLISH_ACCESS_TOKEN_SECRET is not configured');
    }

    return {
      apiKey,
      apiKeySecret,
      accessToken,
      accessTokenSecret,
    };
  }

  private createOAuthParams(credentials: {
    apiKey: string;
    accessToken: string;
  }): Record<string, string> {
    return {
      oauth_consumer_key: credentials.apiKey,
      oauth_nonce: randomBytes(16).toString('hex'),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: String(Math.floor(Date.now() / 1000)),
      oauth_token: credentials.accessToken,
      oauth_version: '1.0',
    };
  }

  private createSignature(
    method: string,
    url: string,
    oauthParams: Record<string, string>,
    credentials: {
      apiKeySecret: string;
      accessTokenSecret: string;
    },
  ): string {
    const parameterString = Object.keys(oauthParams)
      .sort()
      .map((key) => `${this.percentEncode(key)}=${this.percentEncode(oauthParams[key])}`)
      .join('&');

    const signatureBaseString = [
      method.toUpperCase(),
      this.percentEncode(url),
      this.percentEncode(parameterString),
    ].join('&');

    const signingKey = [
      this.percentEncode(credentials.apiKeySecret),
      this.percentEncode(credentials.accessTokenSecret),
    ].join('&');

    return createHmac('sha1', signingKey).update(signatureBaseString).digest('base64');
  }

  private buildAuthorizationHeader(params: Record<string, string>): string {
    const header = Object.keys(params)
      .sort()
      .map((key) => `${this.percentEncode(key)}="${this.percentEncode(params[key])}"`)
      .join(', ');

    return `OAuth ${header}`;
  }

  private percentEncode(value: string): string {
    return encodeURIComponent(value).replace(
      /[!'()*]/g,
      (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
    );
  }
}
