import { useState, useEffect, useCallback, useRef } from 'react';
import { sessionAPI } from '../../../services';
import { getBrowserLocation, updateSessionLocation } from '../../../services/geolocation';
import { Session } from './types';

const POLL_INTERVAL_MS = 30000; // 30 seconds for real-time updates

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationUpdatedRef = useRef<Set<string>>(new Set());

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

  // Get browser location and update current session
  const updateLocationForSessions = useCallback(async (sessionList: Session[]) => {
    const currentSession = sessionList.find(s => s.is_current);
    if (!currentSession || locationUpdatedRef.current.has(currentSession.id)) {
      return;
    }

    // Check if location is missing or is "Local Network" or "Local"
    const needsUpdate = !currentSession.location ||
      currentSession.location === 'Local Network' ||
      currentSession.location === 'Local';

    if (!needsUpdate) {
      locationUpdatedRef.current.add(currentSession.id);
      return;
    }

    const browserLocation = await getBrowserLocation();
    if (browserLocation) {
      locationUpdatedRef.current.add(currentSession.id);
      await updateSessionLocation(currentSession.id, browserLocation);
      // Refresh sessions to show updated location
      await fetchSessions();
    }
  }, [fetchSessions]);

  // Initial fetch
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Update location when sessions are loaded
  useEffect(() => {
    if (sessions.length > 0) {
      updateLocationForSessions(sessions);
    }
  }, [sessions, updateLocationForSessions]);

  // Real-time polling: refresh sessions every 30 seconds
  useEffect(() => {
    pollRef.current = setInterval(() => {
      fetchSessions();
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
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
