import { Session } from './types';

interface SessionTableProps {
  sessions: Session[];
  onTerminate: (tokenId: string) => void;
}

function getDeviceIcon(deviceType?: string): string {
  switch (deviceType) {
    // Specific mobile devices
    case 'iPhone': return '\u{1F4F1}';
    case 'Android Phone': return '\u{1F4F1}';
    case 'Mobile Device': return '\u{1F4F1}';

    // Tablets
    case 'iPad': return '\u{1F4BB}';
    case 'Android Tablet': return '\u{1F4BB}';
    case 'Tablet': return '\u{1F4BB}';

    // Desktop computers
    case 'Windows PC': return '\u{1F5A5}';
    case 'Mac': return '\u{1F34E}';
    case 'Linux PC': return '\u{1F427}';
    case 'Chromebook': return '\u{1F4BB}';
    case 'Desktop': return '\u{1F5A5}';

    default: return '\u{1F4BB}';
  }
}

export default function SessionTable({ sessions, onTerminate }: SessionTableProps) {
  return (
    <div className="content-table-wrapper">
      <table className="content-table">
        <thead>
          <tr>
            <th>user</th>
            <th>Email</th>
            <th>Device</th>
            <th>Location</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {sessions.length > 0 ? (
            sessions.map((session) => (
              <tr key={session.id} className={session.is_current ? 'session-current' : ''}>
                <td className="content-table-name">
                  {session.user_name || 'Unknown'}
                  {session.is_current && <span className="session-current-badge">(Current)</span>}
                </td>
                <td>{session.user_email || 'N/A'}</td>
                <td>
                  <span className="session-device">
                    {getDeviceIcon(session.device_type)} {session.device_type || 'Unknown'}
                  </span>
                </td>
                <td className="session-location">{session.location || 'Unknown'}</td>
                <td>
                  <button
                    type="button"
                    className="content-btn-delete"
                    onClick={() => onTerminate(session.id)}
                  >
                    Terminate
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="content-empty">
                No active sessions found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
