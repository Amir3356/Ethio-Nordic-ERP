import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionAPI } from '../../../services';
import { getBrowserLocation, updateSessionLocation } from '../../../services/geolocation';
import { Session } from './types';

const POLL_INTERVAL_MS = 30000; // 30 seconds for real-time updates
const LOCATION_RETRY_MAX = 3; // Max retries for location update

export function useSessions() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasPermission, setHasPermission] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationUpdatedRef = useRef<Set<string>>(new Set());
  const locationRetryCountRef = useRef<Map<string, number>>(new Map());

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await sessionAPI.getAll({ per_page: 100 });
      const payload = response.data?.data;
      setSessions(Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : []);
      setError('');
      setHasPermission(true);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } };
      if (axiosErr.response?.status === 403) {
        setError('You do not have permission to view sessions.');
        setHasPermission(false);
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } else {
        setError('Failed to load sessions');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get browser location and update current session
  const updateLocationForSessions = useCallback(async (sessionList: Session[]) => {
    const currentSession = sessionList.find(s => s.is_current);
    if (!currentSession) {
      return;
    }

    // Skip if already updated successfully
    if (locationUpdatedRef.current.has(currentSession.id)) {
      return;
    }

    // Check if location needs update (null, empty, or legacy placeholder values)
    const needsUpdate = !currentSession.location ||
      currentSession.location === 'Local Network' ||
      currentSession.location === 'Local';

    if (!needsUpdate) {
      locationUpdatedRef.current.add(currentSession.id);
      return;
    }

    // Check retry limit
    const retryCount = locationRetryCountRef.current.get(currentSession.id) || 0;
    if (retryCount >= LOCATION_RETRY_MAX) {
      // After max retries, mark as done to stop retrying
      locationUpdatedRef.current.add(currentSession.id);
      return;
    }

    const browserLocation = await getBrowserLocation();
    if (browserLocation) {
      locationUpdatedRef.current.add(currentSession.id);
      await updateSessionLocation(currentSession.id, browserLocation);
      // Refresh sessions to show updated location
      await fetchSessions();
    } else {
      // Increment retry count for next poll
      locationRetryCountRef.current.set(currentSession.id, retryCount + 1);
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
    const isCurrentSession = sessions.find(s => s.id === tokenId)?.is_current;

    if (isCurrentSession) {
      if (!window.confirm('Are you sure you want to terminate your current session? You will be logged out.')) return;
    } else {
      if (!window.confirm('Are you sure you want to terminate this session?')) return;
    }

    try {
      await sessionAPI.terminate(tokenId);

      if (isCurrentSession) {
        // Clear auth data and redirect to login
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        navigate('/login', { replace: true });
      } else {
        await fetchSessions();
      }
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
