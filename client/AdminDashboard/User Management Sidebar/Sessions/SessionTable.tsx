import { Session } from './types';

interface SessionTableProps {
  sessions: Session[];
  onTerminate: (tokenId: string) => void;
}

export default function SessionTable({ sessions, onTerminate }: SessionTableProps) {
  return (
    <div className="content-table-wrapper">
      <table className="content-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Last Active</th>
            <th>Created At</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {sessions.length > 0 ? (
            sessions.map((session) => (
              <tr key={session.id}>
                <td className="content-table-name">{session.user?.name || 'Unknown'}</td>
                <td>{session.last_used_at ? new Date(session.last_used_at).toLocaleString() : 'Never'}</td>
                <td>{new Date(session.created_at).toLocaleString()}</td>
                <td>
                  <span className="content-status status-active">
                    Active
                  </span>
                </td>
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
