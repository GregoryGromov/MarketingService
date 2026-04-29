import { generateId, type TypedId } from './id.js';

// Base domain event interface
//
// Domain events capture something meaningful that already happened inside
// the domain model, for example: ArticleCreated or AdaptationApproved.

export interface DomainEvent {
  readonly eventId: TypedId<'event'>;
  readonly eventName: string;
  readonly occurredAt: Date;
  readonly aggregateId: string;
}

export type DomainEventProps = Pick<DomainEvent, 'eventName' | 'aggregateId'>;

export function createDomainEvent<TEvent extends DomainEventProps>(
  props: TEvent,
): DomainEvent & TEvent {
  return {
    eventId: generateId('event'),
    occurredAt: new Date(),
    ...props,
  };
}
