export type PublicationType = 'default' | 'long' | 'medium' | 'thread';

export interface PublicationTypeOption {
  value: PublicationType;
  label: string;
}

const DEFAULT_PUBLICATION_TYPE_OPTIONS = [{ value: 'default', label: 'Default' }] as const;
const X_PUBLICATION_TYPE_OPTIONS = [
  { value: 'long', label: 'Long' },
  { value: 'medium', label: 'Medium' },
  { value: 'thread', label: 'Thread' },
] as const;

export const PUBLICATION_TYPE_OPTIONS_BY_CHANNEL: Record<
  string,
  readonly PublicationTypeOption[]
> = {
  channel_telegram: DEFAULT_PUBLICATION_TYPE_OPTIONS,
  channel_discord: DEFAULT_PUBLICATION_TYPE_OPTIONS,
  channel_blog: DEFAULT_PUBLICATION_TYPE_OPTIONS,
  channel_x: X_PUBLICATION_TYPE_OPTIONS,
} as const;

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

export function getPublicationTypeOptionsForChannel(
  channel: string,
): readonly PublicationTypeOption[] {
  const normalizedChannel = normalizeToken(channel);
  return PUBLICATION_TYPE_OPTIONS_BY_CHANNEL[normalizedChannel] ?? DEFAULT_PUBLICATION_TYPE_OPTIONS;
}

export function getDefaultPublicationTypeForChannel(channel: string): PublicationType {
  return getPublicationTypeOptionsForChannel(channel)[0]?.value ?? 'default';
}

export function resolvePublicationTypeForChannel(
  channel: string,
  publicationType?: string | null,
): PublicationType | null {
  const normalizedChannel = normalizeToken(channel);
  const normalizedType = normalizeToken(publicationType);

  if (!normalizedType) {
    return getDefaultPublicationTypeForChannel(normalizedChannel);
  }

  if (normalizedChannel === 'channel_x') {
    return X_PUBLICATION_TYPE_ALIASES[normalizedType] ?? null;
  }

  return NON_X_PUBLICATION_TYPE_ALIASES[normalizedType] ?? null;
}

export function normalizePublicationTypeForChannel(
  channel: string,
  publicationType?: string | null,
): PublicationType {
  return (
    resolvePublicationTypeForChannel(channel, publicationType) ??
    getDefaultPublicationTypeForChannel(channel)
  );
}

export function describePublicationTypeForChannel(
  channel: string,
  publicationType?: string | null,
): string {
  const normalizedChannel = normalizeToken(channel);
  const normalizedType = normalizePublicationTypeForChannel(normalizedChannel, publicationType);

  if (normalizedChannel === 'channel_x') {
    if (normalizedType === 'long') {
      return 'Write one substantial X post that fits the standard 280-character API limit. Aim for 220 to 260 characters, with strong context, a clear angle, and a complete thought. Do not turn it into a thread.';
    }
    if (normalizedType === 'thread') {
      return 'Write a thread-ready X post plan, but keep the actual output as one publishable first post under 260 characters until thread publishing is enabled.';
    }
    return 'Write one medium-length X post under 220 characters: compact, fast to read, and complete as a single standalone post. Do not turn it into a thread.';
  }

  if (normalizedChannel === 'channel_blog') {
    return 'Write the standard blog format for this channel: one complete publication in normal prose, not a thread and not a social one-liner.';
  }

  if (normalizedChannel === 'channel_discord') {
    return 'Write the standard Discord format for this channel: one community-friendly post, concise, readable, and self-contained.';
  }

  return 'Write the standard publication format for this channel: one complete standalone post in the normal channel style.';
}
