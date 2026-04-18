import { describe, it, expect } from 'vitest';
import { AggregateRoot, DomainEvent } from './index';

class TestAggregateCreated implements DomainEvent {
  readonly eventName = 'TestAggregateCreated';
  readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly name: string
  ) {
    this.occurredOn = new Date();
  }
}

class TestAggregate extends AggregateRoot<string> {
  constructor(id: string) {
    super(id);
  }

  create(name: string): void {
    this.addDomainEvent(new TestAggregateCreated(this.id, name));
  }
}

describe('AggregateRoot', () => {
  it('should return the aggregate id', () => {
    const aggregate = new TestAggregate('test-id-123');
    expect(aggregate.getId()).toBe('test-id-123');
  });

  it('should add domain events', () => {
    const aggregate = new TestAggregate('test-id-123');
    aggregate.create('Test Name');

    const events = aggregate.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0].eventName).toBe('TestAggregateCreated');
  });

  it('should clear domain events after pulling', () => {
    const aggregate = new TestAggregate('test-id-123');
    aggregate.create('Test Name');

    aggregate.pullDomainEvents();
    const events = aggregate.pullDomainEvents();
    expect(events).toHaveLength(0);
  });

  it('should handle multiple domain events', () => {
    const aggregate = new TestAggregate('test-id-123');
    aggregate.create('First');
    aggregate.create('Second');

    const events = aggregate.pullDomainEvents();
    expect(events).toHaveLength(2);
  });
});
