import { useCallback, useEffect, useState } from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/auth.store';
import { listSessionsFn, revokeSessionFn, type Session } from '@/api/auth.functions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  return new Date(dateStr).toLocaleString();
}

function getDeviceLabel(deviceInfo: string | null): string {
  return deviceInfo || 'Unknown device';
}

export function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await listSessionsFn();
      setSessions(result.sessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleRevoke = useCallback(async (sessionId: string, isCurrent: boolean) => {
    try {
      setRevokingId(sessionId);
      await revokeSessionFn(sessionId);

      if (isCurrent) {
        useAuthStore.getState().clearAuth();
        navigate({ to: '/login', replace: true });
        return;
      }

      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke session');
    } finally {
      setRevokingId(null);
    }
  }, [navigate]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Active Sessions</h2>
        <Link to="/home" className="text-sm text-gray-600 hover:text-gray-900">
          Back to Dashboard
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-600">Loading sessions...</p>
      ) : sessions.length === 0 ? (
        <p className="text-gray-600">No active sessions found.</p>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <Card key={session.id} className={session.isCurrent ? 'border-blue-300' : ''}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">
                      {getDeviceLabel(session.deviceInfo)}
                      {session.isCurrent && (
                        <span className="ml-2 text-xs font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      Created: {formatDate(session.createdAt)}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRevoke(session.id, session.isCurrent)}
                    disabled={revokingId === session.id}
                  >
                    {revokingId === session.id ? 'Revoking...' : 'Logout'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Last used:</span>{' '}
                    <span className="text-gray-900">{formatDate(session.lastUsedAt)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Expires:</span>{' '}
                    <span className="text-gray-900">{formatDate(session.expiresAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default SessionsPage;
