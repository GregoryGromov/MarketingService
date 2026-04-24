// Base aggregate root with domain event tracking
//
// Aggregates collect domain events via addEvent().
// Repository calls pullEvents() after persist and publishes them via EventBus.
//
// TODO: implement AggregateRoot base class
//   - domainEvents: DomainEvent[]
//   - addEvent(event: DomainEvent): void
//   - pullEvents(): DomainEvent[]

export {};
