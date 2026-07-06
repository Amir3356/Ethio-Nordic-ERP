import { useEffect, useState } from 'react';
import { auditLogAPI } from '../../services/api';
import './Audit Trail Logging.css';

interface AuditLog {
  id: number;
  user_email: string;
  action: string;
  model_type: string;
  model_id: number;
  old_values: Record<string, unknown>;
  new_values: Record<string, unknown>;
  created_at: string;
}

export default function AuditTrailLogging() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await auditLogAPI.getAll({ per_page: 100, sort: '-created_at' });
      setAuditLogs(Array.isArray(response.data?.data) ? response.data.data : []);
      setError('');
    } catch (err) {
      setError('Failed to load audit logs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = auditLogs.filter((log) =>
    log.user_email?.toLowerCase().includes(filter.toLowerCase()) ||
    log.action?.toLowerCase().includes(filter.toLowerCase()) ||
    log.model_type?.toLowerCase().includes(filter.toLowerCase())
  );

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

      <div className="content-search">
        <input
          type="text"
          placeholder="Filter by user, action, or module..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="content-search-input"
        />
      </div>

      {loading && <p className="content-loading">Loading audit logs...</p>}

      <div className="content-table-wrapper">
        <table className="content-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Action</th>
              <th>Module</th>
              <th>Record ID</th>
              <th>Timestamp</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td className="content-table-name">{log.user_email || 'System'}</td>
                  <td>
                    <span className={`content-audit-action action-${log.action?.toLowerCase() || 'unknown'}`}>
                      {log.action || 'N/A'}
                    </span>
                  </td>
                  <td>{log.model_type || 'N/A'}</td>
                  <td>{log.model_id || 'N/A'}</td>
                  <td>{new Date(log.created_at).toLocaleString()}</td>
                  <td>
                    <button
                      type="button"
                      className="content-btn-view"
                      title={`Before: ${JSON.stringify(log.old_values || {})}\nAfter: ${JSON.stringify(log.new_values || {})}`}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="content-empty">
                  No audit logs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
