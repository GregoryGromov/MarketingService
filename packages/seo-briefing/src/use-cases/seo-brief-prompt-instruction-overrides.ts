import type { SeoBriefArtifact } from '../domain/seo-brief-artifact.entity.js';
import type { SeoBriefPromptInstructionOverrides } from '../ports/seo-brief-ai.port.js';

export function readPromptInstructionOverridesFromArtifacts(
  artifacts: SeoBriefArtifact[],
): SeoBriefPromptInstructionOverrides | null {
  const artifact = [...artifacts]
    .reverse()
    .find((item) => item.artifactType === 'normalized_input');
  const payload = artifact?.payload;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return null;
  }

  const value = (payload as Record<string, unknown>).promptInstructionOverrides;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const overrides = Object.fromEntries(
    Object.entries(value)
      .map(([key, item]) => [key.trim(), typeof item === 'string' ? item.trim() : ''] as const)
      .filter(([key, item]) => key.length > 0 && item.length > 0),
  );

  return Object.keys(overrides).length > 0 ? overrides : null;
}
