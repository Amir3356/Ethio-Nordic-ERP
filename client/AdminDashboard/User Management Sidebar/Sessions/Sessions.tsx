import { useSessions } from './useSessions';
import SessionTable from './SessionTable';
import './Sessions.css';

function SessionStatsCard({ stats }: { stats: { label: string; value: number }[] }) {
  return (
    <div className="session-stats-grid">
      {stats.map((stat) => (
        <div key={stat.label} className="session-stat-card">
          <span className="session-stat-value">{stat.value}</span>
          <span className="session-stat-label">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function Sessions() {
  const {
    sessions,
    stats,
    loading,
    error,
    fetchSessions,
    handleTerminateSession,
  } = useSessions();

  const deviceStats = stats
    ? Object.entries(stats.by_device).map(([label, value]) => ({ label, value }))
    : [];

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

      {stats && <SessionStatsCard stats={deviceStats} />}

      {loading && <p className="content-loading">Loading sessions...</p>}

      <SessionTable
        sessions={sessions}
        onTerminate={handleTerminateSession}
      />
    </section>
  );
}
