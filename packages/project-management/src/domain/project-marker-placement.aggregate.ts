import {
  AggregateRoot,
  createDomainEvent,
  generateId,
  type TypedId,
} from '@marketing-service/shared';
import type { ProjectId } from './project.aggregate.js';
import type { ProjectMarkerId } from './project-marker.aggregate.js';

export type ProjectMarkerPlacementId = TypedId<'project_marker_placement'>;

export interface CreateProjectMarkerPlacementParams {
  markerId: ProjectMarkerId;
  projectId: ProjectId;
  channelId: string;
  targetLanguage: string;
  publishAt: Date;
}

export interface ProjectMarkerPlacementProps {
  id: ProjectMarkerPlacementId;
  markerId: ProjectMarkerId;
  projectId: ProjectId;
  channelId: string;
  targetLanguage: string;
  publishAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class ProjectMarkerPlacement extends AggregateRoot {
  private constructor(
    public readonly id: ProjectMarkerPlacementId,
    public readonly markerId: ProjectMarkerId,
    public readonly projectId: ProjectId,
    public readonly channelId: string,
    public readonly targetLanguage: string,
    public readonly publishAt: Date,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {
    super();
  }

  static create(params: CreateProjectMarkerPlacementParams): ProjectMarkerPlacement {
    const now = new Date();
    const placement = new ProjectMarkerPlacement(
      generateId('project_marker_placement'),
      params.markerId,
      params.projectId,
      params.channelId,
      params.targetLanguage.trim().toLowerCase(),
      params.publishAt,
      now,
      now,
    );

    placement.addEvent(
      createDomainEvent({
        eventName: 'ProjectMarkerPlacementCreated',
        aggregateId: placement.id,
      }),
    );

    return placement;
  }

  static rehydrate(props: ProjectMarkerPlacementProps): ProjectMarkerPlacement {
    return new ProjectMarkerPlacement(
      props.id,
      props.markerId,
      props.projectId,
      props.channelId,
      props.targetLanguage,
      props.publishAt,
      props.createdAt,
      props.updatedAt,
    );
  }
}
