import { useEffect, useState } from 'react';
import axios from 'axios';
import './Sessions.css';

export default function Sessions() {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    axios.get('/Session.json')
      .then((res) => setSessions(Array.isArray(res.data?.sessions) ? res.data.sessions : []))
      .catch(() => {});
  }, []);
  return (
    <section className="content-section" id="sessions">
      <div className="content-section-header content-section-header-center">
        <h2>Sessions</h2>
      </div>
      <div className="content-table-wrapper">
        <table className="content-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Device</th>
              <th>Location</th>
              <th>Last Active</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.id}>
                <td className="content-table-name">{session.user}</td>
                <td>{session.device}</td>
                <td>{session.location}</td>
                <td>{session.lastActive}</td>
                <td>
                  <span className={`content-status ${session.status === 'Active' ? 'status-active' : 'status-idle'}`}>
                    {session.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
