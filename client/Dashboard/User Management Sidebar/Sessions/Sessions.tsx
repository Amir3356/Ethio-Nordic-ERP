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

  const isPermissionError = error.includes('permission');

  return (
    <section className="content-section" id="sessions">
      <div className="content-section-header content-section-header-center">
        <h2>Session Monitoring & Management</h2>
      </div>

      {error && (
        <div className="content-error">
          <p>{error}</p>
          {!isPermissionError && <button onClick={fetchSessions}>Retry</button>}
        </div>
      )}

      {!isPermissionError && loading && sessions.length === 0 && <p className="content-loading">Loading sessions...</p>}

      {!isPermissionError && (
        <SessionTable
          sessions={sessions}
          onTerminate={handleTerminateSession}
        />
      )}
    </section>
  );
}
