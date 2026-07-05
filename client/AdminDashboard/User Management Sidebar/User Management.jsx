import { useEffect, useState } from 'react';
import axios from 'axios';
import './User Management.css';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    department: '',
    roles: [],
  });

  useEffect(() => {
    axios.get('/User.json')
      .then((res) => setUsers(Array.isArray(res.data?.users) ? res.data.users : []))
      .catch(() => {});
  }, []);

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="content-section" id="users">
      <div className="content-section-header content-section-header-centered">
        <h2 className="content-section-title-centered">User Management</h2>
        <button type="button" className="content-btn-new" onClick={() => setShowNewUserForm(true)}>
          + New User
        </button>
      </div>

      {showNewUserForm && (
        <div className="content-modal-backdrop" onClick={() => setShowNewUserForm(false)}>
          <div className="content-modal" onClick={(e) => e.stopPropagation()}>
            <div className="content-modal-header">
              <h3>New User</h3>
              <button type="button" className="content-modal-close" onClick={() => setShowNewUserForm(false)}>×</button>
            </div>
            <div className="content-form">
              <div className="content-form-row">
                <label className="content-form-field">
                  <span>Full Name</span>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="Enter full name"
                  />
                </label>
                <label className="content-form-field">
                  <span>Email</span>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="Enter email"
                  />
                </label>
                <label className="content-form-field">
                  <span>Department</span>
                  <input
                    type="text"
                    value={newUser.department}
                    onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                    placeholder="Enter department"
                  />
                </label>
                <label className="content-form-field">
                  <span>Role</span>
                  <div className="content-checkbox-group">
                    <label className="content-checkbox">
                      <input
                        type="checkbox"
                        checked={newUser.roles.includes('Warehouse Officer')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewUser({ ...newUser, roles: [...newUser.roles, 'Warehouse Officer'] });
                          } else {
                            setNewUser({ ...newUser, roles: newUser.roles.filter((r) => r !== 'Warehouse Officer') });
                          }
                        }}
                      />
                      <span>Warehouse Officer</span>
                    </label>
                    <label className="content-checkbox">
                      <input
                        type="checkbox"
                        checked={newUser.roles.includes('Finance Manager')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewUser({ ...newUser, roles: [...newUser.roles, 'Finance Manager'] });
                          } else {
                            setNewUser({ ...newUser, roles: newUser.roles.filter((r) => r !== 'Finance Manager') });
                          }
                        }}
                      />
                      <span>Finance Manager</span>
                    </label>
                    <label className="content-checkbox">
                      <input
                        type="checkbox"
                        checked={newUser.roles.includes('Regulatory Affairs Officer')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewUser({ ...newUser, roles: [...newUser.roles, 'Regulatory Affairs Officer'] });
                          } else {
                            setNewUser({ ...newUser, roles: newUser.roles.filter((r) => r !== 'Regulatory Affairs Officer') });
                          }
                        }}
                      />
                      <span>Regulatory Affairs Officer</span>
                    </label>
                  </div>
                </label>
              </div>
              <div className="content-form-actions">
                <button type="button" className="content-btn-cancel" onClick={() => setShowNewUserForm(false)}>
                  Cancel
                </button>
                <button type="button" className="content-btn-submit" onClick={() => { setShowNewUserForm(false); setNewUser({ name: '', email: '', department: '', roles: [] }); }}>
                  Create User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="content-search">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="content-search-input"
        />
      </div>

      <div className="content-table-wrapper">
        <table className="content-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Role</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td className="content-table-name">{user.name}</td>
                <td>{user.email}</td>
                <td>{user.department}</td>
                <td><span className="content-badge">{user.role}</span></td>
                <td>
                  <span className={`content-status ${user.status === 'Active' ? 'status-active' : 'status-inactive'}`}>
                    {user.status}
                  </span>
                </td>
                <td>
                  <div className="content-actions">
                    <button type="button" className="content-btn-edit">Edit</button>
                    <button type="button" className="content-btn-delete">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
