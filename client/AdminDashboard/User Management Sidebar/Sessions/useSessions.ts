import { useState, useEffect, useCallback } from 'react';
import { sessionAPI } from '../../../services';
import { Session } from './types';

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await sessionAPI.getAll({ per_page: 100 });
      setSessions(Array.isArray(response.data?.data) ? response.data.data : []);
      setError('');
    } catch (err) {
      setError('Failed to load sessions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleTerminateSession = async (tokenId: string) => {
    if (!window.confirm('Are you sure you want to terminate this session?')) return;

    try {
      await sessionAPI.terminate(tokenId);
      await fetchSessions();
    } catch {
      setError('Failed to terminate session');
    }
  };

  return {
    sessions,
    loading,
    error,
    fetchSessions,
    handleTerminateSession,
  };
}
