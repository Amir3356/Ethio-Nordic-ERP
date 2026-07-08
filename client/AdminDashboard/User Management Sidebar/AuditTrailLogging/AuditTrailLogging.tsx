import { useAuditLogs } from './hooks/useAuditLogs';
import AuditLogTable from './AuditLogTable';
import './AuditTrailLogging.css';

export default function AuditTrailLogging() {
  const {
    auditLogs,
    loading,
    error,
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

      {loading && <p className="content-loading">Loading audit logs...</p>}

      <AuditLogTable logs={auditLogs} />
    </section>
  );
}
