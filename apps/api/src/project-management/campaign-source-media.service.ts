import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import sharp from 'sharp';

export interface CampaignMediaAspectRatios {
  telegram?: string | null;
  x?: string | null;
  discord?: string | null;
  blog?: string | null;
}

interface ParsedDataUrl {
  mimeType: string;
  extension: string;
  buffer: Buffer;
}

const DEFAULT_MEDIA_ASPECT_RATIOS: Required<Record<keyof CampaignMediaAspectRatios, string>> = {
  telegram: '1:1',
  x: '16:9',
  discord: '16:9',
  blog: '1200:630',
};

const CHANNEL_RATIO_KEYS: Array<{
  key: keyof CampaignMediaAspectRatios;
  channelId: string;
}> = [
  { key: 'telegram', channelId: 'channel_telegram' },
  { key: 'x', channelId: 'channel_x' },
  { key: 'discord', channelId: 'channel_discord' },
  { key: 'blog', channelId: 'channel_blog' },
];

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

@Injectable()
export class CampaignSourceMediaService {
  constructor(private readonly config: ConfigService) {}

  async saveSourceImage(params: {
    campaignId: string;
    dataUrl: string;
    aspectRatios?: CampaignMediaAspectRatios | null;
  }): Promise<string> {
    const parsed = this.parseImageDataUrl(params.dataUrl);
    const dir = this.resolveCampaignMediaDir(params.campaignId);
    await mkdir(dir, { recursive: true });

    const originalPath = join(dir, `source${parsed.extension}`);
    await writeFile(originalPath, parsed.buffer, { mode: 0o600 });

    await Promise.all(
      CHANNEL_RATIO_KEYS.map(({ key, channelId }) =>
        this.createChannelVariant({
          input: parsed.buffer,
          outputPath: resolveChannelImageVariantPath(originalPath, channelId),
          ratioText: params.aspectRatios?.[key] ?? DEFAULT_MEDIA_ASPECT_RATIOS[key],
        }),
      ),
    );

    return originalPath;
  }

  private parseImageDataUrl(dataUrl: string): ParsedDataUrl {
    const match = /^data:(image\/(?:jpeg|jpg|png|webp));base64,([a-zA-Z0-9+/=]+)$/i.exec(
      dataUrl.trim(),
    );

    if (!match) {
      throw new Error('Source image must be a JPEG, PNG, or WebP data URL.');
    }

    const mimeType = match[1]!.toLowerCase().replace('image/jpg', 'image/jpeg');
    const buffer = Buffer.from(match[2]!, 'base64');

    if (buffer.byteLength === 0) {
      throw new Error('Source image is empty.');
    }

    if (buffer.byteLength > MAX_IMAGE_BYTES) {
      throw new Error('Source image is too large. Maximum size is 10 MB.');
    }

    return {
      mimeType,
      extension: mimeType === 'image/png' ? '.png' : mimeType === 'image/webp' ? '.webp' : '.jpg',
      buffer,
    };
  }

  private resolveCampaignMediaDir(campaignId: string): string {
    return resolve(
      this.config.get<string>('CAMPAIGN_MEDIA_DIR')?.trim() || 'var/campaign-media',
      campaignId,
    );
  }

  private async createChannelVariant(params: {
    input: Buffer;
    outputPath: string;
    ratioText: string;
  }): Promise<void> {
    const ratio = parseAspectRatio(params.ratioText);
    const width = ratio.width >= ratio.height ? 1600 : Math.round((1600 * ratio.width) / ratio.height);
    const height = ratio.width >= ratio.height ? Math.round((1600 * ratio.height) / ratio.width) : 1600;

    await sharp(params.input)
      .rotate()
      .resize({
        width,
        height,
        fit: 'cover',
        position: 'centre',
      })
      .jpeg({ quality: 88, mozjpeg: true })
      .toFile(params.outputPath);
  }
}

export function resolveChannelImageVariantPath(
  originalPath: string,
  channelId: string,
): string {
  return join(dirname(originalPath), `${channelId}.jpg`);
}

function parseAspectRatio(value: string): { width: number; height: number } {
  const normalized = value.trim().toLowerCase();
  const pairMatch = /^(\d+(?:\.\d+)?)\s*[:/x]\s*(\d+(?:\.\d+)?)$/.exec(normalized);

  if (pairMatch) {
    const width = Number(pairMatch[1]);
    const height = Number(pairMatch[2]);
    if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
      return { width, height };
    }
  }

  const decimal = Number(normalized);
  if (Number.isFinite(decimal) && decimal > 0) {
    return { width: decimal, height: 1 };
  }

  return { width: 1, height: 1 };
}
