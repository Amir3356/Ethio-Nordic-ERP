import { AuditLog } from './types';
import { getActionClass, formatDateTime, formatDetails } from './utils';

interface AuditLogTableProps {
  logs: AuditLog[];
}

export default function AuditLogTable({ logs }: AuditLogTableProps) {
  return (
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
          {logs.length > 0 ? (
            logs.map((log) => (
              <tr key={log.id}>
                <td className="content-table-name">{log.user_email || 'System'}</td>
                <td>
                  <span className={getActionClass(log.action)}>
                    {log.action || 'N/A'}
                  </span>
                </td>
                <td>{log.model_type || 'N/A'}</td>
                <td>{log.model_id || 'N/A'}</td>
                <td>{formatDateTime(log.created_at)}</td>
                <td>
                  <button
                    type="button"
                    className="content-btn-view"
                    title={formatDetails(log)}
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
  );
}
