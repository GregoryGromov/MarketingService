import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { basename } from 'node:path';
import {
  type XConnectionRow,
  type XPublicationRow,
  xConnections,
  xOauthAttempts,
  xPublications,
} from '@marketing-service/database';
import { generateId } from '@marketing-service/shared';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../database.module.js';

export type XPublishingTarget = 'test' | 'production';
export type XConnectionStatus = 'active' | 'reauth_required' | 'disconnected' | 'error';

export interface BeginXConnectResult {
  authorizationUrl: string;
  expiresAt: string;
}

export interface CompleteXCallbackParams {
  code?: string | null;
  state?: string | null;
  error?: string | null;
  errorDescription?: string | null;
}

export interface XConnectionStatusResult {
  connected: boolean;
  configured: boolean;
  status: XConnectionStatus | 'not_connected' | 'not_configured';
  xUserId: string | null;
  username: string | null;
  displayName: string | null;
  scopes: string[];
  tokenExpiresAt: string | null;
  reauthorizationRequired: boolean;
  mediaPostingEnabled: boolean;
  publishingTarget: XPublishingTarget;
  lastErrorCode: string | null;
  lastErrorAt: string | null;
}

export interface CompleteXCallbackResult extends XConnectionStatusResult {
  returnTo: string | null;
}

export interface PublishXPostParams {
  text: string;
  imagePath?: string | null;
  publishingTarget?: XPublishingTarget;
  madeWithAi?: boolean | null;
  requestId?: string | null;
}

export interface PublishXPostResult {
  tweetId: string;
  screenName: string | null;
  url: string;
  mediaCount: number;
}

interface XIntegrationConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  expectedUserId: string | null;
  expectedUsername: string | null;
  apiTimeoutMs: number;
  mediaUploadTimeoutMs: number;
  tokenRefreshSkewSeconds: number;
  postingEnabled: boolean;
  mediaMaxImagesPerPost: number;
  mediaMaxImageSizeBytes: number;
  mediaAllowedMimeTypes: Set<string>;
  markAiMedia: boolean;
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

interface XUsersMeResponse {
  data?: {
    id?: string;
    username?: string;
    name?: string;
  };
  errors?: XApiErrorPayload['errors'];
}

interface XCreatePostResponse {
  data?: {
    id?: string;
    text?: string;
    edit_history_tweet_ids?: string[];
  };
  errors?: XApiErrorPayload['errors'];
}

interface XMediaUploadResponse {
  data?: {
    id?: string;
    media_key?: string;
    expires_after_secs?: number;
    size?: number;
  };
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
  error?: string;
  error_description?: string;
}

interface ValidAccessToken {
  connection: XConnectionRow;
  accessToken: string;
}

interface ImageFileForUpload {
  bytes: Buffer;
  mimeType: string;
  fileName: string;
}

class XIntegrationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

const TENANT_ID = 'default';
const AUTHORIZE_URL = 'https://x.com/i/oauth2/authorize';
const TOKEN_URL = 'https://api.x.com/2/oauth2/token';
const REVOKE_URL = 'https://api.x.com/2/oauth2/revoke';
const API_BASE_URL = 'https://api.x.com/2';
const MEDIA_UPLOAD_URL = 'https://api.x.com/2/media/upload';
const CREATE_POST_URL = 'https://api.x.com/2/tweets';
const REQUIRED_TEXT_SCOPES = ['tweet.write'];
const REQUIRED_CONNECT_SCOPES = [
  'tweet.read',
  'users.read',
  'tweet.write',
  'media.write',
  'offline.access',
];
const X_STANDARD_POST_CHARACTER_LIMIT = 280;
const MAX_ERROR_DETAIL_LENGTH = 2_000;

@Injectable()
export class XIntegrationService {
  private refreshLocks = new Map<string, Promise<void>>();

  constructor(
    @Inject(DRIZZLE)
    private readonly db: DrizzleDB,
    @Inject(ConfigService)
    private readonly config: ConfigService,
  ) {}

  async beginConnect(
    params: { publishingTarget?: XPublishingTarget | string | null; returnTo?: string | null } = {},
  ): Promise<BeginXConnectResult> {
    const xConfig = this.readRequiredConfig();
    const publishingTarget = normalizePublishingTarget(params.publishingTarget);
    const state = randomBytes(32).toString('base64url');
    const stateHash = hashSecret(state);
    const codeVerifier = randomBytes(64).toString('base64url');
    const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1_000);

    await this.db.insert(xOauthAttempts).values({
      stateHash,
      codeVerifierEncrypted: this.encryptSecret(codeVerifier),
      tenantId: TENANT_ID,
      publishingTarget,
      returnTo: safeReturnTo(params.returnTo),
      expiresAt,
    });

    const url = new URL(AUTHORIZE_URL);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', xConfig.clientId);
    url.searchParams.set('redirect_uri', xConfig.redirectUri);
    url.searchParams.set('scope', xConfig.scopes.join(' '));
    url.searchParams.set('state', state);
    url.searchParams.set('code_challenge', codeChallenge);
    url.searchParams.set('code_challenge_method', 'S256');

    return {
      authorizationUrl: url.toString(),
      expiresAt: expiresAt.toISOString(),
    };
  }

  async completeCallback(params: CompleteXCallbackParams): Promise<CompleteXCallbackResult> {
    const xConfig = this.readRequiredConfig();
    if (params.error) {
      throw new XIntegrationError(
        'X_OAUTH_DENIED',
        sanitizeErrorDetail(params.errorDescription || params.error),
      );
    }

    const code = params.code?.trim();
    const state = params.state?.trim();
    if (!code || !state) {
      throw new XIntegrationError(
        'X_OAUTH_CALLBACK_INVALID',
        'X OAuth callback requires code and state.',
      );
    }

    const stateHash = hashSecret(state);
    const [attempt] = await this.db
      .select()
      .from(xOauthAttempts)
      .where(eq(xOauthAttempts.stateHash, stateHash))
      .limit(1);

    if (!attempt) {
      throw new XIntegrationError('X_OAUTH_STATE_UNKNOWN', 'X OAuth state is unknown or expired.');
    }

    assertConstantTimeEqual(stateHash, attempt.stateHash);

    if (attempt.consumedAt) {
      throw new XIntegrationError('X_OAUTH_STATE_CONSUMED', 'X OAuth state was already used.');
    }

    if (attempt.expiresAt.getTime() <= Date.now()) {
      throw new XIntegrationError('X_OAUTH_STATE_EXPIRED', 'X OAuth state expired.');
    }

    await this.db
      .update(xOauthAttempts)
      .set({ consumedAt: new Date() })
      .where(and(eq(xOauthAttempts.stateHash, stateHash), isNull(xOauthAttempts.consumedAt)));

    const codeVerifier = this.decryptSecret(attempt.codeVerifierEncrypted);
    const tokenResponse = await this.exchangeAuthorizationCode(code, codeVerifier, xConfig);
    const tokenScopes = parseScopes(tokenResponse.scope);
    assertScopes(tokenScopes, REQUIRED_CONNECT_SCOPES);

    const accessToken = readRequired(
      tokenResponse.access_token,
      'X token response has no access token.',
    );
    const refreshToken = readRequired(
      tokenResponse.refresh_token,
      'X token response has no refresh token.',
    );
    const expiresIn = readPositiveNumber(
      tokenResponse.expires_in,
      'X token response has invalid expires_in.',
    );
    const tokenType = tokenResponse.token_type?.toLowerCase();
    if (tokenType !== 'bearer') {
      await this.revokeBestEffort(refreshToken, xConfig);
      throw new XIntegrationError(
        'X_TOKEN_TYPE_INVALID',
        'X token response is not a bearer token.',
      );
    }

    const me = await this.fetchCurrentUser(accessToken, xConfig);
    const xUserId = readRequired(me.data?.id, 'X /2/users/me response has no user id.');
    const xUsername = readRequired(me.data?.username, 'X /2/users/me response has no username.');
    const xDisplayName = me.data?.name?.trim() || null;

    if (xConfig.expectedUserId && xUserId !== xConfig.expectedUserId) {
      await this.revokeBestEffort(refreshToken, xConfig);
      throw new XIntegrationError(
        'X_UNEXPECTED_USER',
        `Authorized X account @${xUsername} (${xUserId}) does not match expected ${xConfig.expectedUsername ?? xConfig.expectedUserId}.`,
      );
    }

    if (
      xConfig.expectedUsername &&
      xUsername.toLowerCase() !== xConfig.expectedUsername.toLowerCase()
    ) {
      await this.revokeBestEffort(refreshToken, xConfig);
      throw new XIntegrationError(
        'X_UNEXPECTED_USER',
        `Authorized X account @${xUsername} (${xUserId}) does not match expected @${xConfig.expectedUsername}.`,
      );
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresIn * 1_000);
    await this.db
      .insert(xConnections)
      .values({
        id: generateId('x_connection'),
        tenantId: TENANT_ID,
        publishingTarget: normalizePublishingTarget(attempt.publishingTarget),
        xUserId,
        xUsername,
        xDisplayName,
        accessTokenEncrypted: this.encryptSecret(accessToken),
        refreshTokenEncrypted: this.encryptSecret(refreshToken),
        accessTokenExpiresAt: expiresAt,
        scopes: tokenScopes,
        status: 'active',
        tokenVersion: 0,
        lastVerifiedAt: now,
        lastRefreshedAt: null,
        lastErrorCode: null,
        lastErrorAt: null,
        connectedAt: now,
        disconnectedAt: null,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [xConnections.tenantId, xConnections.publishingTarget, xConnections.xUserId],
        set: {
          xUsername,
          xDisplayName,
          accessTokenEncrypted: this.encryptSecret(accessToken),
          refreshTokenEncrypted: this.encryptSecret(refreshToken),
          accessTokenExpiresAt: expiresAt,
          scopes: tokenScopes,
          status: 'active',
          tokenVersion: sql`${xConnections.tokenVersion} + 1`,
          lastVerifiedAt: now,
          lastRefreshedAt: null,
          lastErrorCode: null,
          lastErrorAt: null,
          connectedAt: now,
          disconnectedAt: null,
          updatedAt: now,
        },
      });

    const status = await this.getStatus(normalizePublishingTarget(attempt.publishingTarget));
    return {
      ...status,
      returnTo: attempt.returnTo,
    };
  }

  async getStatus(
    publishingTarget: XPublishingTarget | string | null = 'test',
  ): Promise<XConnectionStatusResult> {
    const target = normalizePublishingTarget(publishingTarget);
    const configured = this.isConfigured();
    const connection = await this.findLatestConnection(target);
    if (!connection) {
      return {
        connected: false,
        configured,
        status: configured ? 'not_connected' : 'not_configured',
        xUserId: null,
        username: null,
        displayName: null,
        scopes: [],
        tokenExpiresAt: null,
        reauthorizationRequired: false,
        mediaPostingEnabled: false,
        publishingTarget: target,
        lastErrorCode: null,
        lastErrorAt: null,
      };
    }

    const scopes = normalizeScopes(connection.scopes);
    return {
      connected: connection.status === 'active',
      configured,
      status: connection.status as XConnectionStatus,
      xUserId: connection.xUserId,
      username: connection.xUsername,
      displayName: connection.xDisplayName,
      scopes,
      tokenExpiresAt: connection.accessTokenExpiresAt?.toISOString() ?? null,
      reauthorizationRequired: connection.status === 'reauth_required',
      mediaPostingEnabled: scopes.includes('media.write'),
      publishingTarget: target,
      lastErrorCode: connection.lastErrorCode,
      lastErrorAt: connection.lastErrorAt?.toISOString() ?? null,
    };
  }

  async disconnect(
    publishingTarget: XPublishingTarget | string | null = 'test',
  ): Promise<XConnectionStatusResult> {
    const xConfig = this.readRequiredConfig();
    const target = normalizePublishingTarget(publishingTarget);
    const connection = await this.findActiveConnection(target);
    if (!connection) {
      return await this.getStatus(target);
    }

    const encryptedTokenToRevoke =
      connection.refreshTokenEncrypted ?? connection.accessTokenEncrypted;
    const tokenToRevoke = encryptedTokenToRevoke
      ? this.decryptSecret(encryptedTokenToRevoke)
      : null;
    if (tokenToRevoke) {
      await this.revokeBestEffort(tokenToRevoke, xConfig);
    }

    await this.db
      .update(xConnections)
      .set({
        status: 'disconnected',
        accessTokenEncrypted: null,
        refreshTokenEncrypted: null,
        accessTokenExpiresAt: null,
        disconnectedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(xConnections.id, connection.id));

    return await this.getStatus(target);
  }

  async publishPost(params: PublishXPostParams): Promise<PublishXPostResult> {
    const xConfig = this.readRequiredConfig();
    if (!xConfig.postingEnabled) {
      throw new XIntegrationError(
        'X_POSTING_DISABLED',
        'X posting is disabled by X_POSTING_ENABLED=false.',
      );
    }

    const text = params.text ?? '';
    const imagePaths = params.imagePath?.trim() ? [params.imagePath.trim()] : [];
    this.validatePostInput(text, imagePaths, xConfig);

    const target = normalizePublishingTarget(params.publishingTarget);
    const requiredScopes =
      imagePaths.length > 0 ? [...REQUIRED_TEXT_SCOPES, 'media.write'] : REQUIRED_TEXT_SCOPES;
    const token = await this.ensureValidAccessToken(target, requiredScopes);
    const requestId = params.requestId?.trim() || generateId('x_publication_request');
    const xPublication = await this.createOrLoadPublication({
      connection: token.connection,
      requestId,
      text,
      imagePaths,
      madeWithAi: Boolean(params.madeWithAi) || (imagePaths.length > 0 && xConfig.markAiMedia),
    });

    if (xPublication.status === 'sent' && xPublication.xPostId && xPublication.xPostUrl) {
      return {
        tweetId: xPublication.xPostId,
        screenName: token.connection.xUsername,
        url: xPublication.xPostUrl,
        mediaCount: xPublication.mediaCount,
      };
    }

    if (xPublication.status === 'unknown') {
      throw new XIntegrationError(
        'X_PUBLICATION_STATUS_UNKNOWN',
        `X publication ${xPublication.id} has unknown status; refusing automatic duplicate.`,
      );
    }

    try {
      await this.markPublication(xPublication.id, 'uploading_media');
      const mediaIds: string[] = [];
      let accessToken = token.accessToken;
      for (const imagePath of imagePaths) {
        const uploaded = await this.uploadTweetImageWithRetry({
          connection: token.connection,
          accessToken,
          imagePath,
          xConfig,
          requiredScopes,
        });
        accessToken = uploaded.accessToken;
        mediaIds.push(uploaded.mediaId);
      }

      if (mediaIds.length > 0) {
        await this.db
          .update(xPublications)
          .set({ xMediaIds: mediaIds, status: 'creating_post' })
          .where(eq(xPublications.id, xPublication.id));
      } else {
        await this.markPublication(xPublication.id, 'creating_post');
      }

      const post = await this.createTweetWithRetry({
        connection: token.connection,
        accessToken,
        text,
        mediaIds,
        madeWithAi: Boolean(params.madeWithAi) || (mediaIds.length > 0 && xConfig.markAiMedia),
        xConfig,
        requiredScopes,
      });
      const postUrl = `https://x.com/${token.connection.xUsername}/status/${post.tweetId}`;
      const now = new Date();
      await this.db
        .update(xPublications)
        .set({
          status: 'sent',
          xPostId: post.tweetId,
          xPostUrl: postUrl,
          xResponseMetadata: {
            text: post.text,
            editHistoryTweetIds: post.editHistoryTweetIds,
            mediaCount: mediaIds.length,
          },
          sentAt: now,
          failedAt: null,
          errorCode: null,
          errorDetailSanitized: null,
        })
        .where(eq(xPublications.id, xPublication.id));

      return {
        tweetId: post.tweetId,
        screenName: token.connection.xUsername,
        url: postUrl,
        mediaCount: mediaIds.length,
      };
    } catch (error) {
      const normalized = normalizeError(error);
      await this.db
        .update(xPublications)
        .set({
          status: 'failed',
          errorCode: normalized.code,
          errorDetailSanitized: sanitizeErrorDetail(normalized.message),
          failedAt: new Date(),
        })
        .where(eq(xPublications.id, xPublication.id));
      throw error;
    }
  }

  private async ensureValidAccessToken(
    publishingTarget: XPublishingTarget,
    requiredScopes: string[],
    forceRefresh = false,
  ): Promise<ValidAccessToken> {
    const xConfig = this.readRequiredConfig();
    const connection = await this.findActiveConnection(publishingTarget);
    if (!connection) {
      throw new XIntegrationError(
        'X_CONNECTION_MISSING',
        `No active X connection for ${publishingTarget}. Connect X first.`,
      );
    }

    assertScopes(normalizeScopes(connection.scopes), requiredScopes);
    if (!connection.accessTokenEncrypted || !connection.refreshTokenEncrypted) {
      await this.markConnectionError(connection.id, 'X_REAUTHORIZATION_REQUIRED');
      throw new XIntegrationError(
        'X_REAUTHORIZATION_REQUIRED',
        'X connection has no stored tokens.',
      );
    }

    const refreshAt = Date.now() + xConfig.tokenRefreshSkewSeconds * 1_000;
    if (
      !forceRefresh &&
      connection.accessTokenExpiresAt &&
      connection.accessTokenExpiresAt.getTime() > refreshAt
    ) {
      return {
        connection,
        accessToken: this.decryptSecret(connection.accessTokenEncrypted),
      };
    }

    return await this.withRefreshLock(connection.id, async () => {
      const latest = await this.findConnectionById(connection.id);
      if (!latest || latest.status !== 'active') {
        throw new XIntegrationError('X_REAUTHORIZATION_REQUIRED', 'X connection is not active.');
      }

      assertScopes(normalizeScopes(latest.scopes), requiredScopes);
      if (
        !forceRefresh &&
        latest.accessTokenExpiresAt &&
        latest.accessTokenExpiresAt.getTime() > refreshAt &&
        latest.accessTokenEncrypted
      ) {
        return {
          connection: latest,
          accessToken: this.decryptSecret(latest.accessTokenEncrypted),
        };
      }

      if (!latest.refreshTokenEncrypted) {
        await this.markConnectionError(latest.id, 'X_REAUTHORIZATION_REQUIRED');
        throw new XIntegrationError('X_REAUTHORIZATION_REQUIRED', 'X refresh token is missing.');
      }

      const refreshed = await this.refreshOAuth2Token(latest, xConfig);
      return refreshed;
    });
  }

  private async refreshOAuth2Token(
    connection: XConnectionRow,
    xConfig: XIntegrationConfig,
  ): Promise<ValidAccessToken> {
    const refreshToken = this.decryptSecret(
      readRequired(connection.refreshTokenEncrypted, 'Missing refresh token.'),
    );
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });
    const response = await this.fetchWithTimeout(
      TOKEN_URL,
      {
        method: 'POST',
        headers: {
          Authorization: this.buildBasicAuthHeader(xConfig),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      },
      xConfig.apiTimeoutMs,
    );
    const rawBody = await response.text();
    const payload = parseResponseBody<XOAuth2TokenResponse | XApiErrorPayload>(rawBody);

    if (!response.ok || !payload || !('access_token' in payload) || !payload.access_token) {
      const code = readXErrorCode(payload, response.status);
      if (code === 'X_REAUTHORIZATION_REQUIRED') {
        await this.markConnectionError(connection.id, code);
      }
      throw new XIntegrationError(code, describeErrorPayload(payload, rawBody));
    }

    const tokenScopes = payload.scope
      ? parseScopes(payload.scope)
      : normalizeScopes(connection.scopes);
    assertScopes(tokenScopes, REQUIRED_TEXT_SCOPES);
    const expiresIn = readPositiveNumber(
      payload.expires_in,
      'X refresh response has invalid expires_in.',
    );
    const now = new Date();
    const accessTokenExpiresAt = new Date(now.getTime() + expiresIn * 1_000);
    const nextRefreshToken = payload.refresh_token?.trim() || refreshToken;
    await this.db
      .update(xConnections)
      .set({
        accessTokenEncrypted: this.encryptSecret(payload.access_token),
        refreshTokenEncrypted: this.encryptSecret(nextRefreshToken),
        accessTokenExpiresAt,
        scopes: tokenScopes,
        status: 'active',
        tokenVersion: sql`${xConnections.tokenVersion} + 1`,
        lastRefreshedAt: now,
        lastErrorCode: null,
        lastErrorAt: null,
        updatedAt: now,
      })
      .where(eq(xConnections.id, connection.id));

    const updated = await this.findConnectionById(connection.id);
    if (!updated?.accessTokenEncrypted) {
      throw new XIntegrationError('X_TOKEN_REFRESH_FAILED', 'X token refresh did not persist.');
    }

    return {
      connection: updated,
      accessToken: this.decryptSecret(updated.accessTokenEncrypted),
    };
  }

  private async uploadTweetImageWithRetry(params: {
    connection: XConnectionRow;
    accessToken: string;
    imagePath: string;
    xConfig: XIntegrationConfig;
    requiredScopes: string[];
  }): Promise<{ mediaId: string; accessToken: string }> {
    let accessToken = params.accessToken;
    let response = await this.uploadTweetImage(params.imagePath, accessToken, params.xConfig);
    if (response.status === 401) {
      const refreshed = await this.ensureValidAccessToken(
        normalizePublishingTarget(params.connection.publishingTarget),
        params.requiredScopes,
        true,
      );
      accessToken = refreshed.accessToken;
      response = await this.uploadTweetImage(params.imagePath, accessToken, params.xConfig);
    }

    const rawBody = await response.text();
    const payload = parseResponseBody<XMediaUploadResponse | XApiErrorPayload>(rawBody);
    if (!response.ok) {
      throw new XIntegrationError(
        readXErrorCode(payload, response.status),
        describeErrorPayload(payload, rawBody),
      );
    }

    const mediaId = (payload as XMediaUploadResponse | null)?.data?.id;
    if (!mediaId) {
      throw new XIntegrationError(
        'X_MEDIA_UPLOAD_REJECTED',
        'X media upload returned no media id.',
      );
    }

    return { mediaId, accessToken };
  }

  private async uploadTweetImage(
    imagePath: string,
    accessToken: string,
    xConfig: XIntegrationConfig,
  ): Promise<Response> {
    const image = this.readImageFileForUpload(imagePath, xConfig);
    const form = new FormData();
    const body = image.bytes.buffer.slice(
      image.bytes.byteOffset,
      image.bytes.byteOffset + image.bytes.byteLength,
    ) as ArrayBuffer;
    form.append('media', new Blob([body], { type: image.mimeType }), image.fileName);
    form.append('media_category', 'tweet_image');
    form.append('media_type', image.mimeType);

    return await this.fetchWithTimeout(
      MEDIA_UPLOAD_URL,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: form,
      },
      xConfig.mediaUploadTimeoutMs,
    );
  }

  private async createTweetWithRetry(params: {
    connection: XConnectionRow;
    accessToken: string;
    text: string;
    mediaIds: string[];
    madeWithAi: boolean;
    xConfig: XIntegrationConfig;
    requiredScopes: string[];
  }): Promise<{ tweetId: string; text: string | null; editHistoryTweetIds: string[] }> {
    let accessToken = params.accessToken;
    let response = await this.createTweet({
      accessToken,
      text: params.text,
      mediaIds: params.mediaIds,
      madeWithAi: params.madeWithAi,
      xConfig: params.xConfig,
    });
    if (response.status === 401) {
      const refreshed = await this.ensureValidAccessToken(
        normalizePublishingTarget(params.connection.publishingTarget),
        params.requiredScopes,
        true,
      );
      accessToken = refreshed.accessToken;
      response = await this.createTweet({
        accessToken,
        text: params.text,
        mediaIds: params.mediaIds,
        madeWithAi: params.madeWithAi,
        xConfig: params.xConfig,
      });
    }

    const rawBody = await response.text();
    const payload = parseResponseBody<XCreatePostResponse | XApiErrorPayload>(rawBody);
    if (!response.ok) {
      throw new XIntegrationError(
        readXErrorCode(payload, response.status),
        describeErrorPayload(payload, rawBody),
      );
    }

    const tweetId = (payload as XCreatePostResponse | null)?.data?.id;
    if (!tweetId) {
      throw new XIntegrationError('X_CREATE_POST_FAILED', 'X create post returned no tweet id.');
    }

    return {
      tweetId,
      text: (payload as XCreatePostResponse | null)?.data?.text ?? null,
      editHistoryTweetIds:
        (payload as XCreatePostResponse | null)?.data?.edit_history_tweet_ids ?? [],
    };
  }

  private async createTweet(params: {
    accessToken: string;
    text: string;
    mediaIds: string[];
    madeWithAi: boolean;
    xConfig: XIntegrationConfig;
  }): Promise<Response> {
    const body: { text: string; media?: { media_ids: string[] }; made_with_ai?: boolean } = {
      text: params.text,
    };
    if (params.mediaIds.length > 0) {
      body.media = { media_ids: params.mediaIds };
      if (params.madeWithAi) {
        body.made_with_ai = true;
      }
    }

    return await this.fetchWithTimeout(
      CREATE_POST_URL,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${params.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
      params.xConfig.apiTimeoutMs,
    );
  }

  private async exchangeAuthorizationCode(
    code: string,
    codeVerifier: string,
    xConfig: XIntegrationConfig,
  ): Promise<XOAuth2TokenResponse> {
    const body = new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      redirect_uri: xConfig.redirectUri,
      code_verifier: codeVerifier,
    });
    const response = await this.fetchWithTimeout(
      TOKEN_URL,
      {
        method: 'POST',
        headers: {
          Authorization: this.buildBasicAuthHeader(xConfig),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      },
      xConfig.apiTimeoutMs,
    );
    const rawBody = await response.text();
    const payload = parseResponseBody<XOAuth2TokenResponse | XApiErrorPayload>(rawBody);

    if (!response.ok || !payload || !('access_token' in payload)) {
      throw new XIntegrationError(
        readXErrorCode(payload, response.status),
        describeErrorPayload(payload, rawBody),
      );
    }

    return payload;
  }

  private async fetchCurrentUser(
    accessToken: string,
    xConfig: XIntegrationConfig,
  ): Promise<XUsersMeResponse> {
    const response = await this.fetchWithTimeout(
      `${API_BASE_URL}/users/me`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      xConfig.apiTimeoutMs,
    );
    const rawBody = await response.text();
    const payload = parseResponseBody<XUsersMeResponse | XApiErrorPayload>(rawBody);

    if (!response.ok || !payload || !('data' in payload)) {
      throw new XIntegrationError(
        readXErrorCode(payload, response.status),
        describeErrorPayload(payload, rawBody),
      );
    }

    return payload;
  }

  private async revokeBestEffort(token: string, xConfig: XIntegrationConfig): Promise<void> {
    const body = new URLSearchParams({ token });
    try {
      await this.fetchWithTimeout(
        REVOKE_URL,
        {
          method: 'POST',
          headers: {
            Authorization: this.buildBasicAuthHeader(xConfig),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: body.toString(),
        },
        xConfig.apiTimeoutMs,
      );
    } catch {
      // Disconnect/account mismatch should still finish locally even if revoke is transiently unavailable.
    }
  }

  private async createOrLoadPublication(params: {
    connection: XConnectionRow;
    requestId: string;
    text: string;
    imagePaths: string[];
    madeWithAi: boolean;
  }): Promise<XPublicationRow> {
    const textHash = createHash('sha256').update(params.text).digest('hex');
    const now = new Date();

    const [existingPublication] = await this.db
      .select()
      .from(xPublications)
      .where(
        and(
          eq(xPublications.xConnectionId, params.connection.id),
          eq(xPublications.requestId, params.requestId),
        ),
      )
      .limit(1);

    if (existingPublication?.status === 'sent' || existingPublication?.status === 'unknown') {
      return existingPublication;
    }

    if (
      existingPublication?.status === 'uploading_media' ||
      existingPublication?.status === 'creating_post'
    ) {
      const [unknownPublication] = await this.db
        .update(xPublications)
        .set({
          status: 'unknown',
          errorCode: 'X_PUBLICATION_STATUS_UNKNOWN',
          errorDetailSanitized:
            'Previous X publication attempt stopped after external side effects may have started.',
          failedAt: new Date(),
        })
        .where(eq(xPublications.id, existingPublication.id))
        .returning();
      return unknownPublication ?? existingPublication;
    }

    await this.db
      .insert(xPublications)
      .values({
        id: generateId('x_publication'),
        requestId: params.requestId,
        xConnectionId: params.connection.id,
        textHash,
        textPreviewSanitized: sanitizePreview(params.text),
        hasMedia: params.imagePaths.length > 0,
        mediaCount: params.imagePaths.length,
        mediaAssetIds: params.imagePaths.map((item) => basename(item)),
        madeWithAi: params.madeWithAi,
        status: 'pending',
        startedAt: now,
      })
      .onConflictDoUpdate({
        target: [xPublications.xConnectionId, xPublications.requestId],
        set: {
          textHash,
          textPreviewSanitized: sanitizePreview(params.text),
          hasMedia: params.imagePaths.length > 0,
          mediaCount: params.imagePaths.length,
          mediaAssetIds: params.imagePaths.map((item) => basename(item)),
          madeWithAi: params.madeWithAi,
          status: 'pending',
          startedAt: now,
          failedAt: null,
          errorCode: null,
          errorDetailSanitized: null,
        },
      });

    const [publication] = await this.db
      .select()
      .from(xPublications)
      .where(
        and(
          eq(xPublications.xConnectionId, params.connection.id),
          eq(xPublications.requestId, params.requestId),
        ),
      )
      .limit(1);
    if (!publication) {
      throw new XIntegrationError(
        'X_PUBLICATION_CREATE_FAILED',
        'Failed to create X publication record.',
      );
    }

    return publication;
  }

  private async markPublication(id: string, status: string): Promise<void> {
    await this.db.update(xPublications).set({ status }).where(eq(xPublications.id, id));
  }

  private async markConnectionError(id: string, code: string): Promise<void> {
    await this.db
      .update(xConnections)
      .set({
        status: code === 'X_REAUTHORIZATION_REQUIRED' ? 'reauth_required' : 'error',
        lastErrorCode: code,
        lastErrorAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(xConnections.id, id));
  }

  private async findActiveConnection(
    publishingTarget: XPublishingTarget,
  ): Promise<XConnectionRow | null> {
    const [connection] = await this.db
      .select()
      .from(xConnections)
      .where(
        and(
          eq(xConnections.tenantId, TENANT_ID),
          eq(xConnections.publishingTarget, publishingTarget),
          eq(xConnections.status, 'active'),
        ),
      )
      .orderBy(desc(xConnections.updatedAt))
      .limit(1);
    return connection ?? null;
  }

  private async findLatestConnection(
    publishingTarget: XPublishingTarget,
  ): Promise<XConnectionRow | null> {
    const [connection] = await this.db
      .select()
      .from(xConnections)
      .where(
        and(
          eq(xConnections.tenantId, TENANT_ID),
          eq(xConnections.publishingTarget, publishingTarget),
        ),
      )
      .orderBy(desc(xConnections.updatedAt))
      .limit(1);
    return connection ?? null;
  }

  private async findConnectionById(id: string): Promise<XConnectionRow | null> {
    const [connection] = await this.db
      .select()
      .from(xConnections)
      .where(eq(xConnections.id, id))
      .limit(1);
    return connection ?? null;
  }

  private validatePostInput(text: string, imagePaths: string[], xConfig: XIntegrationConfig): void {
    if (!text.trim() && imagePaths.length === 0) {
      throw new XIntegrationError('X_VALIDATION_ERROR', 'X post requires text or image.');
    }

    const textLength = Array.from(text).length;
    if (textLength > X_STANDARD_POST_CHARACTER_LIMIT) {
      throw new XIntegrationError(
        'X_VALIDATION_ERROR',
        `X post is ${textLength} characters; limit is ${X_STANDARD_POST_CHARACTER_LIMIT}.`,
      );
    }

    if (imagePaths.length > xConfig.mediaMaxImagesPerPost) {
      throw new XIntegrationError(
        'LOCAL_MEDIA_VALIDATION_ERROR',
        `X post has ${imagePaths.length} images; limit is ${xConfig.mediaMaxImagesPerPost}.`,
      );
    }
  }

  private readImageFileForUpload(
    imagePath: string,
    xConfig: XIntegrationConfig,
  ): ImageFileForUpload {
    if (!existsSync(imagePath)) {
      throw new XIntegrationError(
        'LOCAL_MEDIA_VALIDATION_ERROR',
        `Image file does not exist: ${imagePath}`,
      );
    }

    const stat = statSync(imagePath);
    if (!stat.isFile()) {
      throw new XIntegrationError(
        'LOCAL_MEDIA_VALIDATION_ERROR',
        `Image path is not a file: ${imagePath}`,
      );
    }

    if (stat.size <= 0 || stat.size > xConfig.mediaMaxImageSizeBytes) {
      throw new XIntegrationError(
        'LOCAL_MEDIA_VALIDATION_ERROR',
        `Image size ${stat.size} bytes is outside allowed range 1-${xConfig.mediaMaxImageSizeBytes}.`,
      );
    }

    const bytes = readFileSync(imagePath);
    const mimeType = sniffImageMimeType(bytes);
    if (!mimeType || !xConfig.mediaAllowedMimeTypes.has(mimeType)) {
      throw new XIntegrationError(
        'LOCAL_MEDIA_VALIDATION_ERROR',
        `Image MIME type ${mimeType ?? 'unknown'} is not allowed for X publishing.`,
      );
    }

    return {
      bytes,
      mimeType,
      fileName: safeImageFileName(imagePath, mimeType),
    };
  }

  private encryptSecret(value: string): string {
    const key = this.readEncryptionKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return JSON.stringify({
      v: 1,
      alg: 'AES-256-GCM',
      iv: iv.toString('base64'),
      ciphertext: ciphertext.toString('base64'),
      tag: tag.toString('base64'),
    });
  }

  private decryptSecret(envelope: string): string {
    const parsed = JSON.parse(envelope) as {
      v?: number;
      alg?: string;
      iv?: string;
      ciphertext?: string;
      tag?: string;
    };
    if (
      parsed.v !== 1 ||
      parsed.alg !== 'AES-256-GCM' ||
      !parsed.iv ||
      !parsed.ciphertext ||
      !parsed.tag
    ) {
      throw new XIntegrationError('X_TOKEN_DECRYPT_FAILED', 'Invalid encrypted token envelope.');
    }

    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.readEncryptionKey(),
      Buffer.from(parsed.iv, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(parsed.tag, 'base64'));
    return Buffer.concat([
      decipher.update(Buffer.from(parsed.ciphertext, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  }

  private readEncryptionKey(): Buffer {
    const raw = this.config.get<string>('X_TOKEN_ENCRYPTION_KEY')?.trim();
    if (!raw) {
      throw new XIntegrationError('X_CONFIG_MISSING', 'X_TOKEN_ENCRYPTION_KEY is required.');
    }

    const key = Buffer.from(raw, 'base64');
    if (key.byteLength !== 32) {
      throw new XIntegrationError(
        'X_CONFIG_INVALID',
        'X_TOKEN_ENCRYPTION_KEY must decode to 32 bytes.',
      );
    }

    return key;
  }

  private readRequiredConfig(): XIntegrationConfig {
    const clientId = this.config.get<string>('X_CLIENT_ID')?.trim();
    const clientSecret = this.config.get<string>('X_CLIENT_SECRET')?.trim();
    const redirectUri = this.config.get<string>('X_REDIRECT_URI')?.trim();
    if (!clientId || !clientSecret || !redirectUri) {
      throw new XIntegrationError(
        'X_CONFIG_MISSING',
        'X_CLIENT_ID, X_CLIENT_SECRET, and X_REDIRECT_URI are required.',
      );
    }

    const parsedRedirect = new URL(redirectUri);
    if (process.env.NODE_ENV === 'production' && parsedRedirect.protocol !== 'https:') {
      throw new XIntegrationError(
        'X_CONFIG_INVALID',
        'X_REDIRECT_URI must use HTTPS in production.',
      );
    }

    const scopes = parseScopes(
      this.config.get<string>('X_OAUTH_SCOPES')?.trim() ||
        'tweet.read users.read tweet.write media.write offline.access',
    );
    assertScopes(scopes, REQUIRED_CONNECT_SCOPES);

    return {
      clientId,
      clientSecret,
      redirectUri,
      scopes,
      expectedUserId: this.config.get<string>('X_EXPECTED_USER_ID')?.trim() || null,
      expectedUsername: this.config.get<string>('X_EXPECTED_USERNAME')?.trim() || null,
      apiTimeoutMs: readInteger(this.config.get<string>('X_API_TIMEOUT_MS'), 15_000),
      mediaUploadTimeoutMs: readInteger(
        this.config.get<string>('X_MEDIA_UPLOAD_TIMEOUT_MS'),
        30_000,
      ),
      tokenRefreshSkewSeconds: readInteger(
        this.config.get<string>('X_TOKEN_REFRESH_SKEW_SECONDS'),
        300,
      ),
      postingEnabled: readBoolean(this.config.get<string>('X_POSTING_ENABLED'), true),
      mediaMaxImagesPerPost: Math.min(
        4,
        Math.max(1, readInteger(this.config.get<string>('X_MEDIA_MAX_IMAGES_PER_POST'), 4)),
      ),
      mediaMaxImageSizeBytes: readInteger(
        this.config.get<string>('X_MEDIA_MAX_IMAGE_SIZE_BYTES'),
        5 * 1024 * 1024,
      ),
      mediaAllowedMimeTypes: new Set(
        (
          this.config.get<string>('X_MEDIA_ALLOWED_MIME_TYPES') ||
          'image/jpeg,image/png,image/webp,image/gif'
        )
          .split(',')
          .map((item) => item.trim().toLowerCase())
          .filter(Boolean),
      ),
      markAiMedia: readBoolean(this.config.get<string>('X_MARK_AI_MEDIA'), false),
    };
  }

  private isConfigured(): boolean {
    return Boolean(
      this.config.get<string>('X_CLIENT_ID')?.trim() &&
        this.config.get<string>('X_CLIENT_SECRET')?.trim() &&
        this.config.get<string>('X_REDIRECT_URI')?.trim() &&
        this.config.get<string>('X_TOKEN_ENCRYPTION_KEY')?.trim(),
    );
  }

  private buildBasicAuthHeader(xConfig: XIntegrationConfig): string {
    return `Basic ${Buffer.from(`${xConfig.clientId}:${xConfig.clientSecret}`).toString('base64')}`;
  }

  private async fetchWithTimeout(
    url: string,
    init: RequestInit,
    timeoutMs: number,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  }

  private async withRefreshLock<T>(key: string, callback: () => Promise<T>): Promise<T> {
    const existing = this.refreshLocks.get(key);
    if (existing) {
      await existing;
    }

    let release!: () => void;
    const lock = new Promise<void>((resolve) => {
      release = resolve;
    });
    this.refreshLocks.set(key, lock);

    try {
      return await callback();
    } finally {
      release();
      if (this.refreshLocks.get(key) === lock) {
        this.refreshLocks.delete(key);
      }
    }
  }
}

function normalizePublishingTarget(value: string | null | undefined): XPublishingTarget {
  return value === 'production' ? 'production' : 'test';
}

function parseScopes(value: string | null | undefined): string[] {
  return [
    ...new Set(
      (value ?? '')
        .split(/\s+/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

function normalizeScopes(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function assertScopes(scopes: string[], requiredScopes: string[]): void {
  const missing = requiredScopes.filter((scope) => !scopes.includes(scope));
  if (missing.length > 0) {
    throw new XIntegrationError(
      'X_INSUFFICIENT_SCOPE',
      `X connection is missing required scope(s): ${missing.join(', ')}.`,
    );
  }
}

function hashSecret(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function assertConstantTimeEqual(left: string, right: string): void {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (
    leftBuffer.byteLength !== rightBuffer.byteLength ||
    !timingSafeEqual(leftBuffer, rightBuffer)
  ) {
    throw new XIntegrationError('X_OAUTH_STATE_INVALID', 'X OAuth state mismatch.');
  }
}

function readRequired(value: string | null | undefined, message: string): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new XIntegrationError('X_VALIDATION_ERROR', message);
  }
  return trimmed;
}

function readPositiveNumber(value: number | null | undefined, message: string): number {
  if (!Number.isFinite(value) || !value || value <= 0) {
    throw new XIntegrationError('X_VALIDATION_ERROR', message);
  }
  return value;
}

function readInteger(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value == null || value.trim() === '') {
    return fallback;
  }
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

function parseResponseBody<T>(rawBody: string): T | null {
  if (!rawBody.trim()) {
    return null;
  }

  try {
    return JSON.parse(rawBody) as T;
  } catch {
    return null;
  }
}

function readXErrorCode(
  payload: XApiErrorPayload | XOAuth2TokenResponse | null,
  status: number,
): string {
  const joined = [
    payload?.error,
    payload?.error_description,
    payload && 'title' in payload ? payload.title : null,
    payload && 'detail' in payload ? payload.detail : null,
    payload && 'type' in payload ? payload.type : null,
    payload && 'errors' in payload ? payload.errors?.map((item) => item.message).join(' ') : null,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (joined.includes('invalid_grant') || joined.includes('revoked')) {
    return 'X_REAUTHORIZATION_REQUIRED';
  }
  if (joined.includes('scope')) {
    return 'X_INSUFFICIENT_SCOPE';
  }
  if (joined.includes('credit') || joined.includes('usage cap') || joined.includes('billing')) {
    return 'BILLING_CREDITS_DEPLETED';
  }
  if (status === 401) {
    return 'ACCESS_TOKEN_INVALID';
  }
  if (status === 429) {
    return 'X_RATE_LIMITED';
  }
  if (status >= 500) {
    return 'X_UPSTREAM_UNAVAILABLE';
  }
  if (status === 400 || status === 403) {
    return 'X_VALIDATION_ERROR';
  }
  return 'X_API_ERROR';
}

function describeErrorPayload(
  payload:
    | XApiErrorPayload
    | XOAuth2TokenResponse
    | XUsersMeResponse
    | XCreatePostResponse
    | XMediaUploadResponse
    | null,
  rawBody: string,
): string {
  if (!payload) {
    return sanitizeErrorDetail(rawBody.trim() || 'X response body is empty.');
  }

  const parts: string[] = [];
  if ('error' in payload && payload.error) {
    parts.push(`Error: ${payload.error}`);
  }
  if ('error_description' in payload && payload.error_description) {
    parts.push(`Description: ${payload.error_description}`);
  }
  if ('title' in payload && payload.title) {
    parts.push(`Title: ${payload.title}`);
  }
  if ('detail' in payload && payload.detail) {
    parts.push(`Detail: ${payload.detail}`);
  }
  if ('type' in payload && payload.type) {
    parts.push(`Type: ${payload.type}`);
  }
  if ('errors' in payload && payload.errors?.length) {
    parts.push(
      `Message: ${payload.errors
        .map((item) => item.message)
        .filter(Boolean)
        .join('; ')}`,
    );
  }
  return sanitizeErrorDetail(parts.join(' ') || rawBody);
}

function sanitizeErrorDetail(value: string): string {
  return value
    .replace(/code=[^&\s]+/gi, 'code=[redacted]')
    .replace(/access_token["']?\s*[:=]\s*["']?[^"',\s]+/gi, 'access_token=[redacted]')
    .replace(/refresh_token["']?\s*[:=]\s*["']?[^"',\s]+/gi, 'refresh_token=[redacted]')
    .slice(0, MAX_ERROR_DETAIL_LENGTH);
}

function sanitizePreview(value: string): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, 240);
}

function safeReturnTo(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed?.startsWith('/') || trimmed.startsWith('//')) {
    return null;
  }
  return trimmed;
}

function sniffImageMimeType(bytes: Buffer): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return 'image/png';
  }
  if (
    bytes.length >= 12 &&
    bytes.toString('ascii', 0, 4) === 'RIFF' &&
    bytes.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }
  if (bytes.length >= 6 && ['GIF87a', 'GIF89a'].includes(bytes.toString('ascii', 0, 6))) {
    return 'image/gif';
  }
  return null;
}

function safeImageFileName(imagePath: string, mimeType: string): string {
  const name = basename(imagePath).replace(/[^a-zA-Z0-9._-]/g, '_');
  if (name.includes('.')) {
    return name;
  }
  const extension =
    mimeType === 'image/png'
      ? '.png'
      : mimeType === 'image/webp'
        ? '.webp'
        : mimeType === 'image/gif'
          ? '.gif'
          : '.jpg';
  return `${name}${extension}`;
}

function normalizeError(error: unknown): { code: string; message: string } {
  if (error instanceof XIntegrationError) {
    return { code: error.code, message: error.message };
  }
  if (error instanceof Error) {
    return { code: 'X_PUBLICATION_FAILED', message: error.message };
  }
  return { code: 'X_PUBLICATION_FAILED', message: String(error) };
}
