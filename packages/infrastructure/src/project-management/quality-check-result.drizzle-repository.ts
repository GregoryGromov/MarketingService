import { Inject, Injectable } from '@nestjs/common';
import { asc, desc, eq } from 'drizzle-orm';
import {
  qualityCheckResults,
  type NewQualityCheckResultRow,
  type QualityCheckResultRow,
} from '@marketing-service/database';
import {
  QualityCheckResult,
  QualityCheckResultRepository,
  type CampaignArtifactType,
  type CampaignId,
  type QualityCheckResultId,
  type QualityCheckResultProps,
} from '@marketing-service/project-management';
import { DRIZZLE, type DrizzleExecutor } from '../database.module.js';

@Injectable()
export class QualityCheckResultDrizzleRepository extends QualityCheckResultRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleExecutor) {
    super();
  }

  async findById(id: QualityCheckResultId): Promise<QualityCheckResult | null> {
    const row = await this.db.query.qualityCheckResults.findFirst({
      where: eq(qualityCheckResults.id, id),
    });

    return row ? QualityCheckResult.rehydrate(this.toDomainProps(row)) : null;
  }

  async findByCampaignId(campaignId: CampaignId): Promise<QualityCheckResult[]> {
    const rows = await this.db.query.qualityCheckResults.findMany({
      where: eq(qualityCheckResults.campaignId, campaignId),
      orderBy: [desc(qualityCheckResults.createdAt)],
    });

    return rows.map((row) => QualityCheckResult.rehydrate(this.toDomainProps(row)));
  }

  async findByArtifact(
    artifactType: CampaignArtifactType,
    artifactId: string,
  ): Promise<QualityCheckResult[]> {
    const rows = await this.db.query.qualityCheckResults.findMany({
      where: eq(qualityCheckResults.artifactType, artifactType),
      orderBy: [asc(qualityCheckResults.createdAt)],
    });

    return rows
      .filter((row) => row.artifactId === artifactId)
      .map((row) => QualityCheckResult.rehydrate(this.toDomainProps(row)));
  }

  async save(result: QualityCheckResult): Promise<void> {
    await this.db
      .insert(qualityCheckResults)
      .values(this.toRow(result))
      .onConflictDoUpdate({
        target: qualityCheckResults.id,
        set: this.toRow(result),
      });
  }

  private toDomainProps(row: QualityCheckResultRow): QualityCheckResultProps {
    return {
      id: row.id as QualityCheckResultId,
      campaignId: row.campaignId as CampaignId,
      plannedPublicationId: row.plannedPublicationId as QualityCheckResultProps['plannedPublicationId'],
      artifactType: row.artifactType as CampaignArtifactType,
      artifactId: row.artifactId,
      artifactVersionId: row.artifactVersionId,
      checkType: row.checkType as QualityCheckResultProps['checkType'],
      result: row.result as QualityCheckResultProps['result'],
      attemptNumber: row.attemptNumber,
      reasons: row.reasons as QualityCheckResultProps['reasons'],
      suggestedFix: row.suggestedFix as QualityCheckResultProps['suggestedFix'],
      rawAiResult: row.rawAiResult as QualityCheckResultProps['rawAiResult'],
      createdAt: row.createdAt,
    };
  }

  private toRow(result: QualityCheckResult): NewQualityCheckResultRow {
    return {
      id: result.id,
      campaignId: result.campaignId,
      plannedPublicationId: result.plannedPublicationId,
      artifactType: result.artifactType,
      artifactId: result.artifactId,
      artifactVersionId: result.artifactVersionId,
      checkType: result.checkType,
      result: result.result,
      attemptNumber: result.attemptNumber,
      reasons: result.reasons,
      suggestedFix: result.suggestedFix,
      rawAiResult: result.rawAiResult,
      createdAt: result.createdAt,
    };
  }
}
