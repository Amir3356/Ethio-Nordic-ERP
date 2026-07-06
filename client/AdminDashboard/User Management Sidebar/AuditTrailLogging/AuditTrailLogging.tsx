import { useAuditLogs } from './hooks/useAuditLogs';
import AuditLogSearch from './AuditLogSearch';
import AuditLogTable from './AuditLogTable';
import './AuditTrailLogging.css';

export default function AuditTrailLogging() {
  const {
    filteredLogs,
    loading,
    error,
    filter,
    setFilter,
    fetchAuditLogs,
  } = useAuditLogs();

  return (
    <section className="content-section" id="audit">
      <div className="content-section-header content-section-header-center">
        <h2>Audit Trail Logging</h2>
      </div>

      {error && (
        <div className="content-error">
          <p>{error}</p>
          <button onClick={fetchAuditLogs}>Retry</button>
        </div>
      )}

      <AuditLogSearch value={filter} onChange={setFilter} />

      {loading && <p className="content-loading">Loading audit logs...</p>}

      <AuditLogTable logs={filteredLogs} />
    </section>
  );
}
