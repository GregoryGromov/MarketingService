import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { SeoBriefArtifact } from '../../domain/seo-brief-artifact.entity.js';
import { SeoBriefArtifactRepository } from '../../domain/seo-brief-artifact.repository.js';
import { SeoBriefDocumentRepository } from '../../domain/seo-brief-document.repository.js';
import { SeoBriefRunRepository } from '../../domain/seo-brief-run.repository.js';
import type { SeoBriefJsonObject, SeoBriefJsonValue } from '../../domain/seo-briefing.types.js';
import { SeoBriefRunNotFoundError } from '../../errors/seo-brief-run-not-found.error.js';
import { UpdateFinalSeoBriefCommand } from './update-final-seo-brief.command.js';

export interface UpdateFinalSeoBriefResult {
  artifactType: 'final_brief_snapshot';
  documentId: string;
  runId: string;
  updatedAt: string;
}

@CommandHandler(UpdateFinalSeoBriefCommand)
export class UpdateFinalSeoBriefHandler
  implements ICommandHandler<UpdateFinalSeoBriefCommand, UpdateFinalSeoBriefResult>
{
  constructor(
    @Inject(SeoBriefRunRepository)
    private readonly runRepository: SeoBriefRunRepository,
    @Inject(SeoBriefDocumentRepository)
    private readonly documentRepository: SeoBriefDocumentRepository,
    @Inject(SeoBriefArtifactRepository)
    private readonly artifactRepository: SeoBriefArtifactRepository,
  ) {}

  async execute(command: UpdateFinalSeoBriefCommand): Promise<UpdateFinalSeoBriefResult> {
    const run = await this.runRepository.findById(command.runId as never);
    if (!run) {
      throw new SeoBriefRunNotFoundError(command.runId);
    }

    const document = await this.documentRepository.findLatestByRunId(run.id);
    if (!document) {
      throw new Error('Generate Final Brief before editing it manually');
    }

    const briefPayload = ensureJsonObject(command.briefPayload, 'briefPayload');
    const artifacts = await this.artifactRepository.findByRunId(run.id);
    const editedAt = new Date();

    document.updateBriefPayload(briefPayload);
    await this.documentRepository.save(document);
    await this.artifactRepository.save(
      SeoBriefArtifact.create({
        runId: run.id,
        stage: 'brief_generation',
        artifactType: 'final_brief_snapshot',
        payload: {
          artifactVersion: 'final_seo_brief_manual_edit_v1',
          brief: briefPayload,
          selectedCluster: document.selectedClusterPayload,
          rejectedClusters: document.rejectedClustersPayload,
          manualEdit: {
            editedAt: editedAt.toISOString(),
            sourceDocumentId: document.id,
          },
        },
        attempt: nextAttemptNumber(artifacts, 'final_brief_snapshot'),
      }),
    );

    return {
      runId: run.id,
      artifactType: 'final_brief_snapshot',
      documentId: document.id,
      updatedAt: document.updatedAt.toISOString(),
    };
  }
}

function ensureJsonObject(value: SeoBriefJsonValue, label: string): SeoBriefJsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be a JSON object`);
  }
  return value as SeoBriefJsonObject;
}

function nextAttemptNumber(artifacts: SeoBriefArtifact[], artifactType: string): number {
  return artifacts.filter((artifact) => artifact.artifactType === artifactType).length + 1;
}
