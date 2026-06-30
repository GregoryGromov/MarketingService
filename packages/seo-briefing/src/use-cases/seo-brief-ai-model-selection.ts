import type { SeoBriefArtifact } from '../domain/seo-brief-artifact.entity.js';
import type { SeoBriefAiModelMode } from '../ports/seo-brief-ai.port.js';

export function readSeoBriefAiModelMode(artifacts: SeoBriefArtifact[]): SeoBriefAiModelMode | null {
  const mode = readString(readNormalizedInput(artifacts)?.aiModelMode);
  return mode === 'flash' || mode === 'pro' || mode === 'pro_thinking' ? mode : null;
}

export function readSeoBriefAiModel(artifacts: SeoBriefArtifact[]): string | null {
  return readString(readNormalizedInput(artifacts)?.aiModel);
}

function readNormalizedInput(artifacts: SeoBriefArtifact[]): Record<string, unknown> | null {
  const artifact = [...artifacts]
    .reverse()
    .find((item) => item.artifactType === 'normalized_input');
  return artifact?.payload &&
    typeof artifact.payload === 'object' &&
    !Array.isArray(artifact.payload)
    ? (artifact.payload as Record<string, unknown>)
    : null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
