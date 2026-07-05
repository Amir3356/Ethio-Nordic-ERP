import { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, LogOut, User, Package } from 'lucide-react';
import './AdminDashboardLayout.css';

export default function Layout({ children }) {
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeSection, setActiveSection] = useState('users');
  const [periodic, setPeriodic] = useState(null);
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    department: '',
    role: 'Viewer',
  });
  const [inventory, setInventory] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    axios.get('/User.json')
      .then((res) => setUsers(Array.isArray(res.data?.users) ? res.data.users : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    axios.get('/Session.json')
      .then((res) => setSessions(Array.isArray(res.data?.sessions) ? res.data.sessions : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    axios.get('/Periodic.json')
      .then((res) => setPeriodic(res.data || null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    axios.get('/inventory.json')
      .then((res) => setInventory(res.data || null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    axios.get('/Audit.json')
      .then((res) => setAuditLogs(Array.isArray(res.data?.auditLogs) ? res.data.auditLogs : []))
      .catch(() => {});
  }, []);

  const activeSessions = sessions.filter((s) => s.status === 'Active').length;
  const activeUsers = users.filter((u) => u.status === 'Active').length;

  return (
    <div className="layout">
      <aside className="layout-sidebar">
        <div className="sidebar-brand">
          <h1 className="sidebar-title">Admin Dashboard</h1>
        </div>

        <section className="sidebar-section">
          <ul className="sidebar-links">
            <li><a href="#users" onClick={(e) => { e.preventDefault(); setActiveSection('users'); }} className={activeSection === 'users' ? 'active' : ''}><Users size={16} /> User Management</a></li>
            <li><a href="#inventory" onClick={(e) => { e.preventDefault(); setActiveSection('inventory'); }} className={activeSection === 'inventory' ? 'active' : ''}><Package size={16} /> Inventory</a></li>
          </ul>
        </section>

        <div className="sidebar-bottom">
          <a href="/profile" onClick={(e) => e.preventDefault()} className="sidebar-bottom-link">
            <User size={16} />
            <span>Profile</span>
          </a>
          <a href="/logout" className="sidebar-bottom-link sidebar-logout">
            <LogOut size={16} />
            <span>Logout</span>
          </a>
        </div>
      </aside>

      <main className="layout-main">
        {activeSection === 'users' && (
          <>
            <section className="content-section" id="users">
              <div className="content-section-header">
                <h2>User Management</h2>
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
                          <span>Initial Role</span>
                          <select
                            value={newUser.role}
                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                          >
                            <option value="Admin">Admin</option>
                            <option value="Editor">Editor</option>
                            <option value="Viewer">Viewer</option>
                          </select>
                        </label>
                      </div>
                      <div className="content-form-actions">
                        <button type="button" className="content-btn-cancel" onClick={() => setShowNewUserForm(false)}>
                          Cancel
                        </button>
                        <button type="button" className="content-btn-submit" onClick={() => { setShowNewUserForm(false); setNewUser({ name: '', email: '', department: '', role: 'Viewer' }); }}>
                          Create User
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="content-table-wrapper">
                <table className="content-table">
                  <thead>
                    <tr>
                      <th> Full Name</th>
                      <th>Email</th>
                      <th>Department</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
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

            <section className="content-section" id="sessions">
              <div className="content-section-header" style={{ justifyContent: 'center' }}>
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

            <section className="content-section" id="audit">
              <div className="content-section-header" style={{ justifyContent: 'center' }}>
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

            <section className="content-section" id="periodic">
              <div className="content-section-header">
                <h2>Periodic Access Review</h2>
              </div>
              <p className="content-description">
                On a scheduled basis, the system generates an access review report listing all users,
                their assigned roles, and last login date, enabling management to identify dormant
                accounts or excessive privilege accumulation ('privilege creep') for remediation.
              </p>

              {periodic ? (
                <>
                  <div className="content-summary-grid">
                    <div className="content-summary-card">
                      <span className="content-summary-value">{periodic.summary.totalUsers}</span>
                      <span className="content-summary-label">Total Users</span>
                    </div>
                    <div className="content-summary-card">
                      <span className="content-summary-value">{periodic.summary.activeUsers}</span>
                      <span className="content-summary-label">Active</span>
                    </div>
                    <div className="content-summary-card">
                      <span className="content-summary-value">{periodic.summary.dormantAccounts}</span>
                      <span className="content-summary-label">Dormant</span>
                    </div>
                    <div className="content-summary-card">
                      <span className="content-summary-value">{periodic.summary.privilegeCreepFlags}</span>
                      <span className="content-summary-label">Privilege Creep</span>
                    </div>
                    <div className="content-summary-card">
                      <span className="content-summary-value">{periodic.summary.rolesNeedingReview}</span>
                      <span className="content-summary-label">To Review</span>
                    </div>
                  </div>

                  <div className="content-table-wrapper">
                    <table className="content-table">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Role</th>
                          <th>Last Login</th>
                          <th>Days</th>
                          <th>Risk</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {periodic.reviews.map((review) => (
                          <tr key={review.id}>
                            <td className="content-table-name">{review.name}</td>
                            <td><span className="content-badge">{review.role}</span></td>
                            <td>{review.lastLoginDisplay}</td>
                            <td>{review.daysSinceLastLogin}</td>
                            <td>
                              <span className={`content-risk risk-${review.riskLevel.toLowerCase()}`}>
                                {review.riskLevel}
                              </span>
                            </td>
                            <td>
                              <span className={`content-review-status ${review.reviewStatus === 'Approved' ? 'approved' : review.reviewStatus === 'Flagged for Remediation' ? 'flagged' : 'pending'}`}>
                                {review.reviewStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p className="content-loading">Loading periodic review data...</p>
              )}
            </section>
          </>
        )}

        {activeSection === 'inventory' && (
          <section className="content-section" id="inventory">
            <div className="content-section-header">
              <h2>Inventory Management</h2>
            </div>

            {inventory ? (
              <>
                <p className="content-description">{inventory.description}</p>

                <h3 className="content-subtitle">Functional Scope</h3>
                <div className="content-grid">
                  {inventory.functionalScope.map((item) => (
                    <div key={item.title} className="content-card">
                      <h4>{item.title}</h4>
                      <p>{item.description}</p>
                    </div>
                  ))}
                </div>

                <h3 className="content-subtitle">Workflow Steps</h3>
                <div className="content-workflow">
                  {inventory.detailedWorkflow.map((step) => (
                    <div key={step.step} className="content-workflow-item">
                      <span className="content-workflow-step">{step.step}</span>
                      <p>{step.description}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="content-loading">Loading inventory data...</p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
