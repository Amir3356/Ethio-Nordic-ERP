import { useEffect, useState } from 'react';
import axios from 'axios';
import './Audit Trail Logging.css';

export default function AuditTrailLogging() {
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    axios.get('/Audit.json')
      .then((res) => setAuditLogs(Array.isArray(res.data?.auditLogs) ? res.data.auditLogs : []))
      .catch(() => {});
  }, []);
  return (
    <section className="content-section" id="audit">
      <div className="content-section-header content-section-header-center">
        <h2>Audit Trail Logging</h2>
      </div>
      <p className="content-description">
        Every create, update, approve, or delete action across all 27 ERP modules is intercepted
        by a system-wide audit observer, which records the acting user, timestamp, the module/entity
        affected, and a before/after snapshot of the changed data. Audit records are immutable and
        cannot be edited or deleted, even by system administrators.
      </p>
      <div className="content-table-wrapper">
        <table className="content-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Action</th>
              <th>Module</th>
              <th>Entity</th>
              <th>Entity ID</th>
              <th>Timestamp</th>
              <th>Before</th>
              <th>After</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map((log) => (
              <tr key={log.id}>
                <td className="content-table-name">{log.user}</td>
                <td>
                  <span className={`content-audit-action action-${log.action.toLowerCase()}`}>
                    {log.action}
                  </span>
                </td>
                <td>{log.module}</td>
                <td>{log.entity}</td>
                <td>{log.entityId}</td>
                <td>{log.timestamp}</td>
                <td>{log.beforeSnapshot || '—'}</td>
                <td>{log.afterSnapshot || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
