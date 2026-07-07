import { useState, useEffect, useCallback } from 'react';
import { sessionAPI } from '../../../services';
import { Session, SessionStats } from './types';

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  useEffect(() => {
    fetchSessions();
    fetchStats();
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

  return {
    sessions,
    stats,
    loading,
    error,
    fetchSessions,
    fetchStats,
    handleTerminateSession,
  };
}
