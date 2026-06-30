import { randomUUID } from 'node:crypto';
import { createReadStream, existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { FastifyReply, FastifyRequest } from 'fastify';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const IMAGE_DATA_URL_PATTERN = /^data:(image\/(?:jpeg|jpg|png|webp));base64,([a-zA-Z0-9+/=]+)$/i;
const PUBLIC_IMAGE_PATTERN = /^[a-f0-9-]+\.(jpe?g|png|webp)$/i;

interface UploadImageBody {
  imageDataUrl?: string | null;
}

interface ParsedImageUpload {
  buffer: Buffer;
  extension: string;
}

@Controller('uploads/images')
export class ImageUploadController {
  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}

  @Post()
  async uploadImage(
    @Body() body: UploadImageBody,
    @Req() request: FastifyRequest,
  ): Promise<{ url: string; path: string }> {
    const image = parseImageDataUrl(body.imageDataUrl);
    const fileName = `${randomUUID()}${image.extension}`;
    const uploadRoot = this.resolveUploadRoot();
    const filePath = join(uploadRoot, fileName);

    await mkdir(uploadRoot, { recursive: true });
    await writeOriginalImageFile(filePath, image.buffer);

    const path = `/uploads/images/${fileName}`;
    return {
      path,
      url: `${this.resolvePublicBaseUrl(request)}${path}`,
    };
  }

  @Get(':fileName')
  getImage(@Param('fileName') fileName: string, @Res() reply: FastifyReply): FastifyReply {
    if (!PUBLIC_IMAGE_PATTERN.test(fileName)) {
      throw new BadRequestException('Invalid image file name');
    }

    const uploadRoot = this.resolveUploadRoot();
    const filePath = resolve(uploadRoot, fileName);
    if (!filePath.startsWith(`${uploadRoot}/`) || !existsSync(filePath)) {
      throw new BadRequestException('Image not found');
    }

    reply.header('Content-Type', contentTypeFor(fileName));
    reply.header('Cache-Control', 'public, max-age=31536000, immutable');
    return reply.send(createReadStream(filePath));
  }

  private resolveUploadRoot(): string {
    return resolve(this.config.get<string>('PUBLIC_UPLOAD_DIR')?.trim() || 'var/uploads/images');
  }

  private resolvePublicBaseUrl(request: FastifyRequest): string {
    const configured = this.config.get<string>('PUBLIC_BASE_URL')?.trim();
    if (configured) {
      return configured.replace(/\/+$/, '');
    }

    const host = String(request.headers['x-forwarded-host'] ?? request.headers.host ?? '').trim();
    if (!host) {
      return '';
    }
    const forwardedProto = String(request.headers['x-forwarded-proto'] ?? '')
      .split(',')[0]
      ?.trim();
    const proto =
      forwardedProto ||
      (host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https');
    return `${proto}://${host}`;
  }
}

function parseImageDataUrl(value: unknown): ParsedImageUpload {
  if (typeof value !== 'string') {
    throw new BadRequestException('imageDataUrl is required');
  }

  const match = IMAGE_DATA_URL_PATTERN.exec(value.trim());
  const mimeType = match?.[1]?.toLowerCase().replace('image/jpg', 'image/jpeg');
  const payload = match?.[2];
  if (!mimeType || !payload) {
    throw new BadRequestException('Upload must be a JPEG, PNG, or WebP image');
  }

  const buffer = Buffer.from(payload, 'base64');
  if (buffer.byteLength === 0) {
    throw new BadRequestException('Image is empty');
  }
  if (buffer.byteLength > MAX_UPLOAD_BYTES) {
    throw new BadRequestException('Image is too large. Maximum size is 10 MB');
  }
  return {
    buffer,
    extension: extensionForMimeType(mimeType),
  };
}

async function writeOriginalImageFile(filePath: string, buffer: Buffer): Promise<void> {
  await writeFile(filePath, buffer, { mode: 0o644 });
}

function extensionForMimeType(mimeType: string): string {
  if (mimeType === 'image/png') {
    return '.png';
  }
  if (mimeType === 'image/webp') {
    return '.webp';
  }
  return '.jpg';
}

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
