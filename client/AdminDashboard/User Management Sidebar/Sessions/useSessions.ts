import { useState, useEffect, useCallback, useRef } from 'react';
import { sessionAPI } from '../../../services';
import { Session, SessionStats } from './types';

const POLL_INTERVAL_MS = 30000; // 30 seconds for real-time updates

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await sessionAPI.getAll({ per_page: 100 });
      const payload = response.data?.data;
      setSessions(Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : []);
      setError('');
    } catch (err) {
      setError('Failed to load sessions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await sessionAPI.getStats();
      setStats(response.data?.data ?? null);
    } catch (err) {
      console.error('Failed to load session stats', err);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchSessions();
    fetchStats();
  }, [fetchSessions, fetchStats]);

  // Real-time polling: refresh sessions every 30 seconds
  useEffect(() => {
    pollRef.current = setInterval(() => {
      fetchSessions();
      fetchStats();
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [fetchSessions, fetchStats]);

  const handleTerminateSession = async (tokenId: string) => {
    if (!window.confirm('Are you sure you want to terminate this session?')) return;

    try {
      await sessionAPI.terminate(tokenId);
      await fetchSessions();
      await fetchStats();
    } catch {
      setError('Failed to terminate session');
    }
  };

  const handleTerminateAllForUser = async (userId: number) => {
    if (!window.confirm('Are you sure you want to terminate ALL sessions for this user? This will force them to log in again on all devices.')) return;

    try {
      await sessionAPI.terminateAllUserSessions(userId);
      await fetchSessions();
      await fetchStats();
    } catch {
      setError('Failed to terminate user sessions');
    }
  };

  return {
    sessions,
    stats,
    loading,
    error,
    fetchSessions,
    fetchStats,
    handleTerminateSession,
    handleTerminateAllForUser,
  };
}
