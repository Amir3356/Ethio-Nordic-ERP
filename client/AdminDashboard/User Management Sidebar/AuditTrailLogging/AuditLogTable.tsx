import { AuditLog } from './types';
import { getActionClass, formatDateTime } from './utils';

interface AuditLogTableProps {
  logs: AuditLog[];
}

export default function AuditLogTable({ logs }: AuditLogTableProps) {
  return (
    <div className="content-table-wrapper">
      <table className="content-table">
        <thead>
          <tr>
            <th>Full Name</th>
            <th>Email</th>
            <th>Action</th>
            <th>Module</th>
            <th>Before Data</th>
            <th>After Data</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {logs.length > 0 ? (
            logs.map((log) => (
              <tr key={log.id}>
                <td>{log.full_name || 'N/A'}</td>
                <td className="content-table-name">{log.email || 'System'}</td>
                <td>
                  <span className={getActionClass(log.action)}>
                    {log.action || 'N/A'}
                  </span>
                </td>
                <td>{log.model_type || 'N/A'}</td>
                <td className="content-json-cell">{JSON.stringify(log.before_data || {}, null, 2)}</td>
                <td className="content-json-cell">{JSON.stringify(log.after_data || {}, null, 2)}</td>
                <td>{formatDateTime(log.created_at)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} className="content-empty">
                No audit logs found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
