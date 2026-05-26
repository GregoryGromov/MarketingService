import { Inject, Injectable } from '@nestjs/common';
import { asc, desc, eq } from 'drizzle-orm';
import { campaigns, type CampaignRow, type NewCampaignRow } from '@marketing-service/database';
import {
  Campaign,
  CampaignRepository,
  type CampaignId,
  type CampaignProps,
  type ProjectId,
} from '@marketing-service/project-management';
import { DRIZZLE, type DrizzleExecutor } from '../database.module.js';

@Injectable()
export class CampaignDrizzleRepository extends CampaignRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleExecutor) {
    super();
  }

  async findById(id: CampaignId): Promise<Campaign | null> {
    const row = await this.db.query.campaigns.findFirst({
      where: eq(campaigns.id, id),
    });

    return row ? Campaign.rehydrate(this.toDomainProps(row)) : null;
  }

  async findByProjectId(projectId: ProjectId): Promise<Campaign[]> {
    const rows = await this.db.query.campaigns.findMany({
      where: eq(campaigns.projectId, projectId),
      orderBy: [desc(campaigns.updatedAt), asc(campaigns.createdAt)],
    });

    return rows.map((row) => Campaign.rehydrate(this.toDomainProps(row)));
  }

  async save(campaign: Campaign): Promise<void> {
    await this.db
      .insert(campaigns)
      .values(this.toRow(campaign))
      .onConflictDoUpdate({
        target: campaigns.id,
        set: this.toRow(campaign),
      });
  }

  private toDomainProps(row: CampaignRow): CampaignProps {
    return {
      id: row.id as CampaignId,
      projectId: row.projectId as ProjectId,
      presetId: row.presetId as CampaignProps['presetId'],
      name: row.name,
      sourceArticleId: row.sourceArticleId,
      startDate: row.startDate,
      sourceLanguage: row.sourceLanguage,
      publishingTarget: (row.publishingTarget ?? 'test') as CampaignProps['publishingTarget'],
      status: row.status as CampaignProps['status'],
      extraInstructions: row.extraInstructions,
      finalApprovedAt: row.finalApprovedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toRow(campaign: Campaign): NewCampaignRow {
    return {
      id: campaign.id,
      projectId: campaign.projectId,
      presetId: campaign.presetId,
      name: campaign.name,
      sourceArticleId: campaign.sourceArticleId,
      startDate: campaign.startDate,
      sourceLanguage: campaign.sourceLanguage,
      publishingTarget: campaign.publishingTarget,
      status: campaign.status,
      extraInstructions: campaign.extraInstructions,
      finalApprovedAt: campaign.finalApprovedAt,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
    };
  }
}
