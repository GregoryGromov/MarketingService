import { generateId, type TypedId } from '@marketing-service/shared';
import type { SeoBriefRunId } from './seo-brief-run.aggregate.js';
import type { SeoBriefJsonValue } from './seo-briefing.types.js';

export type SeoBriefDocumentId = TypedId<'seo_brief_document'>;

export interface CreateSeoBriefDocumentParams {
  runId: SeoBriefRunId;
  selectedClusterPayload: SeoBriefJsonValue;
  briefPayload: SeoBriefJsonValue;
  rejectedClustersPayload?: SeoBriefJsonValue | null;
}

export interface SeoBriefDocumentProps {
  id: SeoBriefDocumentId;
  runId: SeoBriefRunId;
  selectedClusterPayload: SeoBriefJsonValue;
  briefPayload: SeoBriefJsonValue;
  rejectedClustersPayload: SeoBriefJsonValue | null;
  createdAt: Date;
  updatedAt: Date;
}

export class SeoBriefDocument {
  private constructor(
    public readonly id: SeoBriefDocumentId,
    public readonly runId: SeoBriefRunId,
    public readonly selectedClusterPayload: SeoBriefJsonValue,
    public readonly briefPayload: SeoBriefJsonValue,
    public readonly rejectedClustersPayload: SeoBriefJsonValue | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  static create(params: CreateSeoBriefDocumentParams): SeoBriefDocument {
    const now = new Date();
    return new SeoBriefDocument(
      generateId('seo_brief_document'),
      params.runId,
      params.selectedClusterPayload,
      params.briefPayload,
      params.rejectedClustersPayload ?? null,
      now,
      now,
    );
  }

  static rehydrate(props: SeoBriefDocumentProps): SeoBriefDocument {
    return new SeoBriefDocument(
      props.id,
      props.runId,
      props.selectedClusterPayload,
      props.briefPayload,
      props.rejectedClustersPayload,
      props.createdAt,
      props.updatedAt,
    );
  }
}
