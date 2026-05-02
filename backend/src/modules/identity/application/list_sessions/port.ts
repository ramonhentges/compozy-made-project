import { ListSessionsQuery, ListSessionsResult } from './query';

export interface IListSessionsUseCase {
  execute(query: ListSessionsQuery): Promise<ListSessionsResult>;
}
