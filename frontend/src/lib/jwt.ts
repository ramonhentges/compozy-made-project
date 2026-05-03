const TOKEN_EXPIRY_BUFFER_MS = 30 * 1000; // 30 seconds

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getTokenExpiry(token: string): number | null {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return null;
  return payload.exp * 1000; // Convert to milliseconds
}

export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  const expiry = getTokenExpiry(token);
  if (!expiry) return true;
  return Date.now() >= expiry - TOKEN_EXPIRY_BUFFER_MS;
}
