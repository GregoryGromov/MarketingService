import {
  AggregateRoot,
  createDomainEvent,
  generateId,
  type TypedId,
} from '@marketing-service/shared';
import type { ProjectId } from './project.aggregate.js';

export type ProjectMarkerId = TypedId<'project_marker'>;

export interface CreateProjectMarkerParams {
  projectId: ProjectId;
  title: string;
  notes?: string | null;
  colorBg: string;
  colorBorder: string;
  colorText: string;
}

export interface ProjectMarkerProps {
  id: ProjectMarkerId;
  projectId: ProjectId;
  title: string;
  notes: string | null;
  colorBg: string;
  colorBorder: string;
  colorText: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ProjectMarker extends AggregateRoot {
  private constructor(
    public readonly id: ProjectMarkerId,
    public readonly projectId: ProjectId,
    public title: string,
    public notes: string | null,
    public readonly colorBg: string,
    public readonly colorBorder: string,
    public readonly colorText: string,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {
    super();
  }

  static create(params: CreateProjectMarkerParams): ProjectMarker {
    const now = new Date();
    const marker = new ProjectMarker(
      generateId('project_marker'),
      params.projectId,
      params.title.trim(),
      params.notes?.trim() || null,
      params.colorBg,
      params.colorBorder,
      params.colorText,
      now,
      now,
    );

    marker.addEvent(
      createDomainEvent({
        eventName: 'ProjectMarkerCreated',
        aggregateId: marker.id,
      }),
    );

    return marker;
  }

  static rehydrate(props: ProjectMarkerProps): ProjectMarker {
    return new ProjectMarker(
      props.id,
      props.projectId,
      props.title,
      props.notes,
      props.colorBg,
      props.colorBorder,
      props.colorText,
      props.createdAt,
      props.updatedAt,
    );
  }
}
