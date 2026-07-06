import { useEffect, useState } from 'react';
import { userAPI, roleAPI } from '../../services/api';
import './User Management.css';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    department: '',
    roles: [],
  });

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getAll({ per_page: 100 });
      const payload = response.data?.data;
      setUsers(Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : []);
      setError('');
    } catch (err) {
      setError('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await roleAPI.getAll();
      const payload = response.data?.data;
      setRoles(Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : []);
    } catch (err) {
      console.error('Failed to load roles:', err);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.department) {
      setError('Name, email, and department are required');
      return;
    }

    if (newUser.roles.length === 0) {
      setError('Please assign at least one role');
      return;
    }

    try {
      setLoading(true);
      const response = await userAPI.create({
        full_name: newUser.name,
        email: newUser.email,
        department: newUser.department,
        role_ids: newUser.roles,
      });
      const emailSent = response.data?.email_sent;
      setShowNewUserForm(false);
      setNewUser({ name: '', email: '', department: '', roles: [] });
      await fetchUsers();
      if (emailSent) {
        setError('');
        alert('User created successfully! Activation email sent to ' + newUser.email);
      } else {
        alert('User created but activation email could not be sent. Check logs for details.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      setLoading(true);
      await userAPI.delete(userId);
      await fetchUsers();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) =>
    (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="content-section" id="users">
      <div className="content-section-header content-section-header-centered">
        <h2 className="content-section-title-centered">User Management</h2>
        <button type="button" className="content-btn-new" onClick={() => setShowNewUserForm(true)}>
          + New User
        </button>
      </div>

      {error && (
        <div className="content-error">
          <p>{error}</p>
          <button onClick={() => setError('')}>Dismiss</button>
        </div>
      )}

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
              </div>
              <div className="content-form-row">
                <label className="content-form-field">
                  <span>Department</span>
                  <input
                    type="text"
                    value={newUser.department}
                    onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                    placeholder="Enter department"
                  />
                </label>
              </div>
              <div className="content-form-row">
                <label className="content-form-field">
                  <span>Assign Roles</span>
                  <div className="content-checkbox-group">
                    {roles.map((role) => (
                      <label key={role.id} className="content-checkbox">
                        <input
                          type="checkbox"
                          checked={newUser.roles.includes(role.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewUser({ ...newUser, roles: [...newUser.roles, role.id] });
                            } else {
                              setNewUser({ ...newUser, roles: newUser.roles.filter((r) => r !== role.id) });
                            }
                          }}
                        />
                        <span>{role.name}</span>
                      </label>
                    ))}
                  </div>
                </label>
              </div>
              <div className="content-form-actions">
                <button type="button" className="content-btn-cancel" onClick={() => setShowNewUserForm(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="content-btn-submit"
                  onClick={handleCreateUser}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create User'}
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

      {loading && <p className="content-loading">Loading...</p>}

      <div className="content-table-wrapper">
        <table className="content-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Roles</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td><span className="content-table-name">{user.full_name}</span></td>
                  <td>{user.email}</td>
                  <td>{user.department}</td>
                  <td>{user.roles && user.roles.length > 0 ? user.roles.map((r) => r.name).join(', ') : 'No roles'}</td>
                  <td>
                    <span className={`content-status ${user.is_active ? 'status-active' : 'status-inactive'}`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="content-actions">
                      <button type="button" className="content-btn-edit">Edit</button>
                      <button
                        type="button"
                        className="content-btn-delete"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="content-empty">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
