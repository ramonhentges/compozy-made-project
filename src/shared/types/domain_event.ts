export interface DomainEvent<TData = Record<string, unknown>> {
  readonly eventName: string;
  readonly occurredOn: Date;
  readonly aggregateId: string;
  readonly version: number;
  readonly data: TData;
}
