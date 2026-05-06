import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, notInArray } from 'drizzle-orm';
import {
  channelAdaptationVersions,
  type ChannelAdaptationVersionRow,
  type NewChannelAdaptationVersionRow,
} from '@marketing-service/database';
import {
  AdaptationVersion,
  AdaptationVersionRepository,
  type AdaptationId,
  type AdaptationVersionId,
  type AdaptationVersionKind,
  type AdaptationVersionProps,
} from '@marketing-service/editorial';
import { DRIZZLE, type DrizzleDB } from '../database.module.js';

@Injectable()
export class AdaptationVersionDrizzleRepository extends AdaptationVersionRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {
    super();
  }

  async findById(id: AdaptationVersionId): Promise<AdaptationVersion | null> {
    const row = await this.db.query.channelAdaptationVersions.findFirst({
      where: eq(channelAdaptationVersions.id, id),
    });

    return row ? AdaptationVersion.rehydrate(this.toDomainProps(row)) : null;
  }

  async findByAdaptationId(adaptationId: AdaptationId): Promise<AdaptationVersion[]> {
    const rows = await this.db.query.channelAdaptationVersions.findMany({
      where: eq(channelAdaptationVersions.adaptationId, adaptationId),
      orderBy: [asc(channelAdaptationVersions.createdAt)],
    });

    return rows.map((row) => AdaptationVersion.rehydrate(this.toDomainProps(row)));
  }

  async save(version: AdaptationVersion): Promise<void> {
    await this.db
      .insert(channelAdaptationVersions)
      .values(this.toRow(version))
      .onConflictDoUpdate({
        target: channelAdaptationVersions.id,
        set: this.toRow(version),
      });
  }

  async deleteByAdaptationIdExcept(
    adaptationId: AdaptationId,
    keepIds: AdaptationVersionId[],
  ): Promise<void> {
    if (keepIds.length === 0) {
      await this.db
        .delete(channelAdaptationVersions)
        .where(eq(channelAdaptationVersions.adaptationId, adaptationId));
      return;
    }

    await this.db
      .delete(channelAdaptationVersions)
      .where(
        and(
          eq(channelAdaptationVersions.adaptationId, adaptationId),
          notInArray(channelAdaptationVersions.id, keepIds),
        ),
      );
  }

  private toDomainProps(row: ChannelAdaptationVersionRow): AdaptationVersionProps {
    return {
      id: row.id as AdaptationVersionId,
      adaptationId: row.adaptationId as AdaptationId,
      content: row.content,
      kind: row.kind as AdaptationVersionKind,
      sourceVersionId: row.sourceVersionId as AdaptationVersionProps['sourceVersionId'],
      meta: (row.meta as Record<string, unknown> | null) ?? null,
      createdAt: row.createdAt,
    };
  }

  private toRow(version: AdaptationVersion): NewChannelAdaptationVersionRow {
    return {
      id: version.id,
      adaptationId: version.adaptationId,
      content: version.content,
      kind: version.kind,
      sourceVersionId: version.sourceVersionId,
      meta: version.meta,
      createdAt: version.createdAt,
    };
  }
}
