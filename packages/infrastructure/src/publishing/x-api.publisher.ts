import {
  type PublishXMessageParams,
  type PublishXMessageResult,
  XPublisherPort,
} from '@marketing-service/editorial';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHmac, randomBytes } from 'node:crypto';

interface XStatusUpdateResponse {
  data?: {
    id?: string;
    text?: string;
  };
  errors?: Array<{ message?: string }>;
}

interface XMediaUploadResponse {
  data?: {
    id?: string;
    media_key?: string;
    expires_after_secs?: number;
    processing_info?: {
      state?: string;
      progress_percent?: number;
      check_after_secs?: number;
    };
    size?: number;
  };
  errors?: XApiErrorPayload['errors'];
}

interface XV1MediaUploadResponse {
  media_id?: number;
  media_id_string?: string;
  errors?: XApiErrorPayload['errors'];
}

interface XApiErrorPayload {
  errors?: Array<{
    message?: string;
    code?: number;
    type?: string;
    parameters?: Record<string, unknown>;
  }>;
  title?: string;
  detail?: string;
  type?: string;
}

interface XOAuth2TokenConfig {
  accessToken: string;
  refreshToken: string | null;
  clientId: string | null;
  clientSecret: string | null;
  source: string;
  scope: string | null;
}

interface XOAuth1TokenConfig {
  apiKey: string;
  apiKeySecret: string;
  accessToken: string;
  accessTokenSecret: string;
  source: string;
}

interface XOAuth2TokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

interface XOAuth2TokenStore {
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  scope?: string;
  expiresIn?: number;
  refreshedAt?: string;
}

const X_STANDARD_POST_CHARACTER_LIMIT = 280;
const X_IMAGE_UPLOAD_LIMIT_BYTES = 5 * 1024 * 1024;
const DEFAULT_TOKEN_STORE_PATH = '.x-oauth2-token.json';
const REQUIRED_X_MEDIA_SCOPE = 'media.write';

@Injectable()
export class XApiPublisher extends XPublisherPort {
  private tokenStore: XOAuth2TokenStore | null = null;

  constructor(
    @Inject(ConfigService)
    private readonly config: ConfigService,
  ) {
    super();
  }

  async publishMessage(params: PublishXMessageParams): Promise<PublishXMessageResult> {
    const url = 'https://api.x.com/2/tweets';
    const textLength = Array.from(params.text).length;

    if (textLength > X_STANDARD_POST_CHARACTER_LIMIT) {
      throw new Error(
        `X publish blocked before request: text is ${textLength} characters, but the standard X API post limit is ${X_STANDARD_POST_CHARACTER_LIMIT}. Regenerate or edit the publication to fit the X limit. ${this.formatPostTextDiagnostics(params.text, textLength)}`,
      );
    }

    let tokenConfig = this.resolveOAuth2TokenConfig();
    const mediaId = params.imagePath
      ? await this.uploadTweetImageWithRefresh(params.imagePath, tokenConfig)
      : null;
    tokenConfig = mediaId?.tokenConfig ?? tokenConfig;
    let response = await this.postTweet(
      url,
      params.text,
      tokenConfig.accessToken,
      mediaId?.mediaId ?? null,
    );

    if (response.status === 401 && tokenConfig.refreshToken) {
      tokenConfig = await this.refreshOAuth2Token(tokenConfig);
      response = await this.postTweet(
        url,
        params.text,
        tokenConfig.accessToken,
        mediaId?.mediaId ?? null,
      );
    }

    const rawBody = await response.text();
    const payload = this.parseResponseBody<XStatusUpdateResponse | XApiErrorPayload>(rawBody);

    if (!response.ok) {
      const errorDetails = this.describeErrorPayload(payload, rawBody);
      throw new Error(
        `X publish failed with ${response.status} ${response.statusText}. Auth: OAuth2 Bearer (${tokenConfig.source}). ${this.formatPostTextDiagnostics(params.text, textLength)} ${errorDetails}`,
      );
    }

    const tweetId = (payload as XStatusUpdateResponse | null)?.data?.id ?? null;
    if (!tweetId) {
      throw new Error('X publish succeeded but returned no tweet id');
    }

    return {
      tweetId,
      screenName: null,
    };
  }

  private async postTweet(
    url: string,
    text: string,
    accessToken: string,
    mediaId: string | null,
  ): Promise<Response> {
    const body: { text: string; media?: { media_ids: string[] } } = { text };
    if (mediaId) {
      body.media = { media_ids: [mediaId] };
    }

    return await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  private async uploadTweetImageWithRefresh(
    imagePath: string,
    tokenConfig: XOAuth2TokenConfig,
  ): Promise<{ mediaId: string; tokenConfig: XOAuth2TokenConfig }> {
    if (!this.hasMediaWriteScope(tokenConfig)) {
      const oauth1Config = this.resolveOAuth1TokenConfig();
      if (oauth1Config) {
        return {
          mediaId: await this.uploadTweetImageWithOAuth1(
            imagePath,
            oauth1Config,
            `OAuth2 token does not include required scope "${REQUIRED_X_MEDIA_SCOPE}". ${this.formatScopeDiagnostics(tokenConfig)}`,
          ),
          tokenConfig,
        };
      }

      this.assertMediaWriteScope(tokenConfig);
    }

    let response = await this.uploadTweetImage(imagePath, tokenConfig.accessToken);

    if (response.status === 401 && tokenConfig.refreshToken) {
      tokenConfig = await this.refreshOAuth2Token(tokenConfig);
      this.assertMediaWriteScope(tokenConfig);
      response = await this.uploadTweetImage(imagePath, tokenConfig.accessToken);
    }

    const rawBody = await response.text();
    const payload = this.parseResponseBody<XMediaUploadResponse | XApiErrorPayload>(rawBody);

    if (!response.ok) {
      const oauth1Config = this.resolveOAuth1TokenConfig();
      if (oauth1Config && (response.status === 403 || response.status === 404)) {
        return {
          mediaId: await this.uploadTweetImageWithOAuth1(
            imagePath,
            oauth1Config,
            `OAuth2 media upload failed with ${response.status} ${response.statusText}. ${this.describeErrorPayload(payload, rawBody)}`,
          ),
          tokenConfig,
        };
      }

      throw new Error(
        `X media upload failed with ${response.status} ${response.statusText}. Auth: OAuth2 Bearer (${tokenConfig.source}). ${this.formatScopeDiagnostics(tokenConfig)} If this is 403, the most likely cause is missing OAuth2 scope "${REQUIRED_X_MEDIA_SCOPE}" or app/account access that does not allow media upload. ${this.describeErrorPayload(payload, rawBody)}`,
      );
    }

    const mediaId = (payload as XMediaUploadResponse | null)?.data?.id ?? null;
    if (!mediaId) {
      throw new Error(
        `X media upload succeeded but returned no media id. Raw response: ${rawBody}`,
      );
    }

    return { mediaId, tokenConfig };
  }

  private async uploadTweetImage(imagePath: string, accessToken: string): Promise<Response> {
    const bytes = readFileSync(imagePath);

    if (bytes.byteLength > X_IMAGE_UPLOAD_LIMIT_BYTES) {
      throw new Error(
        `X media upload blocked before request: image is ${bytes.byteLength} bytes, but the X image upload limit is ${X_IMAGE_UPLOAD_LIMIT_BYTES} bytes.`,
      );
    }

    return await fetch('https://api.x.com/2/media/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        media: bytes.toString('base64'),
        media_category: 'tweet_image',
        media_type: 'image/jpeg',
      }),
    });
  }

  private async uploadTweetImageWithOAuth1(
    imagePath: string,
    tokenConfig: XOAuth1TokenConfig,
    oauth2FailureContext: string,
  ): Promise<string> {
    const url = 'https://upload.twitter.com/1.1/media/upload.json';
    const bytes = readFileSync(imagePath);

    if (bytes.byteLength > X_IMAGE_UPLOAD_LIMIT_BYTES) {
      throw new Error(
        `X media upload blocked before request: image is ${bytes.byteLength} bytes, but the X image upload limit is ${X_IMAGE_UPLOAD_LIMIT_BYTES} bytes.`,
      );
    }

    const body = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    const form = new FormData();
    form.append('media_category', 'tweet_image');
    form.append('media', new Blob([body], { type: 'image/jpeg' }), 'tweet-image.jpg');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: this.buildOAuth1AuthorizationHeader('POST', url, tokenConfig),
      },
      body: form,
    });
    const rawBody = await response.text();
    const payload = this.parseResponseBody<XV1MediaUploadResponse | XApiErrorPayload>(rawBody);

    if (!response.ok) {
      throw new Error(
        `X media upload failed with both OAuth2 and OAuth1 fallback. OAuth2 failure: ${oauth2FailureContext} OAuth1 fallback failed with ${response.status} ${response.statusText}. Auth: OAuth1 v1.1 (${tokenConfig.source}). ${this.describeErrorPayload(payload, rawBody)}`,
      );
    }

    const mediaId = (payload as XV1MediaUploadResponse | null)?.media_id_string ?? null;
    if (!mediaId) {
      throw new Error(
        `X OAuth1 media upload succeeded but returned no media id. OAuth2 failure: ${oauth2FailureContext} Raw response: ${rawBody}`,
      );
    }

    return mediaId;
  }

  private resolveOAuth2TokenConfig(): XOAuth2TokenConfig {
    const storedTokens = this.readTokenStore();
    const storedAccessToken = storedTokens.accessToken?.trim() || null;
    const storedRefreshToken = storedTokens.refreshToken?.trim() || null;
    const storedScope = storedTokens.scope?.trim() || null;
    const envAccessToken =
      this.config.get<string>('X_PUBLISH_OAUTH2_USER_ACCESS_TOKEN')?.trim() ||
      this.config.get<string>('X_PUBLISH_USER_ACCESS_TOKEN')?.trim() ||
      null;
    const envRefreshToken =
      this.config.get<string>('X_PUBLISH_OAUTH2_REFRESH_TOKEN')?.trim() ||
      this.config.get<string>('X_PUBLISH_REFRESH_TOKEN')?.trim() ||
      null;
    const clientId =
      this.config.get<string>('X_PUBLISH_OAUTH2_CLIENT_ID')?.trim() ||
      this.config.get<string>('X_PUBLISH_CLIENT_ID')?.trim() ||
      null;
    const clientSecret =
      this.config.get<string>('X_PUBLISH_OAUTH2_CLIENT_SECRET')?.trim() ||
      this.config.get<string>('X_PUBLISH_CLIENT_SECRET')?.trim() ||
      null;
    const accessToken = storedAccessToken ?? envAccessToken;
    const refreshToken = storedRefreshToken ?? envRefreshToken;

    if (!accessToken) {
      throw new Error(
        'X publish requires OAuth2 user access token. Set X_PUBLISH_OAUTH2_USER_ACCESS_TOKEN.',
      );
    }

    return {
      accessToken,
      refreshToken,
      clientId,
      clientSecret,
      scope: storedScope,
      source: storedAccessToken
        ? `${this.getTokenStorePath()}`
        : 'X_PUBLISH_OAUTH2_USER_ACCESS_TOKEN',
    };
  }

  private resolveOAuth1TokenConfig(): XOAuth1TokenConfig | null {
    const apiKey = this.config.get<string>('X_PUBLISH_API_KEY')?.trim() || null;
    const apiKeySecret =
      this.config.get<string>('X_PUBLISH_API_KEY_SECRET')?.trim() ||
      this.config.get<string>('X_PUBLISH_API_SECRET')?.trim() ||
      null;
    const accessToken = this.config.get<string>('X_PUBLISH_ACCESS_TOKEN')?.trim() || null;
    const accessTokenSecret =
      this.config.get<string>('X_PUBLISH_ACCESS_TOKEN_SECRET')?.trim() || null;

    if (!apiKey || !apiKeySecret || !accessToken || !accessTokenSecret) {
      return null;
    }

    return {
      apiKey,
      apiKeySecret,
      accessToken,
      accessTokenSecret,
      source: 'X_PUBLISH_API_KEY + X_PUBLISH_ACCESS_TOKEN',
    };
  }

  private async refreshOAuth2Token(tokenConfig: XOAuth2TokenConfig): Promise<XOAuth2TokenConfig> {
    if (!tokenConfig.refreshToken) {
      throw new Error('X OAuth2 access token expired and no refresh token is configured.');
    }

    if (!tokenConfig.clientId) {
      throw new Error(
        'X OAuth2 access token expired. Set X_PUBLISH_OAUTH2_CLIENT_ID so the service can refresh it automatically.',
      );
    }

    const body = new URLSearchParams({
      refresh_token: tokenConfig.refreshToken,
      grant_type: 'refresh_token',
    });
    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    if (tokenConfig.clientSecret) {
      headers.Authorization = `Basic ${Buffer.from(
        `${tokenConfig.clientId}:${tokenConfig.clientSecret}`,
      ).toString('base64')}`;
    } else {
      body.set('client_id', tokenConfig.clientId);
    }

    const response = await fetch('https://api.x.com/2/oauth2/token', {
      method: 'POST',
      headers,
      body: body.toString(),
    });
    const rawBody = await response.text();
    const payload = this.parseResponseBody<XOAuth2TokenResponse | XApiErrorPayload>(rawBody);

    if (!response.ok || !payload || !('access_token' in payload) || !payload.access_token) {
      throw new Error(
        `X OAuth2 token refresh failed with ${response.status} ${response.statusText}. ${this.describeErrorPayload(payload, rawBody)}`,
      );
    }

    const refreshedStore: XOAuth2TokenStore = {
      accessToken: payload.access_token,
      refreshToken:
        'refresh_token' in payload && payload.refresh_token
          ? payload.refresh_token
          : tokenConfig.refreshToken,
      tokenType: payload.token_type,
      scope: payload.scope,
      expiresIn: payload.expires_in,
      refreshedAt: new Date().toISOString(),
    };

    this.writeTokenStore(refreshedStore);

    return {
      accessToken: payload.access_token,
      refreshToken: refreshedStore.refreshToken ?? null,
      clientId: tokenConfig.clientId,
      clientSecret: tokenConfig.clientSecret,
      scope: refreshedStore.scope ?? tokenConfig.scope,
      source: `${this.getTokenStorePath()} refreshed from X_PUBLISH_OAUTH2_REFRESH_TOKEN`,
    };
  }

  private assertMediaWriteScope(tokenConfig: XOAuth2TokenConfig): void {
    if (this.hasMediaWriteScope(tokenConfig)) {
      return;
    }

    throw new Error(
      `X media upload blocked before request: OAuth2 token does not include required scope "${REQUIRED_X_MEDIA_SCOPE}". ${this.formatScopeDiagnostics(tokenConfig)} Regenerate the X OAuth2 user token with tweet.write, ${REQUIRED_X_MEDIA_SCOPE}, and offline.access, then restart API/worker.`,
    );
  }

  private hasMediaWriteScope(tokenConfig: XOAuth2TokenConfig): boolean {
    if (!tokenConfig.scope) {
      return true;
    }

    const scopes = tokenConfig.scope.split(/\s+/).filter(Boolean);
    return scopes.includes(REQUIRED_X_MEDIA_SCOPE);
  }

  private formatScopeDiagnostics(tokenConfig: XOAuth2TokenConfig): string {
    return `Token source: ${tokenConfig.source}. Token scopes: ${tokenConfig.scope ?? 'unknown'}.`;
  }

  private buildOAuth1AuthorizationHeader(
    method: 'POST',
    url: string,
    tokenConfig: XOAuth1TokenConfig,
  ): string {
    const oauthParams: Record<string, string> = {
      oauth_consumer_key: tokenConfig.apiKey,
      oauth_nonce: randomBytes(16).toString('hex'),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_token: tokenConfig.accessToken,
      oauth_version: '1.0',
    };

    const signatureBaseParams = Object.entries(oauthParams)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${this.oauth1Encode(key)}=${this.oauth1Encode(value)}`)
      .join('&');
    const signatureBaseString = [
      method,
      this.oauth1Encode(url),
      this.oauth1Encode(signatureBaseParams),
    ].join('&');
    const signingKey = `${this.oauth1Encode(tokenConfig.apiKeySecret)}&${this.oauth1Encode(
      tokenConfig.accessTokenSecret,
    )}`;

    oauthParams.oauth_signature = createHmac('sha1', signingKey)
      .update(signatureBaseString)
      .digest('base64');

    return `OAuth ${Object.entries(oauthParams)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${this.oauth1Encode(key)}="${this.oauth1Encode(value)}"`)
      .join(', ')}`;
  }

  private oauth1Encode(value: string): string {
    return encodeURIComponent(value).replace(
      /[!'()*]/g,
      (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
    );
  }

  private readTokenStore(): XOAuth2TokenStore {
    if (this.tokenStore) {
      return this.tokenStore;
    }

    const path = this.getTokenStorePath();
    if (!existsSync(path)) {
      this.tokenStore = {};
      return this.tokenStore;
    }

    try {
      this.tokenStore = JSON.parse(readFileSync(path, 'utf8')) as XOAuth2TokenStore;
      return this.tokenStore;
    } catch {
      this.tokenStore = {};
      return this.tokenStore;
    }
  }

  private writeTokenStore(tokenStore: XOAuth2TokenStore): void {
    const path = this.getTokenStorePath();
    writeFileSync(path, `${JSON.stringify(tokenStore, null, 2)}\n`, {
      encoding: 'utf8',
      mode: 0o600,
    });
    this.tokenStore = tokenStore;
  }

  private getTokenStorePath(): string {
    return resolve(
      this.config.get<string>('X_PUBLISH_OAUTH2_TOKEN_STORE_PATH')?.trim() ||
        DEFAULT_TOKEN_STORE_PATH,
    );
  }

  private parseResponseBody<T>(rawBody: string): T | null {
    if (!rawBody.trim()) {
      return null;
    }

    try {
      return JSON.parse(rawBody) as T;
    } catch {
      return null;
    }
  }

  private describeErrorPayload(
    payload:
      | XStatusUpdateResponse
      | XMediaUploadResponse
      | XV1MediaUploadResponse
      | XApiErrorPayload
      | XOAuth2TokenResponse
      | null,
    rawBody: string,
  ): string {
    if (!payload) {
      return rawBody.trim() ? `Raw response: ${rawBody}` : 'Response body is empty.';
    }

    const parts: string[] = [];
    const primaryError = 'errors' in payload ? payload.errors?.[0] : undefined;
    const primaryErrorCode = primaryError && 'code' in primaryError ? primaryError.code : undefined;

    if ('error' in payload && payload.error) {
      parts.push(`Error: ${payload.error}`);
    }

    if ('error_description' in payload && payload.error_description) {
      parts.push(`Error description: ${payload.error_description}`);
    }

    if (primaryError?.message) {
      parts.push(`Message: ${primaryError.message}`);
    }

    if ('title' in payload && payload.title) {
      parts.push(`Title: ${payload.title}`);
    }

    if ('detail' in payload && payload.detail) {
      parts.push(`Detail: ${payload.detail}`);
    }

    if (primaryErrorCode != null) {
      parts.push(`Code: ${String(primaryErrorCode)}`);
    }

    if ('type' in payload && payload.type) {
      parts.push(`Type: ${payload.type}`);
    }

    parts.push(`Raw response: ${rawBody}`);
    return parts.join(' ');
  }

  private formatPostTextDiagnostics(text: string, textLength: number): string {
    return `Attempted post text (${textLength} characters): ${JSON.stringify(text)}`;
  }
}
