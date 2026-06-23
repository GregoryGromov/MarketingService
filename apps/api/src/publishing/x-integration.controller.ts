import {
  type BeginXConnectResult,
  type PublishXPostResult,
  XIntegrationService,
} from '@marketing-service/infrastructure';
import { Body, Controller, Delete, Get, Inject, Post, Query, Res } from '@nestjs/common';
import type { FastifyReply } from 'fastify';

type PublishingTarget = 'test' | 'production';

@Controller('api/integrations/x')
export class XIntegrationController {
  constructor(
    @Inject(XIntegrationService)
    private readonly xIntegration: XIntegrationService,
  ) {}

  @Get('connect')
  async connectRedirect(
    @Query('publishingTarget') publishingTarget: PublishingTarget | string | undefined,
    @Query('returnTo') returnTo: string | undefined,
    @Res() reply: FastifyReply,
  ): Promise<FastifyReply> {
    const result = await this.xIntegration.beginConnect({
      publishingTarget,
      returnTo,
    });

    return reply.status(302).header('Location', result.authorizationUrl).send();
  }

  @Post('connect')
  async connect(
    @Body()
    body: { publishingTarget?: PublishingTarget | string | null; returnTo?: string | null },
  ): Promise<BeginXConnectResult> {
    return this.xIntegration.beginConnect({
      publishingTarget: body?.publishingTarget,
      returnTo: body?.returnTo,
    });
  }

  @Get('callback')
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Query('error_description') errorDescription: string | undefined,
    @Res() reply: FastifyReply,
  ): Promise<FastifyReply> {
    try {
      const status = await this.xIntegration.completeCallback({
        code,
        state,
        error,
        errorDescription,
      });
      const returnLink = status.returnTo
        ? `<p><a href="${escapeHtml(status.returnTo)}">Return to app</a></p>`
        : '';
      return reply
        .type('text/html')
        .send(
          renderHtml('X connected', [
            `Connected @${status.username ?? 'unknown'} for ${status.publishingTarget}.`,
            returnLink,
          ]),
        );
    } catch (callbackError) {
      const message =
        callbackError instanceof Error ? callbackError.message : String(callbackError);
      return reply
        .status(400)
        .type('text/html')
        .send(renderHtml('X connection failed', [message]));
    }
  }

  @Get('status')
  async status(
    @Query('publishingTarget') publishingTarget?: PublishingTarget | string | null,
  ): ReturnType<XIntegrationService['getStatus']> {
    return this.xIntegration.getStatus(publishingTarget);
  }

  @Delete('connection')
  async disconnect(
    @Query('publishingTarget') queryPublishingTarget: PublishingTarget | string | undefined,
    @Body()
    body?: {
      publishingTarget?: PublishingTarget | string | null;
    },
  ): ReturnType<XIntegrationService['disconnect']> {
    return this.xIntegration.disconnect(body?.publishingTarget ?? queryPublishingTarget);
  }

  @Post('posts')
  async publishPost(
    @Body()
    body: {
      text: string;
      imagePath?: string | null;
      publishingTarget?: PublishingTarget | string | null;
      madeWithAi?: boolean | null;
      requestId?: string | null;
    },
  ): Promise<PublishXPostResult> {
    return this.xIntegration.publishPost({
      text: body.text,
      imagePath: body.imagePath,
      publishingTarget: body.publishingTarget === 'production' ? 'production' : 'test',
      madeWithAi: body.madeWithAi,
      requestId: body.requestId,
    });
  }
}

function renderHtml(title: string, lines: string[]): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(
    title,
  )}</title></head><body><h1>${escapeHtml(title)}</h1>${lines
    .map((line) => (line.startsWith('<') ? line : `<p>${escapeHtml(line)}</p>`))
    .join('')}</body></html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
