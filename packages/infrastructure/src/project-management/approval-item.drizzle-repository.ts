import { Inject, Injectable } from '@nestjs/common';
import { asc, desc, eq } from 'drizzle-orm';
import {
  approvalItems,
  type ApprovalItemRow,
  type NewApprovalItemRow,
} from '@marketing-service/database';
import {
  ApprovalItem,
  ApprovalItemRepository,
  type ApprovalItemId,
  type ApprovalItemProps,
  type ApprovalItemStatus,
  type CampaignId,
} from '@marketing-service/project-management';
import { DRIZZLE, type DrizzleExecutor } from '../database.module.js';

@Injectable()
export class ApprovalItemDrizzleRepository extends ApprovalItemRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleExecutor) {
    super();
  }

  async findById(id: ApprovalItemId): Promise<ApprovalItem | null> {
    const row = await this.db.query.approvalItems.findFirst({
      where: eq(approvalItems.id, id),
    });

    return row ? ApprovalItem.rehydrate(this.toDomainProps(row)) : null;
  }

  async findByCampaignId(campaignId: CampaignId): Promise<ApprovalItem[]> {
    const rows = await this.db.query.approvalItems.findMany({
      where: eq(approvalItems.campaignId, campaignId),
      orderBy: [desc(approvalItems.updatedAt), asc(approvalItems.createdAt)],
    });

    return rows.map((row) => ApprovalItem.rehydrate(this.toDomainProps(row)));
  }

  async findByCampaignIdAndStatus(
    campaignId: CampaignId,
    status: ApprovalItemStatus,
  ): Promise<ApprovalItem[]> {
    const rows = await this.db.query.approvalItems.findMany({
      where: eq(approvalItems.campaignId, campaignId),
      orderBy: [desc(approvalItems.updatedAt), asc(approvalItems.createdAt)],
    });

    return rows
      .filter((row) => row.status === status)
      .map((row) => ApprovalItem.rehydrate(this.toDomainProps(row)));
  }

  async save(item: ApprovalItem): Promise<void> {
    await this.db
      .insert(approvalItems)
      .values(this.toRow(item))
      .onConflictDoUpdate({
        target: approvalItems.id,
        set: this.toRow(item),
      });
  }

  private toDomainProps(row: ApprovalItemRow): ApprovalItemProps {
    return {
      id: row.id as ApprovalItemId,
      projectId: row.projectId as ApprovalItemProps['projectId'],
      campaignId: row.campaignId as CampaignId,
      plannedPublicationId: row.plannedPublicationId as ApprovalItemProps['plannedPublicationId'],
      artifactType: row.artifactType as ApprovalItemProps['artifactType'],
      artifactId: row.artifactId,
      type: row.type as ApprovalItemProps['type'],
      status: row.status as ApprovalItemStatus,
      severity: row.severity as ApprovalItemProps['severity'],
      title: row.title,
      details: row.details as ApprovalItemProps['details'],
      suggestedFix: row.suggestedFix as ApprovalItemProps['suggestedFix'],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      resolvedAt: row.resolvedAt,
    };
  }

  private toRow(item: ApprovalItem): NewApprovalItemRow {
    return {
      id: item.id,
      projectId: item.projectId,
      campaignId: item.campaignId,
      plannedPublicationId: item.plannedPublicationId,
      artifactType: item.artifactType,
      artifactId: item.artifactId,
      type: item.type,
      status: item.status,
      severity: item.severity,
      title: item.title,
      details: item.details,
      suggestedFix: item.suggestedFix,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      resolvedAt: item.resolvedAt,
    };
  }
}
