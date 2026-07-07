import { Session } from './types';

interface SessionTableProps {
  sessions: Session[];
  onTerminate: (tokenId: string) => void;
}

function getDeviceIcon(deviceType?: string): string {
  switch (deviceType) {
    case 'Mobile': return '\u{1F4F1}';
    case 'Tablet': return '\u{1F4BB}';
    case 'Desktop': return '\u{1F5A5}';
    default: return '\u{1F4BB}';
  }
}

function getBrowserIcon(browser?: string): string {
  switch (browser) {
    case 'Chrome': return '\u{1F310}';
    case 'Firefox': return '\u{1F525}';
    case 'Safari': return '\u{1F310}';
    case 'Edge': return '\u{1F310}';
    default: return '\u{1F310}';
  }
}

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

export default function SessionTable({ sessions, onTerminate }: SessionTableProps) {
  return (
    <div className="content-table-wrapper">
      <table className="content-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Device</th>
            <th>Browser</th>
            <th>Platform</th>
            <th>IP Address</th>
            <th>Last Active</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {sessions.length > 0 ? (
            sessions.map((session) => (
              <tr key={session.id} className={session.is_current ? 'session-current' : ''}>
                <td className="content-table-name">
                  <div>
                    <span>{session.user_name || 'Unknown'}</span>
                    {session.user_email && (
                      <small className="session-email">{session.user_email}</small>
                    )}
                  </div>
                </td>
                <td>
                  <span className="session-device">
                    {getDeviceIcon(session.device_type)} {session.device_type || 'Unknown'}
                  </span>
                </td>
                <td>
                  <span className="session-browser">
                    {getBrowserIcon(session.browser)} {session.browser || 'Unknown'}
                  </span>
                </td>
                <td>{session.platform || 'Unknown'}</td>
                <td className="session-ip">{session.ip_address || 'N/A'}</td>
                <td title={session.last_used_at || ''}>
                  {formatTimeAgo(session.last_used_at)}
                </td>
                <td>
                  <span className={`content-status ${session.is_current ? 'status-current' : 'status-active'}`}>
                    {session.is_current ? 'Current' : 'Active'}
                  </span>
                </td>
                <td>
                  {!session.is_current && (
                    <button
                      type="button"
                      className="content-btn-delete"
                      onClick={() => onTerminate(session.id)}
                    >
                      Terminate
                    </button>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={8} className="content-empty">
                No active sessions found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
