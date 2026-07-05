import { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldCheck, Search, CircleX, CircleCheck } from 'lucide-react';
import './User & Access Management.css';

export default function UserAccessManagement() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/user.json')
      .then((res) => setUsers(res.data.users))
      .catch((err) => console.error('Failed to load users:', err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) =>
    String(u.name).toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleEditUser = (user) => {
    const nextName = window.prompt('Edit user name', user.name);

    if (nextName === null) {
      return;
    }

    const trimmedName = nextName.trim();

    if (!trimmedName) {
      return;
    }

    setUsers((currentUsers) =>
      currentUsers.map((currentUser) =>
        currentUser.id === user.id ? { ...currentUser, name: trimmedName } : currentUser
      )
    );
  };

  const handleDeleteUser = (user) => {
    const shouldDelete = window.confirm(`Delete ${user.name}?`);

    if (!shouldDelete) {
      return;
    }

    setUsers((currentUsers) => currentUsers.filter((currentUser) => currentUser.id !== user.id));
  };

  return (
    <div className="user-layout">
      <aside className="user-sidebar">
        <a href="/users" onClick={(e) => e.preventDefault()} className="user-sidebar-link">
          <ShieldCheck size={16} />
          User & Access Management
        </a>
      </aside>

      <main className="user-main">
        <div className="user-search-wrap">
          <Search size={16} className="user-search-icon" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="user-search"
          />
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="user-table-wrapper">
            <table className="user-table">
              <thead>
                <tr>
                  <th><span className="user-th">Full Name</span></th>
                  <th><span className="user-th">Email</span></th>
                  <th><span className="user-th">Department</span></th>
                  <th><span className="user-th">Role</span></th>
                  <th><span className="user-th">Status</span></th>
                  <th><span className="user-th">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <td>{String(u.name)}</td>
                    <td className="user-email">{u.email}</td>
                    <td>{u.department || '—'}</td>
                    <td>{u.role}</td>
                    <td>
                      <span className={u.status === 'Active' ? 'user-status-active' : 'user-status-inactive'}>
                        {u.status === 'Active' ? <CircleCheck size={14} /> : <CircleX size={14} />}
                        <span>{u.status}</span>
                      </span>
                    </td>
                    <td>
                      <div className="user-actions">
                        <button
                          type="button"
                          className="user-action-btn user-action-edit"
                          onClick={() => handleEditUser(u)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="user-action-btn user-action-delete"
                          onClick={() => handleDeleteUser(u)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
