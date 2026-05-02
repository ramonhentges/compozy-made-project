export interface ListSessionsQuery {
  userId: string;
  currentTokenHash?: string;
}

export interface SessionDto {
  id: string;
  deviceInfo: string | null;
  createdAt: Date;
  lastUsedAt: Date | null;
  expiresAt: Date;
  isCurrent: boolean;
}

export interface ListSessionsResult {
  sessions: SessionDto[];
}
