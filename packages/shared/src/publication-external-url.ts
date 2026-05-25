export interface PublicationExternalUrlParams {
  channelId: string;
  externalAccountRef?: string | null;
  externalPostId?: string | null;
}

export function resolvePublicationExternalUrl(
  params: PublicationExternalUrlParams,
): string | null {
  const channelId = params.channelId;
  const postId = params.externalPostId?.trim();
  const accountRef = params.externalAccountRef?.trim() ?? '';

  if (!postId) {
    return null;
  }

  if (channelId === 'channel_x') {
    return `https://x.com/i/web/status/${encodeURIComponent(postId)}`;
  }

  if (channelId === 'channel_telegram') {
    return resolveTelegramUrl(accountRef, postId);
  }

  if (channelId === 'channel_discord') {
    return resolveDiscordUrl(accountRef, postId);
  }

  return null;
}

function resolveTelegramUrl(accountRef: string, messageId: string): string | null {
  if (!accountRef) {
    return null;
  }

  if (accountRef.startsWith('https://t.me/')) {
    return `${accountRef.replace(/\/$/, '')}/${encodeURIComponent(messageId)}`;
  }

  if (accountRef.startsWith('@')) {
    return `https://t.me/${encodeURIComponent(accountRef.slice(1))}/${encodeURIComponent(messageId)}`;
  }

  if (/^-100\d+$/.test(accountRef)) {
    return `https://t.me/c/${encodeURIComponent(accountRef.slice(4))}/${encodeURIComponent(messageId)}`;
  }

  if (/^[a-zA-Z][a-zA-Z0-9_]{4,}$/.test(accountRef)) {
    return `https://t.me/${encodeURIComponent(accountRef)}/${encodeURIComponent(messageId)}`;
  }

  return null;
}

function resolveDiscordUrl(accountRef: string, messageId: string): string | null {
  const [guildId, channelId] = accountRef.split('/');

  if (!guildId || !channelId) {
    return null;
  }

  return `https://discord.com/channels/${encodeURIComponent(guildId)}/${encodeURIComponent(channelId)}/${encodeURIComponent(messageId)}`;
}
