import type { DomainEvent } from './domain-event.js';

// Base aggregate root with domain event tracking
//
// Aggregates collect domain events while business actions are performed.
// Application handlers persist the aggregate, then publish pulled events.

export abstract class AggregateRoot {
  private readonly domainEvents: DomainEvent[] = [];

  protected addEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  pullEvents(): DomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents.length = 0;
    return events;
  }
}
