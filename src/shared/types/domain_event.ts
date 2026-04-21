export interface DomainEvent<TData = unknown> {
  readonly eventName: string;
  readonly occurredOn: Date;
  readonly aggregateId: string;
  readonly version: number;
  readonly data: TData;
}
