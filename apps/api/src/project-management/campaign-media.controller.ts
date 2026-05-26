import { createReadStream, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { FastifyReply } from 'fastify';
import { CampaignSourceMediaService } from './campaign-source-media.service';

const MEDIA_FILE_PATTERN = /^(source\.(jpe?g|png|webp)|channel_(telegram|x|discord|blog)\.jpg)$/i;
const CHANNEL_ID_PATTERN = /^channel_(telegram|x|discord|blog)$/i;

function contentTypeFor(fileName: string): string {
  const normalized = fileName.toLowerCase();
  if (normalized.endsWith('.png')) {
    return 'image/png';
  }
  if (normalized.endsWith('.webp')) {
    return 'image/webp';
  }
  return 'image/jpeg';
}

@Controller('campaign-media')
export class CampaignMediaController {
  constructor(
    private readonly config: ConfigService,
    private readonly sourceMediaService: CampaignSourceMediaService,
  ) {}

  @Post(':campaignId/:channelId')
  async replaceCampaignChannelMedia(
    @Param('campaignId') campaignId: string,
    @Param('channelId') channelId: string,
    @Body() body: { sourceImageDataUrl?: string | null },
  ): Promise<{ imageUrl: string }> {
    if (!/^campaign_[a-z0-9]+$/i.test(campaignId) || !CHANNEL_ID_PATTERN.test(channelId)) {
      throw new NotFoundException('Campaign media not found');
    }

    const sourceImageDataUrl = body.sourceImageDataUrl?.trim();
    if (!sourceImageDataUrl) {
      throw new NotFoundException('Campaign media not found');
    }

    await this.sourceMediaService.saveChannelImageVariant({
      campaignId,
      channelId,
      dataUrl: sourceImageDataUrl,
    });

    return {
      imageUrl: `/campaign-media/${encodeURIComponent(campaignId)}/${encodeURIComponent(`${channelId}.jpg`)}`,
    };
  }

  @Delete(':campaignId/:channelId')
  async deleteCampaignChannelMedia(
    @Param('campaignId') campaignId: string,
    @Param('channelId') channelId: string,
  ): Promise<{ ok: true }> {
    if (!/^campaign_[a-z0-9]+$/i.test(campaignId) || !CHANNEL_ID_PATTERN.test(channelId)) {
      throw new NotFoundException('Campaign media not found');
    }

    await this.sourceMediaService.deleteChannelImageVariant({ campaignId, channelId });
    return { ok: true };
  }

  @Get(':campaignId/:fileName')
  getCampaignMedia(
    @Param('campaignId') campaignId: string,
    @Param('fileName') fileName: string,
    @Res() reply: FastifyReply,
  ): FastifyReply {
    if (!/^campaign_[a-z0-9]+$/i.test(campaignId) || !MEDIA_FILE_PATTERN.test(fileName)) {
      throw new NotFoundException('Campaign media not found');
    }

    const mediaRoot = resolve(this.config.get<string>('CAMPAIGN_MEDIA_DIR')?.trim() || 'var/campaign-media');
    const filePath = resolve(mediaRoot, campaignId, fileName);

    if (!filePath.startsWith(`${mediaRoot}/`) || !existsSync(filePath)) {
      throw new NotFoundException('Campaign media not found');
    }

    reply.header('Content-Type', contentTypeFor(fileName));
    reply.header('Cache-Control', 'public, max-age=31536000, immutable');
    return reply.send(createReadStream(filePath));
  }
}
