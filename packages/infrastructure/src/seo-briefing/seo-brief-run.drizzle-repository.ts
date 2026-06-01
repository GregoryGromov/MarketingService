import {
  type NewSeoBriefRunRow,
  type SeoBriefRunRow,
  seoBriefRuns,
} from '@marketing-service/database';
import {
  type SeoBriefBrandMemorySnapshot,
  SeoBriefRun,
  type SeoBriefRunId,
  type SeoBriefRunListFilters,
  type SeoBriefRunProps,
  SeoBriefRunRepository,
} from '@marketing-service/seo-briefing';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq } from 'drizzle-orm';
import { DRIZZLE, type DrizzleExecutor } from '../database.module.js';

@Injectable()
export class SeoBriefRunDrizzleRepository extends SeoBriefRunRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleExecutor) {
    super();
  }

  async findById(id: SeoBriefRunId): Promise<SeoBriefRun | null> {
    const row = await this.db.query.seoBriefRuns.findFirst({
      where: eq(seoBriefRuns.id, id),
    });

    return row ? SeoBriefRun.rehydrate(this.toDomainProps(row)) : null;
  }

  async findByProjectId(projectId: string): Promise<SeoBriefRun[]> {
    return this.findMany({ projectId });
  }

  async findMany(filters?: SeoBriefRunListFilters): Promise<SeoBriefRun[]> {
    const whereClauses = [
      filters?.projectId ? eq(seoBriefRuns.projectId, filters.projectId) : null,
      filters?.status ? eq(seoBriefRuns.status, filters.status) : null,
    ].filter((clause): clause is NonNullable<typeof clause> => clause != null);
    const rows = await this.db.query.seoBriefRuns.findMany({
      where: whereClauses.length > 0 ? and(...whereClauses) : undefined,
      orderBy: [desc(seoBriefRuns.updatedAt), asc(seoBriefRuns.createdAt)],
      limit: normalizeLimit(filters?.limit),
    });

    return rows.map((row) => SeoBriefRun.rehydrate(this.toDomainProps(row)));
  }

  async save(run: SeoBriefRun): Promise<void> {
    await this.db
      .insert(seoBriefRuns)
      .values(this.toRow(run))
      .onConflictDoUpdate({
        target: seoBriefRuns.id,
        set: this.toRow(run),
      });
  }

  private toDomainProps(row: SeoBriefRunRow): SeoBriefRunProps {
    return {
      id: row.id as SeoBriefRunId,
      projectId: row.projectId,
      topicSeed: row.topicSeed,
      country: row.country,
      language: row.language,
      audience: row.audience,
      productName: row.productName,
      productDescription: row.productDescription,
      brandMemorySnapshot: row.brandMemorySnapshot as SeoBriefBrandMemorySnapshot,
      keyMessage: row.keyMessage,
      audienceBefore: row.audienceBefore,
      audienceAfter: row.audienceAfter,
      cta: row.cta,
      seoWeight: row.seoWeight,
      productWeight: row.productWeight,
      status: row.status as SeoBriefRunProps['status'],
      failureReason: row.failureReason,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toRow(run: SeoBriefRun): NewSeoBriefRunRow {
    return {
      id: run.id,
      projectId: run.projectId,
      topicSeed: run.topicSeed,
      country: run.country,
      language: run.language,
      audience: run.audience,
      productName: run.productName,
      productDescription: run.productDescription,
      brandMemorySnapshot: run.brandMemorySnapshot,
      keyMessage: run.keyMessage,
      audienceBefore: run.audienceBefore,
      audienceAfter: run.audienceAfter,
      cta: run.cta,
      seoWeight: run.seoWeight,
      productWeight: run.productWeight,
      status: run.status,
      failureReason: run.failureReason,
      createdAt: run.createdAt,
      updatedAt: run.updatedAt,
    };
  }
}

function normalizeLimit(value?: number): number | undefined {
  if (value == null || !Number.isFinite(value)) {
    return undefined;
  }

  if (value <= 0) {
    return undefined;
  }

  return Math.trunc(value);
}
