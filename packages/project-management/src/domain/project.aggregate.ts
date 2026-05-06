import {
  AggregateRoot,
  createDomainEvent,
  generateId,
  type TypedId,
} from '@marketing-service/shared';

export type ProjectId = TypedId<'project'>;

export interface CreateProjectParams {
  name: string;
}

export interface ProjectProps {
  id: ProjectId;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Project extends AggregateRoot {
  private constructor(
    public readonly id: ProjectId,
    public name: string,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {
    super();
  }

  static create(params: CreateProjectParams): Project {
    const now = new Date();
    const project = new Project(
      generateId('project'),
      params.name.trim(),
      now,
      now,
    );

    project.addEvent(
      createDomainEvent({
        eventName: 'ProjectCreated',
        aggregateId: project.id,
      }),
    );

    return project;
  }

  static rehydrate(props: ProjectProps): Project {
    return new Project(
      props.id,
      props.name,
      props.createdAt,
      props.updatedAt,
    );
  }

  rename(name: string): void {
    const nextName = name.trim();
    if (!nextName || nextName === this.name) {
      return;
    }

    this.name = nextName;
    this.updatedAt = new Date();

    this.addEvent(
      createDomainEvent({
        eventName: 'ProjectRenamed',
        aggregateId: this.id,
      }),
    );
  }
}
