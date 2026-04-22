import { DomainEvent } from './domain_event';

export abstract class AggregateRoot<T> {
  private domainEvents: DomainEvent[] = [];

  protected addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  public pullDomainEvents(): DomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents = [];
    return events;
  }

  public getId(): T {
    return this.id;
  }

  protected constructor(protected readonly id: T) {}
}
