import { useEffect, useState } from 'react';
import { sessionAPI } from '../../../services/api';
import './Sessions.css';

interface Session {
  id: string;
  user?: { name?: string };
  last_used_at: string | null;
  created_at: string;
}

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
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
  };

  const handleTerminateSession = async (tokenId: string) => {
    if (!window.confirm('Are you sure you want to terminate this session?')) return;

    try {
      await sessionAPI.terminate(tokenId);
      await fetchSessions();
    } catch {
      setError('Failed to terminate session');
    }
  };

  return (
    <section className="content-section" id="sessions">
      <div className="content-section-header content-section-header-center">
        <h2>Active Sessions</h2>
      </div>

      {error && (
        <div className="content-error">
          <p>{error}</p>
          <button onClick={fetchSessions}>Retry</button>
        </div>
      )}

      {loading && <p className="content-loading">Loading sessions...</p>}

      <div className="content-table-wrapper">
        <table className="content-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Last Active</th>
              <th>Created At</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length > 0 ? (
              sessions.map((session) => (
                <tr key={session.id}>
                  <td className="content-table-name">{session.user?.name || 'Unknown'}</td>
                  <td>{session.last_used_at ? new Date(session.last_used_at).toLocaleString() : 'Never'}</td>
                  <td>{new Date(session.created_at).toLocaleString()}</td>
                  <td>
                    <span className="content-status status-active">
                      Active
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="content-btn-delete"
                      onClick={() => handleTerminateSession(session.id)}
                    >
                      Terminate
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="content-empty">
                  No active sessions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
