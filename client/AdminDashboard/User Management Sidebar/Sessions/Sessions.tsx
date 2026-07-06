import { useSessions } from './useSessions';
import SessionTable from './SessionTable';
import './Sessions.css';

export default function Sessions() {
  const {
    sessions,
    loading,
    error,
    fetchSessions,
    handleTerminateSession,
  } = useSessions();

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

      <SessionTable
        sessions={sessions}
        onTerminate={handleTerminateSession}
      />
    </section>
  );
}
