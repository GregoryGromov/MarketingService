import {
  type SeoBriefExternalCallLog,
  type SeoBriefExternalCallLogId,
  SeoBriefExternalCallLogRepository,
  type SeoBriefLlmCallLog,
  type SeoBriefLlmCallLogId,
  SeoBriefLlmLogRepository,
  type SeoBriefRunId,
  type SeoBriefScoreLog,
  SeoBriefScoreLogRepository,
} from '../index.js';

class InMemoryStore<T extends { id: string }> {
  readonly records = new Map<string, T>();

  get(id: string): T | null {
    return this.records.get(id) ?? null;
  }

  set(value: T): void {
    this.records.set(value.id, value);
  }

  all(): T[] {
    return [...this.records.values()];
  }
}

export class InMemorySeoBriefLlmLogRepository extends SeoBriefLlmLogRepository {
  private readonly store = new InMemoryStore<SeoBriefLlmCallLog>();

  findById(id: SeoBriefLlmCallLogId): Promise<SeoBriefLlmCallLog | null> {
    return Promise.resolve(this.store.get(id));
  }

  findByRunId(runId: SeoBriefRunId): Promise<SeoBriefLlmCallLog[]> {
    return Promise.resolve(this.store.all().filter((item) => item.runId === runId));
  }

  save(log: SeoBriefLlmCallLog): Promise<void> {
    this.store.set(log);
    return Promise.resolve();
  }
}

export class InMemorySeoBriefExternalCallLogRepository extends SeoBriefExternalCallLogRepository {
  private readonly store = new InMemoryStore<SeoBriefExternalCallLog>();

  findById(id: SeoBriefExternalCallLogId): Promise<SeoBriefExternalCallLog | null> {
    return Promise.resolve(this.store.get(id));
  }

  findByRunId(runId: SeoBriefRunId): Promise<SeoBriefExternalCallLog[]> {
    return Promise.resolve(this.store.all().filter((item) => item.runId === runId));
  }

  save(log: SeoBriefExternalCallLog): Promise<void> {
    this.store.set(log);
    return Promise.resolve();
  }
}

export class InMemorySeoBriefScoreLogRepository extends SeoBriefScoreLogRepository {
  private readonly store = new InMemoryStore<SeoBriefScoreLog>();

  findByRunId(runId: SeoBriefRunId): Promise<SeoBriefScoreLog[]> {
    return Promise.resolve(this.store.all().filter((item) => item.runId === runId));
  }

  save(log: SeoBriefScoreLog): Promise<void> {
    this.store.set(log);
    return Promise.resolve();
  }
}
