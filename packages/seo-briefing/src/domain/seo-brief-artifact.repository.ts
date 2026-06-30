import type { SeoBriefArtifact } from './seo-brief-artifact.entity.js';
import type { SeoBriefRunId } from './seo-brief-run.aggregate.js';

export abstract class SeoBriefArtifactRepository {
  abstract findByRunId(runId: SeoBriefRunId): Promise<SeoBriefArtifact[]>;
  abstract save(artifact: SeoBriefArtifact): Promise<void>;
}
