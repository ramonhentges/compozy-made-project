export interface RevokeSessionCommand {
  userId: string;
  sessionId: string;
  currentTokenHash?: string;
}

export interface RevokeSessionResult {
  wasCurrentSession: boolean;
}
