import {
  BrandMemoryReaderPort,
  type BrandMemoryReadResult,
  type EnqueuedSeoBriefRunJob,
  type SeoBriefArtifact,
  type SeoBriefArtifactId,
  SeoBriefArtifactRepository,
  type SeoBriefDocument,
  SeoBriefDocumentRepository,
  type SeoBriefRun,
  type SeoBriefRunId,
  type SeoBriefRunJobPayload,
  SeoBriefRunJobPort,
  type SeoBriefRunListFilters,
  SeoBriefRunRepository,
  type SeoBriefRunStep,
  SeoBriefRunStepRepository,
} from '../index.js';

export class InMemorySeoBriefRunRepository extends SeoBriefRunRepository {
  readonly records = new Map<string, SeoBriefRun>();

  findById(id: SeoBriefRunId): Promise<SeoBriefRun | null> {
    return Promise.resolve(this.records.get(id) ?? null);
  }

  findByProjectId(projectId: string): Promise<SeoBriefRun[]> {
    return this.findMany({ projectId });
  }

  findMany(filters?: SeoBriefRunListFilters): Promise<SeoBriefRun[]> {
    const filtered = [...this.records.values()]
      .filter((run) => {
        if (filters?.projectId && run.projectId !== filters.projectId) {
          return false;
        }

        if (filters?.status && run.status !== filters.status) {
          return false;
        }

        return true;
      })
      .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime());

    return Promise.resolve(
      filters?.limit && filters.limit > 0 ? filtered.slice(0, filters.limit) : filtered,
    );
  }

  save(run: SeoBriefRun): Promise<void> {
    this.records.set(run.id, run);
    return Promise.resolve();
  }
}

export class InMemorySeoBriefRunStepRepository extends SeoBriefRunStepRepository {
  readonly records = new Map<string, SeoBriefRunStep>();

  findByRunId(runId: SeoBriefRunId): Promise<SeoBriefRunStep[]> {
    return Promise.resolve([...this.records.values()].filter((step) => step.runId === runId));
  }

  save(step: SeoBriefRunStep): Promise<void> {
    this.records.set(step.id, step);
    return Promise.resolve();
  }
}

export class InMemorySeoBriefArtifactRepository extends SeoBriefArtifactRepository {
  readonly records = new Map<string, SeoBriefArtifact>();

  findByRunId(runId: SeoBriefRunId): Promise<SeoBriefArtifact[]> {
    return Promise.resolve(
      [...this.records.values()].filter((artifact) => artifact.runId === runId),
    );
  }

  save(artifact: SeoBriefArtifact): Promise<void> {
    this.records.set(artifact.id as SeoBriefArtifactId, artifact);
    return Promise.resolve();
  }
}

export class InMemorySeoBriefDocumentRepository extends SeoBriefDocumentRepository {
  readonly records = new Map<string, SeoBriefDocument>();

  findLatestByRunId(runId: SeoBriefRunId): Promise<SeoBriefDocument | null> {
    const documents = [...this.records.values()]
      .filter((document) => document.runId === runId)
      .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime());

    return Promise.resolve(documents[0] ?? null);
  }

  save(document: SeoBriefDocument): Promise<void> {
    this.records.set(document.id, document);
    return Promise.resolve();
  }
}

export class InMemoryBrandMemoryReader extends BrandMemoryReaderPort {
  readonly records = new Map<string, BrandMemoryReadResult>();

  seed(value: BrandMemoryReadResult): void {
    this.records.set(value.projectId, value);
  }

  readByProjectId(projectId: string): Promise<BrandMemoryReadResult | null> {
    return Promise.resolve(this.records.get(projectId) ?? null);
  }
}

export class InMemorySeoBriefRunJobPort extends SeoBriefRunJobPort {
  readonly jobs: SeoBriefRunJobPayload[] = [];

  enqueueRun(payload: SeoBriefRunJobPayload): Promise<EnqueuedSeoBriefRunJob> {
    this.jobs.push(payload);

    return Promise.resolve({
      jobId: String(this.jobs.length),
    });
  }
}
