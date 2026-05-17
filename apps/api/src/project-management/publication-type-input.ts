import { BadRequestException } from '@nestjs/common';

type PublicationType = 'default' | 'long' | 'medium' | 'thread';

const NON_X_PUBLICATION_TYPE_ALIASES: Record<string, PublicationType> = {
  default: 'default',
  post: 'default',
  long: 'default',
  medium: 'default',
  thread: 'default',
  long_post: 'default',
  single_post: 'default',
  community_post: 'default',
  announcement: 'default',
  launch_announcement: 'default',
  editorial_post: 'default',
};

const X_PUBLICATION_TYPE_ALIASES: Record<string, PublicationType> = {
  long: 'long',
  medium: 'medium',
  thread: 'thread',
  default: 'medium',
  post: 'medium',
  single_post: 'medium',
  announcement: 'medium',
  community_post: 'medium',
  long_post: 'long',
  launch_announcement: 'long',
  editorial_post: 'long',
};

function normalizeToken(value?: string | null): string {
  return String(value || '').trim().toLowerCase();
}

export function normalizePublicationTypeInput(
  channel: string,
  publicationType: string,
  fieldName: string,
): string {
  const normalizedChannel = normalizeToken(channel);
  const normalizedType = normalizeToken(publicationType);
  const aliases =
    normalizedChannel === 'channel_x'
      ? X_PUBLICATION_TYPE_ALIASES
      : NON_X_PUBLICATION_TYPE_ALIASES;
  const resolved = aliases[normalizedType || 'default'];

  if (!resolved) {
    throw new BadRequestException(`${fieldName} is invalid for channel ${channel}`);
  }

  return resolved;
}
