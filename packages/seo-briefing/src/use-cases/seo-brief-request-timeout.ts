import type { SeoBriefArtifact } from '../domain/seo-brief-artifact.entity.js';

export const DEFAULT_SEO_BRIEF_REQUEST_TIMEOUT_MS = 300_000;
export const MIN_SEO_BRIEF_REQUEST_TIMEOUT_MS = 30_000;
export const MAX_SEO_BRIEF_REQUEST_TIMEOUT_MS = 900_000;

export function normalizeSeoBriefRequestTimeoutMs(value: unknown): number {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number.parseInt(value, 10)
        : Number.NaN;

  if (!Number.isFinite(parsed)) {
    return DEFAULT_SEO_BRIEF_REQUEST_TIMEOUT_MS;
  }

  return Math.min(
    MAX_SEO_BRIEF_REQUEST_TIMEOUT_MS,
    Math.max(MIN_SEO_BRIEF_REQUEST_TIMEOUT_MS, Math.trunc(parsed)),
  );
}

export function readRequestTimeoutMsFromArtifacts(
  artifacts: SeoBriefArtifact[],
): number {
  const artifact = [...artifacts]
    .reverse()
    .find((item) => item.artifactType === 'normalized_input');

  const payload =
    artifact?.payload && typeof artifact.payload === 'object' && !Array.isArray(artifact.payload)
      ? (artifact.payload as Record<string, unknown>)
      : null;

  return normalizeSeoBriefRequestTimeoutMs(payload?.requestTimeoutMs);
}
