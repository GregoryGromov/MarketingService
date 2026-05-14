import {
  AggregateRoot,
  createDomainEvent,
  generateId,
  type TypedId,
} from '@marketing-service/shared';
import type { ArticleId, ChannelId, ProjectId } from '@marketing-service/editorial';

export type PublicationPlanId = TypedId<'publication_plan'>;
export type PlannedPublicationId = TypedId<'planned_publication'>;

export interface CreatePublicationPlanParams {
  articleId: ArticleId;
  projectId: ProjectId;
  plannedPublicationId?: PlannedPublicationId | null;
  channelId: ChannelId;
  targetLanguage: string;
  publishAt: Date;
}

export interface PublicationPlanProps {
  id: PublicationPlanId;
  articleId: ArticleId;
  projectId: ProjectId;
  plannedPublicationId: PlannedPublicationId | null;
  channelId: ChannelId;
  targetLanguage: string;
  publishAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class PublicationPlan extends AggregateRoot {
  private constructor(
    public readonly id: PublicationPlanId,
    public readonly articleId: ArticleId,
    public readonly projectId: ProjectId,
    public readonly plannedPublicationId: PlannedPublicationId | null,
    public readonly channelId: ChannelId,
    public readonly targetLanguage: string,
    public publishAt: Date,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {
    super();
  }

  static create(params: CreatePublicationPlanParams): PublicationPlan {
    const now = new Date();
    const plan = new PublicationPlan(
      generateId('publication_plan'),
      params.articleId,
      params.projectId,
      params.plannedPublicationId ?? null,
      params.channelId,
      params.targetLanguage.trim().toLowerCase(),
      params.publishAt,
      now,
      now,
    );

    plan.addEvent(
      createDomainEvent({
        eventName: 'PublicationPlanCreated',
        aggregateId: plan.id,
      }),
    );

    return plan;
  }

  static rehydrate(props: PublicationPlanProps): PublicationPlan {
    return new PublicationPlan(
      props.id,
      props.articleId,
      props.projectId,
      props.plannedPublicationId,
      props.channelId,
      props.targetLanguage,
      props.publishAt,
      props.createdAt,
      props.updatedAt,
    );
  }

  reschedule(publishAt: Date): void {
    this.publishAt = publishAt;
    this.updatedAt = new Date();
  }
}
